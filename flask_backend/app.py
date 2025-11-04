# flask-backend/app.py
from flask import Flask
from flask_cors import CORS

from .config import load_config
from .db import ensure_action_log_table
from .routes.core import core_bp
from .routes.control import control_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

    # 설정 로드 -> app.config["SEMS_CFG"]
    app.config["SEMS_CFG"] = load_config()

    # DB 테이블 보장
    ensure_action_log_table()

    # 블루프린트 등록
    app.register_blueprint(core_bp)
    app.register_blueprint(control_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
