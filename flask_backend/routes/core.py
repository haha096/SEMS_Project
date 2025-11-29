# flask-backend/routes/core.py
from flask import Blueprint, request, jsonify, current_app
from ..db import query_env_between
from ..utils import parse_datetime_flexible, plot_xy_png, message_png

core_bp = Blueprint("core", __name__)

@core_bp.get("/")
def home():
    return "🎉 Flask 서버가 정상 작동합니다!"

@core_bp.get("/health")
def health():
    return jsonify(status="ok"), 200

@core_bp.get("/chart")
def chart():
    sensor_type = request.args.get("type", "")
    start_str = request.args.get("start", "")
    end_str = request.args.get("end") or start_str
    out_format = (request.args.get("format") or "json").lower()

    type_map = {"temperature": "avg_temperature", "humidity": "avg_humidity", "dust": "avg_dust"}
    column = type_map.get(sensor_type)
    if not column:
        return jsonify({"error": "Invalid type"}), 400

    try:
        start_dt = parse_datetime_flexible(start_str, True)
        end_dt = parse_datetime_flexible(end_str, False)
    except ValueError:
        return jsonify({"error": "Invalid datetime format"}), 400

    try:
        rows = query_env_between(start_dt, end_dt, column)
    except Exception as e:
        return jsonify({"error": f"DB error: {e}"}), 500

    if not rows:
        return jsonify([]), 200 if out_format == "json" else message_png("📭 등록된 데이터가 없습니다.")

    if out_format == "json":
        return jsonify([{"timestamp": str(ts), column: val} for ts, val in rows]), 200

    x = [r[0] for r in rows]; y = [r[1] for r in rows]
    return plot_xy_png(x, y, f"{sensor_type} 데이터 그래프", column)

@core_bp.get("/table")
def table():
    sensor_type = request.args.get("type", "")
    start_str = request.args.get("start", "")
    end_str = request.args.get("end") or start_str

    type_map = {"temperature": "avg_temperature", "humidity": "avg_humidity", "dust": "avg_dust"}
    column = type_map.get(sensor_type)
    if not column:
        return jsonify({"error": "Invalid type"}), 400

    try:
        start_dt = parse_datetime_flexible(start_str, True)
        end_dt = parse_datetime_flexible(end_str, False)
    except ValueError:
        return jsonify({"error": "Invalid datetime format"}), 400

    try:
        rows = query_env_between(start_dt, end_dt, column)
    except Exception as e:
        return jsonify({"error": f"DB error: {e}"}), 500

    return jsonify([{"timestamp": str(ts), column: val} for ts, val in rows]), 200
