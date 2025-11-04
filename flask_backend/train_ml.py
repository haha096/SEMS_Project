# train_ml.py
import os
import pandas as pd
import numpy as np
import joblib
import pymysql
from sqlalchemy import create_engine
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "admin")
DB_NAME = os.getenv("DB_NAME", "springdb")

MODEL_PATH = os.getenv("MODEL_PATH", "./models/pm25_h10_xgb.pkl")

def load_training_df():
    url = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
    engine = create_engine(url)
    df = pd.read_sql("SELECT * FROM joined_training", engine)
    # 기본 클린업
    df = df.dropna(subset=["y_pm25_10min"])
    # 극값 제거(선택)
    df = df[(df["pm25_in"] >= 0) & (df["pm25_in"] <= 300)]
    df = df[(df["y_pm25_10min"] >= 0) & (df["y_pm25_10min"] <= 300)]
    return df

def build_features(df: pd.DataFrame):
    features = [
        "pm25_in","pm10_in","temp","rh",
        "pm25_out","pm10_out",
        "fan",
        "pm25_in_ma6","pm25_in_ma16","pm25_in_diff1",
        "hour_of_day"
    ]
    X = df[features].fillna(method="bfill").fillna(method="ffill").fillna(0.0)
    y = df["y_pm25_10min"].astype(float)
    return X, y, features

def main():
    df = load_training_df()
    X, y, features = build_features(df)

    # 시간누수 방지하려면 시간 기준 split 권장(간단 버전은 랜덤)
    X_tr, X_va, y_tr, y_va = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        n_jobs=4,
        random_state=42,
    )
    model.fit(X_tr, y_tr)
    pred = model.predict(X_va)
    mae = mean_absolute_error(y_va, pred)
    print(f"[train] MAE (10min PM2.5): {mae:.3f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump({"model": model, "features": features}, MODEL_PATH)
    print(f"[train] saved → {MODEL_PATH}")

if __name__ == "__main__":
    main()
