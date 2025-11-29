# flask-backend/spring_client.py
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import requests

# Flask 요청 컨텍스트가 있을 때만 쿠키를 읽도록 안전하게 import
try:
    from flask import has_request_context, request  # type: ignore
except Exception:  # pragma: no cover
    def has_request_context() -> bool:  # fallback (테스트/워커 스레드 등)
        return False  # type: ignore

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 6.0


def _pick(d: Dict[str, Any], *keys: str, default=None):
    for k in keys:
        if not d:
            break
        if k in d:
            return d[k]
    return default


def _auth_headers(cfg: Optional[Dict[str, Any]]) -> Dict[str, str]:
    """
    cfg['auth'] 설정에 따라 Spring으로 보낼 인증 정보를 헤더로 생성한다.
    - mode == 'internal': X-Internal-Token: <token>
        우선순위: static_token > env(token_env, 기본 INTERNAL_TOKEN)
    - mode == 'bearer': Authorization: Bearer <JWT>
        우선순위: static_bearer > (Flask ACCESS cookie) > env(bearer_env)
    - mode == 'cookie': Cookie: ACCESS=...; REFRESH=... (옵션)
    """
    if not cfg:
        return {}

    auth = cfg.get("auth") or {}
    mode = (auth.get("mode") or "").lower()

    if mode == "internal":
        tok = (auth.get("static_token") or "").strip()
        if not tok:
            import os
            env_key = auth.get("token_env", "INTERNAL_TOKEN")
            tok = (os.environ.get(env_key) or "").strip()
            if tok:
                logger.debug("[spring_client] auth=internal (from env %s)", env_key)
        if tok:
            header_name = auth.get("header", "X-Internal-Token")
            return {header_name: tok}
        else:
            logger.warning("[spring_client] internal mode but no token found (static_token / env).")
            return {}

    if mode == "bearer":
        tok = (auth.get("static_bearer") or "").strip()
        if not tok and has_request_context():
            access_name = auth.get("access_cookie", "ACCESS")
            tok = (request.cookies.get(access_name) or "").strip()
            if tok:
                logger.debug("[spring_client] auth=bearer (from ACCESS cookie, name=%s)", access_name)
        if not tok:
            import os
            env_key = auth.get("bearer_env", "SEMS_JWT")
            tok = (os.environ.get(env_key) or "").strip()
            if tok:
                logger.debug("[spring_client] auth=bearer (from env %s)", env_key)
        if tok:
            return {"Authorization": f"Bearer {tok}"}
        else:
            logger.warning("[spring_client] bearer mode but no token found (static_bearer / ACCESS cookie / env).")
            return {}

    if mode == "cookie":
        cookie_parts = []
        if has_request_context():
            access_name = auth.get("access_cookie", "ACCESS")
            refresh_name = auth.get("refresh_cookie", "REFRESH")
            access_val = request.cookies.get(access_name)
            refresh_val = request.cookies.get(refresh_name)
            if access_val:
                cookie_parts.append(f"{access_name}={access_val}")
            if auth.get("send_refresh_also", True) and refresh_val:
                cookie_parts.append(f"{refresh_name}={refresh_val}")
            if cookie_parts:
                logger.debug("[spring_client] auth=cookie (forwarding %s)", ", ".join(p.split("=")[0] for p in cookie_parts))
                return {"Cookie": "; ".join(cookie_parts)}
        logger.warning("[spring_client] cookie mode but no request cookies present.")
        return {}

    # 미설정 시 인증 미부착
    return {}


def _post(base: str, path: str, json_body: Optional[Dict[str, Any]], cfg: Optional[Dict[str, Any]] = None) -> bool:
    url = f"{base.rstrip('/')}/{path.lstrip('/')}"
    headers = {"Content-Type": "application/json"}
    headers.update(_auth_headers(cfg))

    print("[spring_client][_post] url=", url, "headers=", headers)

    # 개발 로그 (민감값 마스킹)
    import logging as _logging
    _logging.getLogger(__name__).info(
        "[spring_client] POST %s headers=%s body=%s",
        url,
        {k: ("****" if k.lower().endswith("token") else v) for k, v in headers.items()},
        json_body,
    )

    try:
        res = requests.post(url, json=json_body, headers=headers, timeout=DEFAULT_TIMEOUT)
        res.raise_for_status()
        return True
    except requests.HTTPError as e:
        logger.error("[spring_client] POST %s failed: %s", url, e)
        return False
    except Exception as e:
        logger.exception("[spring_client] POST %s error: %s", url, e)
        return False


def _get(base: str, path: str, cfg: Optional[Dict[str, Any]] = None) -> bool:
    url = f"{base.rstrip('/')}/{path.lstrip('/')}"
    headers = {}
    headers.update(_auth_headers(cfg))
    print("[spring_client][_get] url=", url, "headers=", headers)
    try:
        res = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
        res.raise_for_status()
        return True
    except requests.HTTPError as e:
        logger.error("[spring_client] GET %s failed: %s", url, e)
        return False
    except Exception as e:
        logger.exception("[spring_client] GET %s error: %s", url, e)
        return False


# -------- 외부 API 래퍼 --------

def set_power(base: str, on: bool, cfg: Optional[Dict[str, Any]] = None) -> bool:
    """Spring: POST /api/motor/power { "on": true|false }"""
    return _post(base, "/api/motor/power", {"on": bool(on)}, cfg)


def set_manual_level(base: str, level: int, cfg: Optional[Dict[str, Any]] = None) -> bool:
    """
    Spring: POST /api/motor/manual { "level": 1|2|3 }
    - 이 호출이 스프링에서 모드를 MANUAL로 전환 + 해당 속도 설정을 수행함.
    """
    level = int(level)
    if level < 1:
        level = 1
    if level > 3:
        level = 3
    print(f"[spring_client][set_manual_level] try: POST /api/motor/manual level={level}")
    return _post(base, "/api/motor/manual", {"level": level}, cfg)


def set_auto_mode(base: str, cfg: Optional[Dict[str, Any]] = None) -> bool:
    """Spring: GET /api/motor/auto (선택)"""
    return _get(base, "/api/motor/auto", cfg)
