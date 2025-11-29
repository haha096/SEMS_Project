import pandas as pd, joblib, os
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

CSV_PATH = os.getenv("SEMS_TRAIN_CSV", "training.csv")
df = pd.read_csv(CSV_PATH).dropna()

# springdb.sensor_data 컬럼 매핑에 맞춘 피처들
FEATURES = [
    "current_pm25",   # = pm2_5
    "current_pm10",   # = pm10
    "current_pm1",    # = pm1
    "current_temp",   # = temperature
    "current_humi",   # = humidity
    "current_current",# = current
    "current_speed",  # = speed
    "current_volt",   # = volt
]
TARGET = "pm25_after_10m"

FEATURES = [c for c in FEATURES if c in df.columns]
X = df[FEATURES]; y = df[TARGET]

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)

model = XGBRegressor(
    n_estimators=400, max_depth=4, learning_rate=0.08,
    subsample=0.9, colsample_bytree=0.9, n_jobs=-1, reg_lambda=1.0
)
model.fit(Xtr, ytr)

pred = model.predict(Xte)
mae = mean_absolute_error(yte, pred)
print(f"[SEMS] MAE(10min PM2.5) = {mae:.2f} µg/m³  | features={FEATURES}")

joblib.dump({"model": model, "features": FEATURES},
            os.path.join(os.path.dirname(__file__), "model_bundle.pkl"))
print("[SEMS] saved flask_backend/model_bundle.pkl")
