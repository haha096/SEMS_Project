def build_features_from_state(state: dict) -> dict:
    """
    state 형태(너의 policy_engine.py 기준):
      state["indoor"] = {"pm25","pm10","pm1","temperature","humidity","current","speed","volt", ...}
    """
    indoor = (state.get("indoor") or {})
    # state의 키가 DB 컬럼과 동일하다고 가정 (없으면 0.0)
    return {
        "current_pm25":    indoor.get("pm25", 0.0),       # sensor_data.pm2_5와 동일 의미
        "current_pm10":    indoor.get("pm10", 0.0),
        "current_pm1":     indoor.get("pm1", 0.0),
        "current_temp":    indoor.get("temperature", 0.0),
        "current_humi":    indoor.get("humidity", 0.0),
        "current_current": indoor.get("current", 0.0),
        "current_speed":   indoor.get("speed", 0.0),
        "current_volt":    indoor.get("volt", 0.0),
    }
