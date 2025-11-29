# flask-backend/routes/control.py
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from typing import Dict, Any

from ..policy_engine import decide_action
from ..spring_client import set_manual_level, set_power, set_auto_mode
from ..db import insert_action_log, select_recent_actions
from ..scheduler import (
    set_auto_enabled,
    get_auto_status,
    set_latest_state,  # 프론트/백엔드가 상태를 올려주면 캐시
)

control_bp = Blueprint("control", __name__)

@control_bp.post("/auto/apply")
def auto_apply():
    cfg = current_app.config.get("SEMS_CFG", {}) or {}
    state: Dict[str, Any] = request.get_json(silent=True) or {}
    building = state.get("building", "K")
    room = state.get("room", "301")

    try:
        set_latest_state(state)
    except Exception:
        pass

    action = decide_action(state, cfg)

    print(
        f"[AUTO] mode={action.get('mode')} fan={action.get('fan')} "
        f"reason=\"{action.get('reason')}\" "
        f"note={state.get('_ai_note', '')}"
    )

    action["ts"] = datetime.now().isoformat()
    action["by"] = "auto"

    fan = int(action.get("fan") or 0)          # 0이면 전원 OFF만
    dry_run = bool(cfg.get("dry_run", False))
    allow_fan_zero = bool(cfg.get("allow_fan_zero", True))
    base = cfg.get("spring_base", "http://localhost:8080")

    # 선택: fan==0일 때 Spring 자동모드로 되돌릴지 여부
    set_auto_when_fan_zero = bool(cfg.get("set_auto_when_fan_zero", False))

    current_app.logger.info(f"[auto] decision={action} dry_run={dry_run} base={base}")

    ok_power = True
    ok_level = True
    ok_mode = True

    if not dry_run:
        if fan <= 0:
            # 전원만 OFF (필요시 AUTO 복귀)
            ok_power = set_power(base, False, cfg)
            current_app.logger.info(f"[auto] set_power(False) -> {ok_power}")
            ok_level = True
            if set_auto_when_fan_zero:
                ok_mode = set_auto_mode(base, cfg)
                current_app.logger.info(f"[auto] set_auto_mode() -> {ok_mode}")
        else:
            # AI 모드: MANUAL + 속도 설정이 요구됨
            # 1) 전원 ON
            ok_power = set_power(base, True, cfg)
            current_app.logger.info(f"[auto] set_power(True) -> {ok_power}")
            # 2) MANUAL + 레벨 설정 (스프링에서 manual 엔드포인트가 모드전환까지 처리)
            ok_level = set_manual_level(base, fan, cfg)
            current_app.logger.info(f"[auto] set_manual_level({fan}) -> {ok_level}")

    try:
        insert_action_log(
            datetime.fromisoformat(action["ts"]),
            building, room, fan,
            action.get("mode", "AUTO"),
            int((action.get("duration_min") or 5)),
            action.get("reason", ""),
            "auto",
        )
    except Exception:
        pass

    return jsonify({
        "ok": bool(ok_power and ok_level and ok_mode),
        "action": action,
        "spring": {"level": bool(ok_level), "power": bool(ok_power), "mode": bool(ok_mode)},
        "dry_run": dry_run,
    })


@control_bp.get("/logs")
def logs():
    building = request.args.get("building", "K")
    room = request.args.get("room", "301")
    limit = int(request.args.get("limit", "20"))
    rows = select_recent_actions(building, room, limit)
    items = [{
        "ts": str(r[0]), "building": r[1], "room": r[2], "fan": r[3],
        "mode": r[4], "duration_min": r[5], "reason": r[6], "by": r[7]
    } for r in rows]
    return jsonify({"items": items})


def _format_state_for_humans(state):
    indoor = (state or {}).get("indoor", {}) or {}
    outdoor = (state or {}).get("outdoor", {}) or {}
    block = (state or {}).get("block", "default")
    prev = (state or {}).get("prev_action", {}) or {}
    parts = []
    parts.append(f"[블록] {block}")
    parts.append(
        f"[실내] PM2.5={indoor.get('pm25')} PM10={indoor.get('pm10')} "
        f"T={indoor.get('temp')}°C RH={indoor.get('rh')}%"
    )
    parts.append(f"[실외] PM2.5={outdoor.get('pm25')} PM10={outdoor.get('pm10')}")
    if prev:
        parts.append(f"[이전액션] fan={prev.get('fan')} until={prev.get('until')}")
    return " | ".join(parts)


def _template_explain(state, action, cfg):
    targets = (cfg or {}).get("targets", {}) or {}
    deadband = (cfg or {}).get("deadband", {}) or {}
    fan = (action or {}).get("fan")
    reason = (action or {}).get("reason", "policy")
    tgt_pm25 = targets.get("pm25")
    tgt_pm10 = targets.get("pm10")
    db25 = deadband.get("pm25")
    db10 = deadband.get("pm10")
    return (
        f"정책 엔진 결과: 팬 {fan}단 (사유: {reason}). "
        f"목표 PM2.5={tgt_pm25}±{db25}, PM10={tgt_pm10}±{db10}. "
        f"상태: {_format_state_for_humans(state)}"
    )


@control_bp.post("/explain")
def explain():
    """
    템플릿 기반 설명 API
    body: { state?: {...}, action?: {...} }
    - action 미지정 시, 현재 state로 정책엔진을 호출하여 action 생성
    """
    cfg = current_app.config.get("SEMS_CFG", {}) or {}
    body = request.get_json(silent=True) or {}
    state = body.get("state") or {}
    action = body.get("action")
    if not action:
        action = decide_action(state, cfg)
    line = _template_explain(state, action, cfg)
    return jsonify({"action": action, "explanation": line})


# ----------------------- AUTO 토글/상태/상태업데이트 -----------------------

@control_bp.post("/auto/enable")
def auto_enable():
    set_auto_enabled(True)
    return jsonify({"ok": True, "status": get_auto_status()})

@control_bp.post("/auto/disable")
def auto_disable():
    set_auto_enabled(False)
    return jsonify({"ok": True, "status": get_auto_status()})

@control_bp.get("/auto/status")
def auto_status():
    return jsonify(get_auto_status())

@control_bp.post("/auto/state")
def auto_state_ingest():
    """프론트/수집기가 최신 state를 올리면 스케줄러 캐시에 저장"""
    state = request.get_json(silent=True) or {}
    try:
        set_latest_state(state)
    except Exception:
        pass
    return jsonify({"ok": True})
