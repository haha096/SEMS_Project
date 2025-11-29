import pandas as pd
from sqlalchemy import create_engine
from datetime import timedelta

# 1) DB 연결 (계정/비번/호스트 수정)
ENGINE_URL = "mysql+pymysql://root:admin@localhost:3306/springdb?charset=utf8mb4"
engine = create_engine(ENGINE_URL)

# 2) 최근 30일 데이터 읽기 (필요 컬럼만)
sql = """
SELECT room, timestamp, pm2_5, pm10, pm1, temperature, humidity, current, speed, volt
FROM sensor_data
WHERE timestamp >= NOW() - INTERVAL 30 DAY
ORDER BY room, timestamp;
"""
df = pd.read_sql(sql, engine, parse_dates=["timestamp"])

# 3) 룸별로 10분 뒤 값 붙이기 (merge_asof)
df = df.sort_values(["room", "timestamp"])
df["ts_target"] = df["timestamp"] + pd.Timedelta(minutes=10)

# 같은 룸끼리만 매칭
out = []
for room, g in df.groupby("room", sort=False):
    g = g.sort_values("timestamp")
    # 10분 뒤 타깃을 기준으로 "앞으로 가장 가까운" 행을 붙임
    y = pd.merge_asof(
        g[["timestamp", "pm2_5"]].rename(columns={"timestamp": "ts_y", "pm2_5": "pm25_after_10m"}),
        g[["timestamp"]].rename(columns={"timestamp": "ts_target"}),
        left_on="ts_y", right_on="ts_target", direction="forward"
    )
    # 위 방식은 키가 반대라 헷갈리므로, 더 직관적으로 두 번 나눠서 진행:
    # 1) 왼쪽: 현재행들
    left = g.rename(columns={
        "pm2_5": "current_pm25",
        "pm10": "current_pm10",
        "pm1": "current_pm1",
        "temperature": "current_temp",
        "humidity": "current_humi",
        "current": "current_current",
        "speed": "current_speed",
        "volt": "current_volt",
    })
    left["ts_target"] = left["timestamp"] + pd.Timedelta(minutes=10)

    # 2) 오른쪽: 미래행에서 pm2_5만 보유
    right = g[["timestamp", "pm2_5"]].rename(columns={"timestamp": "timestamp_right", "pm2_5": "pm25_after_10m"})

    # 3) asof 머지: ts_target 기준으로 미래행을 붙임
    m = pd.merge_asof(
        left.sort_values("ts_target"),
        right.sort_values("timestamp_right"),
        left_on="ts_target", right_on="timestamp_right",
        direction="forward",
        allow_exact_matches=True
    )
    # 라벨 없는 행 제거
    m = m.dropna(subset=["pm25_after_10m"])
    out.append(m)

train = pd.concat(out, ignore_index=True).sort_values(["room", "timestamp"])

# 4) 학습 CSV로 저장
cols = [
    "room", "timestamp",
    "current_pm25","current_pm10","current_pm1","current_temp","current_humi",
    "current_current","current_speed","current_volt",
    "pm25_after_10m"
]
train[cols].to_csv("training.csv", index=False, encoding="utf-8-sig")
print("[OK] saved training.csv with", len(train), "rows")
