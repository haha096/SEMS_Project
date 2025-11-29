# flask-backend/config.py
import os, copy
from typing import Dict, Any

DEFAULT_CFG: Dict[str, Any] = {
    "targets": {"pm25": 15, "pm10": 30},
    "deadband": {"pm25": 2, "pm10": 5},
    "min_hold_min": 8,
    "outdoor_bad": {"pm25": 35, "pm10": 80},
    "block_limits": {"class_max": 2, "night_max": 1},
    "spring_base": os.getenv("SPRING_BASE", "http://localhost:8080"),
    "allow_fan_zero": True,
    "send_power_on_with_level": False,
    "explain": {"enabled": False, "provider": "openai", "api_key_env": "OPENAI_API_KEY", "model": "gpt-4o-mini"},
}

def _deep_merge(dst, src):
    for k, v in src.items():
        if isinstance(v, dict) and isinstance(dst.get(k), dict):
            _deep_merge(dst[k], v)
        else:
            dst[k] = v

def load_config() -> Dict[str, Any]:
    cfg = copy.deepcopy(DEFAULT_CFG)
    try:
        import yaml
        if os.path.exists("config.yaml"):
            with open("config.yaml", "r", encoding="utf-8") as f:
                loaded = yaml.safe_load(f) or {}
                _deep_merge(cfg, loaded)
    except Exception:
        pass
    return cfg


