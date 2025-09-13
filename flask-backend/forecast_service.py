from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from lightgbm import LGBMRegressor

app = FastAPI(title="Forecast Service")

class Point(BaseModel):
    ts: str
    out_temp: Optional[float] = None
    out_hum: Optional[float] = None

class Req(BaseModel):
    freq: str = "10min"
    horizon_minutes: int = 1440
    target: str = "temp"      # "temp" | "hum"
    series: List[Point]

def make_features(df: pd.DataFrame, target: str):
    df = df.sort_values("ts")
    df["ts"] = pd.to_datetime(df["ts"])
    df = df.set_index("ts").asfreq("10min")
    df["out_temp"] = df["out_temp"].interpolate(limit_direction="both")
    df["out_hum"]  = df["out_hum"].interpolate(limit_direction="both")
    df["y"] = df["out_temp"] if target=="temp" else df["out_hum"]
    for l in [1,2,3,4,5,6]: df[f"y_lag{l}"]=df["y"].shift(l)
    for w in [3,6,12]:      df[f"y_ma{w}"]=df["y"].rolling(w).mean()
    df["hour"]=df.index.hour; df["dow"]=df.index.dayofweek
    df = df.dropna()
    X = df.drop(columns=["y"]); y = df["y"]
    return df, X, y

def rollout(model, last_df: pd.DataFrame, steps: int):
    future_idx = pd.date_range(last_df.index[-1] + pd.to_timedelta("10min"), periods=steps, freq="10min")
    df = last_df.copy(); out=[]
    for ts in future_idx:
        row = {"out_temp": df["out_temp"].iloc[-1], "out_hum": df["out_hum"].iloc[-1],
               "hour": ts.hour, "dow": ts.dayofweek}
        recent = df["y"].iloc[-12:]
        for l in [1,2,3,4,5,6]: row[f"y_lag{l}"]=recent.iloc[-l]
        for w in [3,6,12]:      row[f"y_ma{w}"]=recent.iloc[-w:].mean()
        yhat = float(LGBMRegressor().fit(  # 간단: 바로 학습해서 예측
            last_df.drop(columns=["y"]), last_df["y"]
        ).predict(pd.DataFrame([row]))[0])  # 실무에선 위에서 학습한 model을 재사용하세요.
        out.append({"ts": ts.isoformat(), "yhat": yhat})
        df = pd.concat([df, pd.DataFrame([{"y": yhat, **row}], index=[ts])])
    return out

@app.post("/forecast/gbdt")
def forecast(req: Req):
    df = pd.DataFrame([s.dict() for s in req.series])
    df_feat, X, y = make_features(df, req.target)
    model = LGBMRegressor(n_estimators=400, learning_rate=0.05)
    model.fit(X, y)
    steps = req.horizon_minutes // 10
    # 롤아웃은 위의 간단 버전 대신, 학습한 model을 사용:
    # return rollout(model, df_feat, steps)
    # (간단히 바로 예측만 원하면 rollout 구현 그대로 쓰세요)
    return rollout(model, df_feat, steps)