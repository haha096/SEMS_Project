from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from lightgbm import LGBMRegressor
from fastapi.responses import StreamingResponse, JSONResponse
from contextlib import contextmanager
from forecast_graph import generate_graph
from datetime import datetime, timedelta
from bisect import bisect_left
import mysql.connector as mysql
import io

app = FastAPI(title="Forecast Service")

class Point(BaseModel):
    ts: str
    out_temp: Optional[float] = None
    out_hum:  Optional[float] = None
    in_temp:  Optional[float] = None
    in_hum:   Optional[float] = None

class Req(BaseModel):
    freq: str = "10min"
    horizon_minutes: int = 1440
    target: str = "in_temp"   # "in_temp" or "in_hum"
    series: List[Point]

def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    # hour/dow + cyclic
    df["hour"] = df.index.hour
    df["dow"]  = df.index.dayofweek
    # cyclic transform for hour (0~23)
    df["hour_sin"] = np.sin(2*np.pi*df["hour"]/24.0)
    df["hour_cos"] = np.cos(2*np.pi*df["hour"]/24.0)
    return df

def make_features(df: pd.DataFrame, target: str):
    df = df.sort_values("ts")
    df["ts"] = pd.to_datetime(df["ts"])
    df = df.set_index("ts").asfreq("10min")

    # interpolate known cols
    for col in ["out_temp","out_hum","in_temp","in_hum"]:
        if col in df.columns:
            df[col] = df[col].interpolate(limit_direction="both")

    # target
    ycol = "in_temp" if target == "in_temp" else "in_hum"
    df["y"] = df[ycol]

    # lags & moving averages
    for l in [1,2,3,4,5,6]:
        df[f"y_lag{l}"] = df["y"].shift(l)
    for w in [3,6,12]:
        df[f"y_ma{w}"] = df["y"].rolling(w).mean()

    df = add_time_features(df)
    df = df.dropna()

    X = df.drop(columns=["y"])
    y = df["y"]
    return df, X, y

def rollout(model, last_df: pd.DataFrame, steps: int, feature_cols: List[str]):
    """
    - 실외(out_temp/out_hum)는 가능하면 t-24h 값을 사용 (계절성 반영),
      없으면 마지막 관측값으로 보간.
    - 학습 컬럼 순서(feature_cols)를 그대로 사용하여 예측 시 shape mismatch 방지.
    """
    df = last_df.copy()
    out = []

    # 24시간(=1440분) 오프셋
    offset = pd.Timedelta(minutes=1440)

    # 마지막 관측값(백업)
    last_out_temp = df["out_temp"].iloc[-1] if "out_temp" in df.columns else None
    last_out_hum  = df["out_hum"].iloc[-1]  if "out_hum"  in df.columns else None

    # 미래 인덱스
    future_idx = pd.date_range(df.index[-1] + pd.to_timedelta("10min"),
                               periods=steps, freq="10min")

    # 최근 y(롤아웃용)
    recent_y = df["y"].iloc[-12:].tolist()

    for ts in future_idx:
        row = {}

        # --- 외생(실외) 경로: t-24h가 있으면 그 값 사용 ---
        ref_ts = ts - offset
        if "out_temp" in df.columns:
            if ref_ts in df.index and not pd.isna(df.loc[ref_ts, "out_temp"]):
                row["out_temp"] = float(df.loc[ref_ts, "out_temp"])
            else:
                row["out_temp"] = float(last_out_temp) if last_out_temp is not None else np.nan
        if "out_hum" in df.columns:
            if ref_ts in df.index and not pd.isna(df.loc[ref_ts, "out_hum"]):
                row["out_hum"] = float(df.loc[ref_ts, "out_hum"])
            else:
                row["out_hum"] = float(last_out_hum) if last_out_hum is not None else np.nan

        # --- 시각 특성 ---
        row["hour"] = ts.hour
        row["dow"]  = ts.dayofweek
        row["hour_sin"] = np.sin(2*np.pi*row["hour"]/24.0)
        row["hour_cos"] = np.cos(2*np.pi*row["hour"]/24.0)

        # --- y의 lag / ma (최근 예측 포함) ---
        recent_series = pd.Series(recent_y)
        for l in [1,2,3,4,5,6]:
            row[f"y_lag{l}"] = float(recent_series.iloc[-l]) if len(recent_series) >= l else float(recent_series.iloc[-1])
        for w in [3,6,12]:
            row[f"y_ma{w}"] = float(recent_series.iloc[-w:].mean()) if len(recent_series) >= 1 else np.nan

        # 예측 시 feature_cols 순서대로 DataFrame 구성
        X_row = pd.DataFrame([[row.get(c, np.nan) for c in feature_cols]], columns=feature_cols)

        # 예측
        yhat = float(model.predict(X_row)[0])
        out.append({"ts": ts.isoformat(), "yhat": yhat})

        # 다음 스텝을 위해 recent_y 업데이트
        recent_y.append(yhat)
        if len(recent_y) > 64:  # 메모리 보호용
            recent_y = recent_y[-32:]

        # 디버깅 원하면: print(ts, row["out_temp"], row["out_hum"], yhat)

    return out

