import sqlite3
conn = sqlite3.connect("sems.db", check_same_thread=False)
cur = conn.cursor()
cur.execute("""CREATE TABLE IF NOT EXISTS action_log(
  ts TEXT, building TEXT, room TEXT, fan INT, mode TEXT, duration_min INT, reason TEXT, by TEXT
)""")
conn.commit()

def insert_action(ts,b,r,fan,mode,dur,reason,by="auto"):
    cur.execute("INSERT INTO action_log VALUES(?,?,?,?,?,?,?,?)",
                (ts,b,r,fan,mode,dur,reason,by)); conn.commit()

def recent_actions(b, r, limit=20):
    cur.execute("SELECT * FROM action_log WHERE building=? AND room=? ORDER BY ts DESC LIMIT ?",
                (b,r,limit))
    return cur.fetchall()
