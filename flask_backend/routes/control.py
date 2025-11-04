# flask-backend/routes/control.py
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from typing import Dict, Any

from ..policy_engine import decide_action
from ..spring_client import set_level, set_power
from ..db import insert_action_log, select_recent_actions

control_bp = Blueprint("control", __name__)

@control_bp.post("/auto/apply")
def auto_apply():
    cfg = current_app.config["SEMS_CFG"]
    state: Dict[str, Any] = request.get_json() or {}
    building = state.get("building", "K")
    room = state.get("room", "301")

    action = decide_action(state, cfg)
    action["ts"] = datetime.now().isoformat()
    action["by"] = "auto"

    fan = int(action["fan"])
    ok_level, ok_power = True, True

    if fan == 0 and not cfg["allow_fan_zero"]:
        ok_power = set_power(cfg["spring_base"], False)
    else:
        if cfg["send_power_on_with_level"] and fan > 0:
            ok_power = set_power(cfg["spring_base"], True) and ok_power
        ok_level = set_level(cfg["spring_base"], fan)

    insert_action_log(datetime.fromisoformat(action["ts"]), building, room,
                      fan, action["mode"], int(action["duration_min"]), action["reason"], "auto")

    return jsonify({"ok": bool(ok_level and ok_power),
                    "action": action,
                    "spring": {"level": ok_level, "power": ok_power}})

@control_bp.get("/logs")
def logs():
    building = request.args.get("building", "K")
    room = request.args.get("room", "301")
    limit = int(request.args.get("limit", "20"))
    rows = select_recent_actions(building, room, limit)
    items = [{"ts": str(r[0]), "building": r[1], "room": r[2], "fan": r[3],
              "mode": r[4], "duration_min": r[5], "reason": r[6], "by": r[7]} for r in rows]
    return jsonify({"items": items})

@control_bp.post("/explain")
def explain():
    data = request.get_json() or {}
    state, action = data.get("state", {}), data.get("action", {})
    ind = (state.get("indoor") or {}); blk = state.get("block", "default")
    text = (f"현재 {blk} 상태이며, 실내 PM2.5={ind.get('pm25')} / PM10={ind.get('pm10')}에 따라 "
            f"{action.get('duration_min',0)}분 동안 팬 {action.get('fan',0)}단으로 운전합니다. "
            f"사유: {action.get('reason','')}.")
    return jsonify({"explanation": text})