def naive_forecast(req: Req):
    steps = req.horizon_minutes // 10
    last = req.series[-1]
    last_ts = pd.to_datetime(last.ts)
    last_val = last.in_temp if req.target == "in_temp" else last.in_hum
    if last_val is None:
        for p in reversed(req.series):
            v = p.in_temp if req.target == "in_temp" else p.in_hum
            if v is not None:
                last_val = v; break
    if last_val is None:
        return []
    return [{"ts": (last_ts + pd.to_timedelta(f"{i*10}min")).isoformat(), "yhat": float(last_val)} for i in range(1, steps+1)]

@app.post("/forecast/gbdt")
def forecast(req: Req):
    # 12포인트 미만이면 바로 나이브
    if len(req.series) < 12:
        return naive_forecast(req)

    df = pd.DataFrame([s.dict() for s in req.series])
    df_feat, X, y = make_features(df, req.target)

    # 데이터 진단: y가 너무 평평하면 나이브
    y_std = float(y.std()) if len(y) > 1 else 0.0
    # print(f"[DEBUG] train rows={len(y)} std={y_std:.4f} Xcols={list(X.columns)}")
    if y_std < 0.05:
        return naive_forecast(req)

    # 모델 학습
    model = LGBMRegressor(
        n_estimators=500,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=20,
        subsample=0.8,
        subsample_freq=1,
        colsample_bytree=0.9,
        random_state=42,
        verbosity=-1               # ← LightGBM 로그 끄기
    )
    model.fit(X, y)

    steps = req.horizon_minutes // 10
    # 학습 때의 컬럼 순서를 그대로 사용
    return rollout(model, df_feat, steps, feature_cols=list(X.columns))


# ----------------------
# DB 연결/조회/곡선 생성
# ----------------------

DB = dict(host="127.0.0.1", user="root", password="root", database="springdb")
PAST_HOURS = 6
STEP_MIN   = 10

@contextmanager
def get_conn():
    conn = mysql.connect(**DB)
    try:
        yield conn
    finally:
        try: conn.close()
        except: pass

def q(conn, sql, params=()):
    cur = conn.cursor()
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    return rows

def fetch_past_indoor(conn, metric):
    col = "avg_temperature" if metric=="temp" else "avg_humidity"
    sql = f"""
      SELECT timestamp AS ts, {col} AS y
      FROM environment_data
      WHERE timestamp >= NOW() - INTERVAL {PAST_HOURS} HOUR
      ORDER BY ts
    """
    return q(conn, sql)

def fetch_past_outdoor(conn, metric):
    # weather_current의 컬럼명이 다르면 여기만 바꾸세요.
    col = "temp" if metric=="temp" else "hum"
    sql = f"""
      SELECT observed_at AS ts, {col} AS y
      FROM weather_current
      WHERE observed_at >= NOW() - INTERVAL {PAST_HOURS} HOUR
      ORDER BY ts
    """
    return q(conn, sql)

def fetch_forecast_h(conn, metric, date_str, h):
    cols = ("temp_1h","temp_6h","temp_24h") if metric=="temp" else ("hum_1h","hum_6h","hum_24h")
    if   h==1:  colh, off = cols[0], "1 HOUR"
    elif h==6:  colh, off = cols[1], "6 HOUR"
    elif h==24: colh, off = cols[2], "24 HOUR"
    else: raise ValueError("h must be 1, 6, or 24")
    sql = f"""
    WITH f AS (
      SELECT DATE_ADD(current, INTERVAL {off}) AS ts, {colh} AS yhat, current AS base_current
      FROM weather_forecast
      WHERE current >= TIMESTAMP(%s,'00:00:00') AND current < TIMESTAMP(%s,'23:59:59')
    ),
    r AS (
      SELECT ts, yhat, ROW_NUMBER() OVER (PARTITION BY ts ORDER BY base_current DESC) rn
      FROM f
    )
    SELECT ts, yhat FROM r WHERE rn=1 ORDER BY ts
    """
    return q(conn, sql, (date_str, date_str))

def _to_map(rows):
    # [(ts, y)] -> {ts: float(y) or None}
    out = {}
    for ts, y in rows:
        out[ts] = float(y) if (y is not None) else None
    return out

