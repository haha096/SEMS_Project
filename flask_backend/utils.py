# flask-backend/utils.py
import io
from datetime import datetime
from flask import send_file
import matplotlib.pyplot as plt
from matplotlib.dates import AutoDateLocator, ConciseDateFormatter

FMT_DATE = "%Y-%m-%d"
FMT_DATETIME = "%Y-%m-%d %H:%M:%S"

def parse_datetime_flexible(s: str, is_start: bool) -> datetime:
    s = (s or "").strip()
    if not s:
        raise ValueError("empty datetime string")
    try:
        return datetime.strptime(s, FMT_DATETIME)
    except ValueError:
        d = datetime.strptime(s, FMT_DATE)
        return datetime(d.year, d.month, d.day, 0, 0, 0) if is_start else datetime(d.year, d.month, d.day, 23, 59, 59)

def plot_xy_png(x, y, title: str, ylabel: str):
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.plot(x, y, marker="o", markersize=2, linestyle="-")
    ax.set_title(title); ax.set_xlabel("시간"); ax.set_ylabel(ylabel)
    locator = AutoDateLocator(minticks=5, maxticks=10)
    formatter = ConciseDateFormatter(locator)
    ax.xaxis.set_major_locator(locator); ax.xaxis.set_major_formatter(formatter)
    fig.autofmt_xdate()
    buf = io.BytesIO(); plt.tight_layout(); plt.savefig(buf, format="png"); plt.close(fig); buf.seek(0)
    return send_file(buf, mimetype="image/png")

def message_png(text: str):
    buf = io.BytesIO()
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.axis("off")
    ax.text(0.5, 0.5, text, fontsize=24, ha="center", va="center", fontweight="bold")
    plt.tight_layout(); plt.savefig(buf, format="png"); plt.close(fig); buf.seek(0)
    return send_file(buf, mimetype="image/png")
