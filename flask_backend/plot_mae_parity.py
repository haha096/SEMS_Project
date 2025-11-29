# flask_backend/plot_mae_parity.py
import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# 경로
HERE = os.path.dirname(__file__)
CSV_PATH = os.path.join(HERE, "training.csv")
BUNDLE_PATH = os.path.join(HERE, "model_bundle.pkl")

# 데이터/모델 로드
df = pd.read_csv(CSV_PATH).dropna()
bundle = joblib.load(BUNDLE_PATH)
model = bundle["model"]
FEATURES = bundle["features"]

# 피처/타깃 분리
X = df[FEATURES]
y = df["pm25_after_10m"]

# train/test 분할 (학습 시 설정과 동일)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)

# 예측 및 MAE
pred = model.predict(Xte)
mae = mean_absolute_error(yte, pred)

# --- Parity Plot: 실제(축X) vs 예측(축Y) ---
# 너무 많은 점이면 샘플링(최대 5000개)
max_points = 5000
if len(pred) > max_points:
    idx = np.random.RandomState(42).choice(len(pred), size=max_points, replace=False)
    yte_plot = yte.iloc[idx]
    pred_plot = pred[idx]
else:
    yte_plot = yte
    pred_plot = pred

plt.figure(figsize=(7, 7))
plt.scatter(yte_plot, pred_plot, s=8, alpha=0.6)
# 이상적 예측선(y=x)
mn = float(min(yte_plot.min(), pred_plot.min()))
mx = float(max(yte_plot.max(), pred_plot.max()))
plt.plot([mn, mx], [mn, mx], linewidth=1)

plt.title(f"10-min Ahead PM2.5 — Actual vs Predicted (MAE={mae:.2f} μg/m³)")
plt.xlabel("Actual PM2.5 (10 min ahead)")
plt.ylabel("Predicted PM2.5")
plt.tight_layout()

out_path = os.path.join(HERE, "mae_parity.png")
plt.savefig(out_path, dpi=150)
print(f"[OK] saved: {out_path}  (MAE={mae:.2f} μg/m³)")
