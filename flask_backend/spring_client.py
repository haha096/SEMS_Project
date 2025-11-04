# flask-backend/spring_client.py
import requests

def set_level(base: str, level: int) -> bool:
    try:
        r = requests.post(f"{base}/api/motor/level", json={"level": int(level)}, timeout=2)
        return r.status_code // 100 == 2
    except Exception:
        return False

def set_power(base: str, on: bool) -> bool:
    try:
        r = requests.post(f"{base}/api/motor/power", json={"on": bool(on)}, timeout=2)
        return r.status_code // 100 == 2
    except Exception:
        return False
