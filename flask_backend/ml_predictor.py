# ml_predictor.py
import os
import joblib
import numpy as np
import pandas as pd
import pymysql
from datetime import datetime, timedelta

class MLPredictor:
    def __init__(self, model_path: str, db_conn_kwargs: dict, horizon_min: int = 10):
        self.model_path = model_path
        self.horizon_min = horizon_min
        self.db = db_conn_kwargs
        self.bundle = None
        self.model = None
        self.features = None
        self._load()

    def _load(self):
        if not os.path.exists(self.model_path):
            print(f"[ml] model file not found: {self.model_path}")
            return
        self.bundle = joblib.load(self.model_path)
        self.model = self.bundle["model"]
        self.features = self.bundle["features"]
        print(f"[ml] loaded model: {self.model_path} features={self.features}")

    def available(self):
        return self.model is not None

    def _fetch_recent(self, room: str, minutes: int = 30):
        conn = pymysql.connect(**self.db)
        end = datetime.now()
        start = end - timedelta(minutes=minutes)
        try:
            with conn.cursor() as cur:
                sql = """
                SELECT ts, pm25_in, pm10_in, temp, rh, pm25_out, pm10_out, fan
                FROM sensor_snapshot
                WHERE room=%s AND ts BETWEEN %s AND %s
                ORDER BY ts ASC
                """
                cur.execute(sql, (room, start, end))
                rows = cur.fetchall()
                df = pd.DataFrame(rows, columns=["ts","pm25_in","pm10_in","temp","rh",
                                                 "pm25_out","pm10_out","fan"])
                return df
        finally:
            conn.close()

    def _build_online_features(self, room: str, indoor: dict, outdoor: dict):
        # 최근 윈도우로 이동평균/증감률 계산
        df = self._fetch_recent(room, minutes=30)
        # 현재 관측을 마지막 행으로 붙임 (rolling 계산 안정화)
        now = datetime.now()
        cur = {k: indoor.get(k) for k in ["pm25","pm10","temp","rh"]}
        cur_out = {k: outdoor.get(k) for k in ["pm25","pm10"]}
        row = {
            "ts": now,
            "pm25_in": cur["pm25"],
            "pm10_in": cur["pm10"],
            "temp": cur["temp"],
            "rh": cur["rh"],
            "pm25_out": cur_out["pm25"],
            "pm10_out": cur_out["pm10"],
            "fan": df["fan"].iloc[-1] if not df.empty else 1,
        }
        df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)

        # 이동평균/차분
        df["pm25_in_ma6"]  = df["pm25_in"].rolling(6, min_periods=1).mean()
        df["pm25_in_ma16"] = df["pm25_in"].rolling(16, min_periods=1).mean()
        df["pm25_in_diff1"]= df["pm25_in"].diff(1)
        df["hour_of_day"]  = df["ts"].dt.hour

        # 마지막 행(=현재)에 대한 피처 벡터
        x = df.iloc[-1:][self.features].fillna(method="bfill").fillna(method="ffill").fillna(0.0)
        return x

    def predict_pm25_ahead(self, room: str, indoor: dict, outdoor: dict) -> float:
        if not self.available():
            raise RuntimeError("ML model not loaded")
        X = self._build_online_features(room, indoor, outdoor)
        yhat = float(self.model.predict(X)[0])
        return max(0.0, yhat)

    def decide_fan(self, room: str, indoor: dict, outdoor: dict,
                   target_pm25: float, deadband: float,
                   block_max: int) -> dict:
        """
        간단한 레벨 추정: 현재 fan ~ fan+1 ~ fan+2 시나리오의 '경험적 델타'를 못 쓰는 경우,
        우선은 yhat만 보고 '몇 단이면 충분할까'를 휴리스틱으로 보정.
        (초기 버전: threshold 기반, 이후 경험통계/시뮬레이션으로 개선)
        """
        yhat = self.predict_pm25_ahead(room, indoor, outdoor)
        # 휴리스틱: 현재 pm25 대비 yhat이 높으면 상향, 낮으면 유지/하향
        cur = indoor.get("pm25")
        if cur is None:
            cur = yhat

        # 간단 휴리스틱 (원하면 교체/고도화)
        if yhat > target_pm25 + 5:
            fan = 3
        elif yhat > target_pm25 + deadband:
            fan = 2
        else:
            fan = 1

        fan = int(max(1, min(block_max, fan)))
        return {
            "fan": fan,
            "yhat": yhat,
            "reason_ml": f"ŷ10={yhat:.1f} (target {target_pm25}) → fan {fan}"
        }
