import os, joblib, numpy as np

_BUNDLE = None

def _load_bundle():
    global _BUNDLE
    if _BUNDLE is None:
        path = os.getenv("SEMS_MODEL_BUNDLE",
                         os.path.join(os.path.dirname(__file__), "model_bundle.pkl"))
        _BUNDLE = joblib.load(path)
    return _BUNDLE

def predict_next_pm25(feature_dict: dict) -> float:
    """
    feature_dict 예:
      {
        "current_pm25": 19, "current_pm10": 23, "current_pm1": 13,
        "current_temp": 21.3, "current_humi": 40.2,
        "current_current": 0.63, "current_speed": 1, "current_volt": 5
      }
    (일부 키가 없어도 0.0으로 채워 예측함)
    """
    bundle = _load_bundle()
    model, cols = bundle["model"], bundle["features"]

    row = [float(feature_dict.get(c, 0.0)) for c in cols]
    X = np.array([row], dtype=float)
    return float(model.predict(X)[0])
