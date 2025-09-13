from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from lightgbm import LGBMRegressor

app = FastAPI(title="Forecast Service")

class Point(BaseModel):
    ts: str
    out_temp: Optional[float] = None
    out_hum:  Optional[float] = None
    in_temp:  Optional[float] = None   # 추가
    in_hum:   Optional[float] = None   # 추가

class Req(BaseModel):
    freq: str = "10min"
    horizon_minutes: int = 1440
    target: str = "in_temp"            # "in_temp" 또는 "in_hum"
    series: List[Point]

def make_features(df: pd.DataFrame, target: str):
    df = df.sort_values("ts")
    df["ts"] = pd.to_datetime(df["ts"])
    df = df.set_index("ts").asfreq("10min")

    # 결측 보간
    for col in ["out_temp","out_hum","in_temp","in_hum"]:
        if col in df.columns:
            df[col] = df[col].interpolate(limit_direction="both")

    # 예측 목표(y) = 실내
    ycol = "in_temp" if target == "in_temp" else "in_hum"
    df["y"] = df[ycol]

    # y의 시차/이동평균 + 외생(실외) 특성
    for l in [1,2,3,4,5,6]:
        df[f"y_lag{l}"] = df["y"].shift(l)
    for w in [3,6,12]:
        df[f"y_ma{w}"]  = df["y"].rolling(w).mean()

    df["hour"] = df.index.hour
    df["dow"]  = df.index.dayofweek

    df = df.dropna()
    X = df.drop(columns=["y"])
    y = df["y"]
    return df, X, y

def rollout(model, last_df: pd.DataFrame, steps: int):
    future_idx = pd.date_range(last_df.index[-1] + pd.to_timedelta("10min"), periods=steps, freq="10min")
    df = last_df.copy()
    out = []
    for ts in future_idx:
        # 실외는 마지막 관측값을 유지(간단 버전)
        row = {
            "out_temp": df["out_temp"].iloc[-1],
            "out_hum":  df["out_hum"].iloc[-1],
            "hour": ts.hour, "dow": ts.dayofweek
        }
        recent = df["y"].iloc[-12:]
        for l in [1,2,3,4,5,6]:
            row[f"y_lag{l}"] = recent.iloc[-l]
        for w in [3,6,12]:
            row[f"y_ma{w}"]  = recent.iloc[-w:].mean()

        yhat = float(model.predict(pd.DataFrame([row]))[0])
        out.append({"ts": ts.isoformat(), "yhat": yhat})

        # 다음 스텝 생성을 위해 예측값을 y로 이어붙임
        df = pd.concat([df, pd.DataFrame([{"y": yhat, **row}], index=[ts])])
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
    if len(req.series) < 12:
        return naive_forecast(req)
    df = pd.DataFrame([s.dict() for s in req.series])
    df_feat, X, y = make_features(df, req.target)
    model = LGBMRegressor(n_estimators=400, learning_rate=0.05)
    model.fit(X, y)
    steps = req.horizon_minutes // 10
    return rollout(model, df_feat, steps)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("forecast_service:app", host="0.0.0.0", port=8001, reload=True)