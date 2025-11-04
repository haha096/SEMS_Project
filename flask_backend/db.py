# flask-backend/db.py
from typing import List, Tuple
from datetime import datetime
import pymysql

def get_mysql_conn():
    return pymysql.connect(
        host="localhost", user="root", password="admin",
        db="springdb", charset="utf8mb4",
        cursorclass=pymysql.cursors.Cursor,
    )

def ensure_action_log_table():
    conn = get_mysql_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS action_log (
                    ts           DATETIME,
                    building     VARCHAR(64),
                    room         VARCHAR(64),
                    fan          INT,
                    mode         VARCHAR(16),
                    duration_min INT,
                    reason       VARCHAR(255),
                    by_who       VARCHAR(16)
                )
            """)
            conn.commit()
    finally:
        conn.close()

def insert_action_log(ts: datetime, building: str, room: str, fan: int, mode: str,
                      duration_min: int, reason: str, by_who: str = "auto"):
    conn = get_mysql_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO action_log (ts, building, room, fan, mode, duration_min, reason, by_who)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (ts, building, room, fan, mode, duration_min, reason, by_who))
            conn.commit()
    finally:
        conn.close()

def select_recent_actions(building: str, room: str, limit: int = 20) -> List[Tuple]:
    conn = get_mysql_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ts, building, room, fan, mode, duration_min, reason, by_who
                FROM action_log
                WHERE building=%s AND room=%s
                ORDER BY ts DESC
                LIMIT %s
            """, (building, room, limit))
            return cur.fetchall()
    finally:
        conn.close()

def query_env_between(start_dt: datetime, end_dt: datetime, column: str) -> List[Tuple]:
    conn = get_mysql_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT timestamp, {column}
                FROM environment_data
                WHERE timestamp BETWEEN %s AND %s
                ORDER BY timestamp ASC
                LIMIT 500
            """, (start_dt, end_dt))
            return cur.fetchall()
    finally:
        conn.close()
