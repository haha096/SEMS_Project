# flask-backend/app.py
import os
from flask import Flask
from flask_cors import CORS

from .config import load_config
from .db import ensure_action_log_table
from .routes.core import core_bp
from .routes.control import control_bp
from .scheduler import start_auto_scheduler

from dotenv import load_dotenv
load_dotenv()

def _normalize_spring(base_cfg: dict) -> dict:
    """
    config.yaml의
      spring:
        base: http://localhost:8080
        auth: { mode: internal, header: X-Internal-Token, static_token: ... }

    구조를 spring_client가 기대하는 형태로 평탄화한다:
      spring_base: ...
      auth: {...}

    또한 환경변수로 덮어쓸 수 있게 한다.
    """
    cfg = dict(base_cfg or {})

    # 1) config.yaml -> 평탄화
    spring = (cfg.get("spring") or {})
    base = spring.get("base") or cfg.get("spring_base") or "http://localhost:8080"
    auth = (spring.get("auth") or {})

    # spring_base는 최상위로
    cfg["spring_base"] = base

    # auth는 최상위로 (spring_client._auth_headers는 cfg["auth"]를 읽음)
    if auth:
        # 키 이름을 최대한 유지: mode/header/static_token/access_cookie/refresh_cookie 등
        cfg["auth"] = dict(auth)
    else:
        # 누락돼도 dict는 넣어둠
        cfg.setdefault("auth", {})

    # 2) 환경변수로 오버라이드(우선순위: 환경변수 > config.yaml)
    #   - SPRING_BASE
    env_base = os.getenv("SPRING_BASE")
    if env_base:
        cfg["spring_base"] = env_base.strip()

    #   - SPRING_AUTH_TYPE: "header" | "bearer" | "basic" | "internal"
    #     여기서는 spring_client의 모드명과 맞춰서 정규화
    env_auth_type = (os.getenv("SPRING_AUTH_TYPE") or "").strip().lower()
    if env_auth_type:
        # 기본 구조 보장
        cfg.setdefault("auth", {})
        if env_auth_type in ("header", "internal"):
            # 내부 토큰 헤더 모드: X-Internal-Token: <value>
            name = os.getenv("SPRING_HEADER_NAME", "X-Internal-Token").strip()
            val = (os.getenv("SPRING_HEADER_VALUE") or "").strip()
            cfg["auth"].update({
                "mode": "internal",
                "header": name,
            })
            if val:
                cfg["auth"]["static_token"] = val
        elif env_auth_type == "bearer":
            # Authorization: Bearer <token>
            tok = (os.getenv("SPRING_BEARER_TOKEN") or "").strip()
            cfg["auth"].update({
                "mode": "bearer",
            })
            if tok:
                cfg["auth"]["static_bearer"] = tok
        elif env_auth_type == "basic":
            # (spring_client에는 basic 모드가 없으므로 header/bearer를 추천)
            # 필요 시 Spring 쪽에서 BasicAuth를 끄고 내부토큰으로 맞춰줘.
            pass  # 사용하지 않음

    # 3) 정책 기본값 보정
    cfg.setdefault("allow_fan_zero", True)
    cfg.setdefault("dry_run", False)

    return cfg


def create_app() -> Flask:
    app = Flask(__name__)

    # CORS: 프런트(vite)가 5173에서 도는 경우
    CORS(
        app,
        resources={r"/*": {"origins": ["http://localhost:5173"]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-Internal-Token", "X-API-KEY"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        expose_headers=["Content-Type"],
        max_age=86400,
    )

    # 1) 설정 로드
    base_cfg = load_config() or {}

    # 2) spring 설정 평탄화(+환경변수 오버라이드)
    normalized = _normalize_spring(base_cfg)
    app.config["SEMS_CFG"] = normalized

    # 부팅 시 실제 적용값을 콘솔에 확실하게 노출
    print("[BOOT] SEMS_CFG =>", app.config["SEMS_CFG"])

    ensure_action_log_table()

    app.register_blueprint(core_bp)
    app.register_blueprint(control_bp)

    from .routes import inquiries, chat
    app.register_blueprint(inquiries.bp)  # /api/inquiries/*
    app.register_blueprint(chat.bp)       # /api/chat/*

    start_auto_scheduler(app)
    return app



if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
