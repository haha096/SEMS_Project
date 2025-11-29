# flask-backend/policy_engine.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os  # ← 추가
from .ml_predictor import predict_next_pm25  # ← 추가
from .services.feature_service import build_features_from_state  # ← 추가

PM25_LIMIT = float(os.getenv("SEMS_PM25_LIMIT", "35"))  # ← 추가

def _ok(v: Optional[float], tgt: float, db: float) -> bool:
    return (v is not None) and (v < (tgt - db))

def decide_action(state: Dict[str, Any], cfg: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now()
    block = state.get("block", "default")
    indoor = state.get("indoor", {}) or {}
    outdoor = state.get("outdoor", {}) or {}
    pm25, pm10 = indoor.get("pm25"), indoor.get("pm10")

    prev = state.get("prev_action")
    if prev and prev.get("until"):
        try:
            if datetime.fromisoformat(prev["until"]) > now:
                return {
                    "mode": "AUTO",
                    "fan": int(prev.get("fan", 1)),
                    "duration_min": cfg["min_hold_min"],
                    "until": prev["until"],
                    "reason": (prev.get("reason", "") + " | hold(hysteresis)")
                }
        except Exception:
            pass

    # 1) 규칙 기반 기본 판단
    if pm25 is None or pm10 is None:
        fan, reason = 1, "sensor missing→fallback"
    elif _ok(pm25, cfg["targets"]["pm25"], cfg["deadband"]["pm25"]) and _ok(pm10, cfg["targets"]["pm10"], cfg["deadband"]["pm10"]):
        fan, reason = 0, "target ok"
    elif pm25 < 25 and pm10 < 40:
        fan, reason = 1, "slightly elevated"
    elif pm25 < 50 and pm10 < 80:
        fan, reason = 2, "moderate"
    else:
        fan, reason = 3, "high pollution"

    # 2) ML 보정 (예측 PM2.5가 기준 넘을 듯하면 한 단계 강화)
    try:
        feats = build_features_from_state(state)
        pm25_next = predict_next_pm25(feats)
        note = f"pm25_next={pm25_next:.1f}"
        state["_ai_note"] = note
        reason = f"{reason} | {note}"
        if pm25_next > PM25_LIMIT:
            fan = min(fan + 1, 3)
            reason += " + ml_boost"
    except Exception as e:
        state["_ai_note"] = f"ml_skip:{e}"
        reason = f"{reason} | ml_skip:{e}"

    # 3) 야외 공기질이 나쁠 때 가중
    if outdoor.get("pm25", 0) > cfg["outdoor_bad"]["pm25"] or outdoor.get("pm10", 0) > cfg["outdoor_bad"]["pm10"]:
        fan = min(fan + 1, 3); reason += " + outdoor bad"

    # 4) 블록별 상한
    if block == "class":
        fan = min(fan, cfg["block_limits"]["class_max"]); reason += " + class limit"
    elif block == "night":
        fan = min(fan, cfg["block_limits"]["night_max"]); reason += " + night limit"

    # 5) 히스테리시스(유지시간)
    until = now + timedelta(minutes=cfg["min_hold_min"])
    return {
        "mode": "AUTO",
        "fan": int(fan),
        "duration_min": cfg["min_hold_min"],
        "until": until.isoformat(),
        "reason": reason
    }
