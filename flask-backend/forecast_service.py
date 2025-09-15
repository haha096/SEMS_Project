from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from lightgbm import LGBMRegressor

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("forecast_service:app", host="0.0.0.0", port=8001, reload=True)