def _nearest(m, t, tol=None):
    if not m:
        return None
    if tol is None:
        tol = timedelta(minutes=max(5, STEP_MIN))  # 기존 5분 → step_min 기준
    keys = sorted(m.keys())
    i = bisect_left(keys, t)
    cand = []
    if i < len(keys): cand.append(keys[i])
    if i > 0:         cand.append(keys[i-1])
    if not cand: return None
    best = min(cand, key=lambda k: abs(k - t))
    return m[best] if abs(best - t) <= tol else None

def _w(t, a, b):
    if t <= a: return 1.0
    if t >= b: return 0.0
    return (b - t) / (b - a)

def _blend(a, b, w):
    """a,b 중 None이 있으면 다른 한쪽을 사용. 둘 다 None이면 None."""
    if a is None and b is None:
        return None
    if a is None:
        return float(b)
    if b is None:
        return float(a)
    return float(w)*float(a) + float(1.0 - w)*float(b)


def build_forecast_curve(h1_rows, h6_rows, h24_rows, metric="temp", step_min=STEP_MIN):
    m1, m6, m24 = _to_map(h1_rows), _to_map(h6_rows), _to_map(h24_rows)
    now = datetime.now().replace(second=0, microsecond=0)
    t   = now
    end = now + timedelta(hours=24)
    out = []

    while t <= end:
        dh  = t - now
        y1  = _nearest(m1,  t)
        y6  = _nearest(m6,  t)
        y24 = _nearest(m24, t)

        if dh <= timedelta(hours=3):            # 0~3h : 1h 주도
            y = y1 if y1 is not None else y6 if y6 is not None else y24
        elif dh <= timedelta(hours=5):          # 3~5h : 1h→6h 블렌드(안전)
            w = _w(dh, timedelta(hours=3), timedelta(hours=5))
            y = _blend(y1, y6, w)
        elif dh <= timedelta(hours=15):         # 5~15h : 6h 주도
            y = y6 if y6 is not None else y1 if y1 is not None else y24
        elif dh <= timedelta(hours=17):         # 15~17h : 6h→24h 블렌드(안전)
            w = _w(dh, timedelta(hours=15), timedelta(hours=17))
            y = _blend(y6, y24, w)
        else:                                   # 17~24h : 24h 주도
            y = y24 if y24 is not None else y6 if y6 is not None else y1

        if y is not None:
            if metric == "temp":
                y = max(-20, min(50, y)); alert = (y >= 30) or (y <= 18)
            else:
                y = max(0, 100 if y is None else min(100, y)); alert = (y >= 70) or (y <= 35)
            out.append((t, round(float(y), 2), alert))

        t += timedelta(minutes=step_min)

    return out

# ----------------------
# (C) API
# ----------------------
@app.get("/forecast/plot")
def plot_endpoint(date: Optional[str] = None, metric: str = "temp"):
    date_str = date or datetime.now().strftime("%Y-%m-%d")
    with get_conn() as conn:
        past_in  = fetch_past_indoor(conn, metric)
        past_out = fetch_past_outdoor(conn, metric)
        h1 = fetch_forecast_h(conn, metric, date_str, 1)
        h6 = fetch_forecast_h(conn, metric, date_str, 6)
        h24= fetch_forecast_h(conn, metric, date_str, 24)
    curve = build_forecast_curve(h1, h6, h24, metric=metric, step_min=STEP_MIN)
    png_bytes = generate_graph(past_in, past_out, curve, metric=metric)
    return StreamingResponse(io.BytesIO(png_bytes), media_type="image/png")

@app.get("/forecast/curve")
def curve_endpoint(date: Optional[str] = None, metric: str = "temp"):
    date_str = date or datetime.now().strftime("%Y-%m-%d")
    with get_conn() as conn:
        past_in  = fetch_past_indoor(conn, metric)
        past_out = fetch_past_outdoor(conn, metric)
        h1 = fetch_forecast_h(conn, metric, date_str, 1)
        h6 = fetch_forecast_h(conn, metric, date_str, 6)
        h24= fetch_forecast_h(conn, metric, date_str, 24)
    curve = build_forecast_curve(h1, h6, h24, metric=metric, step_min=STEP_MIN)
    def to_dict(rows,key): return [ {"ts": str(ts), key: y} for ts,y in rows ]
    return JSONResponse({
        "past_indoor":  to_dict(past_in,  "indoor"),
        "past_outdoor": to_dict(past_out, "outdoor"),
        "forecast": [ {"ts": t.strftime("%Y-%m-%d %H:%M:%S"), "forecast": y, "alert": alert}
                      for (t,y,alert) in curve ]
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("forecast_service:app", host="0.0.0.0", port=8001, reload=True)