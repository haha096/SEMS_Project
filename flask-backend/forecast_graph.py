import io
from datetime import datetime
import matplotlib
matplotlib.use("Agg")  # 서버 렌더링
import matplotlib.pyplot as plt

# 색상 팔레트
COLOR_INDOOR   = "#1f77b4"   # 실내(과거)
COLOR_OUTDOOR  = "#2ca02c"   # 실외(과거)
COLOR_FORECAST = "#ff7f0e"   # 예측(미래)

def generate_graph(past_indoor, past_outdoor, curve, metric="temp", dpi=130):
    """
    past_indoor:  [(ts, y), ...]  # 실내 과거
    past_outdoor: [(ts, y), ...]  # 실외 과거
    curve:        [(ts, y, alert), ...] # 예측
    return: PNG bytes
    """
    buf = io.BytesIO()
    fig = plt.figure(figsize=(10, 4))
    ax = plt.gca()

    # 과거 데이터 = 점선
    if past_indoor:
        xi, yi = zip(*past_indoor)
        ax.plot(xi, yi, linestyle=":", linewidth=2.0, color=COLOR_INDOOR, label="실내(과거)")
    if past_outdoor:
        xo, yo = zip(*past_outdoor)
        ax.plot(xo, yo, linestyle=":", linewidth=1.8, color=COLOR_OUTDOOR, label="실외(과거)")

    # 예측 = 실선 + 경고 빨간 점
    if curve:
        xf = [t for t,_,_ in curve]
        yf = [y for _,y,_ in curve]
        ax.plot(xf, yf, linestyle="-", linewidth=2.6, color=COLOR_FORECAST, label="예측(미래)")
        for t,y,alert in curve:
            if alert:
                ax.scatter(t, y, s=30, color="red", zorder=5)

    # 현재 시각 기준선
    ax.axvline(datetime.now(), linestyle="-.", linewidth=1, color="#888")

    unit = "°C" if metric=="temp" else "%"
    ax.set_title(f"Indoor/Outdoor & Forecast - {'온도' if metric=='temp' else '습도'}({unit})")
    ax.set_xlabel("시간"); ax.set_ylabel("값")
    ax.grid(True, linestyle="--", alpha=0.3)
    ax.legend(loc="best")
    fig.autofmt_xdate()
    plt.tight_layout()

    plt.savefig(buf, format="png", dpi=dpi)
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()