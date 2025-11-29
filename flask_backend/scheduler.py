# flask-backend/scheduler.py
from __future__ import annotations

import threading
import time
from datetime import datetime
from typing import Any, Dict, Optional

from flask import Flask

from .policy_engine import decide_action
from .spring_client import set_power, set_manual_level, set_auto_mode

# ──────────────────────────────────────────────────────────────────────
# 상태/토글 저장소
# ──────────────────────────────────────────────────────────────────────

_AUTO_ENABLED = False
_LATEST_STATE: Dict[str, Any] = {}
_STATUS_LOCK = threading.Lock()
_WORKER_THREAD: Optional[threading.Thread] = None
_STOP_EVENT: Optional[threading.Event] = None


def set_auto_enabled(enabled: bool) -> None:
    global _AUTO_ENABLED
    with _STATUS_LOCK:
        _AUTO_ENABLED = bool(enabled)


def get_auto_status() -> Dict[str, Any]:
    with _STATUS_LOCK:
        return {
            "enabled": _AUTO_ENABLED,
            "ts": datetime.now().isoformat(),
        }


def set_latest_state(state: Dict[str, Any]) -> None:
    global _LATEST_STATE
    with _STATUS_LOCK:
        _LATEST_STATE = state or {}


def _copy_state() -> Dict[str, Any]:
    with _STATUS_LOCK:
        return dict(_LATEST_STATE)


# ──────────────────────────────────────────────────────────────────────
# 워커 루프
# ──────────────────────────────────────────────────────────────────────

def _worker_loop(app: Flask, interval_sec: int) -> None:
    """
    주기적으로 최신 state를 정책엔진에 넣고 Spring에 명령을 내림.
    - fan > 0 : 전원 ON -> MANUAL + 레벨 설정
    - fan == 0: 전원 OFF (+ 옵션에 따라 AUTO 복귀)
    """
    app.logger.info("[auto-worker] start interval=%ss", interval_sec)
    while _STOP_EVENT and not _STOP_EVENT.is_set():
        try:
            with app.app_context():
                cfg: Dict[str, Any] = app.config.get("SEMS_CFG", {}) or {}
                if not get_auto_status().get("enabled"):
                    time.sleep(interval_sec)
                    continue

                state = _copy_state()
                action = decide_action(state, cfg)
                action["ts"] = datetime.now().iso8601()
                action["by"] = "auto"

                fan = int(action.get("fan") or 0)
                base = cfg.get("spring_base", "http://localhost:8080")
                dry_run = bool(cfg.get("dry_run", False))
                set_auto_when_fan_zero = bool(cfg.get("set_auto_when_fan_zero", False))

                app.logger.info("[auto-worker] action=%s dry_run=%s base=%s", action, dry_run, base)

                if not dry_run:
                    if fan <= 0:
                        ok_power = set_power(base, False, cfg)
                        app.logger.info("[auto-worker] set_power(False) -> %s", ok_power)
                        if set_auto_when_fan_zero:
                            ok_mode = set_auto_mode(base, cfg)
                            app.logger.info("[auto-worker] set_auto_mode() -> %s", ok_mode)
                    else:
                        ok_power = set_power(base, True, cfg)
                        app.logger.info("[auto-worker] set_power(True) -> %s", ok_power)
                        ok_level = set_manual_level(base, fan, cfg)
                        app.logger.info("[auto-worker] set_manual_level(%s) -> %s", fan, ok_level)

        except Exception as e:
            # 워커는 죽지 않도록 모든 예외를 삼켜 로그만 남김
            try:
                app.logger.exception("[auto-worker] error: %s", e)
            except Exception:
                pass

        time.sleep(interval_sec)

    if _STOP_EVENT:
        app.logger.info("[auto-worker] stopped")


def start_auto_scheduler(app: Flask) -> None:
    """
    앱 기동 시 호출. config.yaml의 auto_loop.enabled가 true면 워커 시작.
    """
    global _WORKER_THREAD, _STOP_EVENT

    cfg: Dict[str, Any] = app.config.get("SEMS_CFG", {}) or {}
    loop_cfg = (cfg.get("auto_loop") or {})
    enabled = bool(loop_cfg.get("enabled", False))
    interval_sec = int(loop_cfg.get("interval_sec", 60))

    # 부팅 시 자동 off (명시적으로 enable API가 켜게)
    set_auto_enabled(enabled)

    if not enabled:
        app.logger.info("[auto-worker] disabled by config")
        return

    if _WORKER_THREAD and _WORKER_THREAD.is_alive():
        app.logger.info("[auto-worker] already running")
        return

    _STOP_EVENT = threading.Event()
    _WORKER_THREAD = threading.Thread(
        target=_worker_loop,
        args=(app, interval_sec),
        daemon=True,
        name="sems-auto-worker",
    )
    _WORKER_THREAD.start()
    app.logger.info("[auto-worker] spawned")


def stop_auto_scheduler() -> None:
    """
    (테스트용) 워커 중지
    """
    global _STOP_EVENT
    if _STOP_EVENT:
        _STOP_EVENT.set()
