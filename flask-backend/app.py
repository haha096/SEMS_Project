import matplotlib
matplotlib.use('Agg')

from flask import Flask, send_file, request
import matplotlib.pyplot as plt
import io
from flask_cors import CORS

import pymysql

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "🎉 Flask 서버가 정상 작동합니다!"

#MySQL에서 데이터 뽑아오는 함수
#MySQL의 유저와 패스워드 안 맞으면 에러가 나옴...
def get_filtered_data(start, end, column):
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='root',
        db='springdb',
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    query = f"""
        SELECT timestamp, {column}
        FROM sensor_data
        WHERE timestamp BETWEEN %s AND %s
        ORDER BY timestamp
    """
    cursor.execute(query, (start, end))
    result = cursor.fetchall()
    conn.close()
    return result


@app.route('/chart')
def chart():
    start = request.args.get('start')
    end = request.args.get('end')
    sensor_type = request.args.get('type')

    print(f"[DEBUG] start={start}, end={end}, sensor_type={sensor_type}")


    type_map = {
        'temperature': 'temp',
        'humidity': 'hum',
        'dust': 'pm2_5'
    }

    column = type_map.get(sensor_type)
    print(f"[DEBUG] column={column}")

    if not start or not end or not column:
        print("[ERROR] Missing or invalid parameters")
        return "Missing or invalid parameters", 400

    start_time = f"{start} 00:00:00"
    end_time = f"{end} 23:59:59"

    data = get_filtered_data(start_time, end_time, column)
    if not data:
        return "No data found", 404

    x = [row[0] for row in data]
    y = [row[1] for row in data]

    fig, ax = plt.subplots()
    ax.plot(x, y, marker='o')
    ax.set_title(f"{sensor_type} 데이터 그래프")
    ax.set_xlabel("시간")
    ax.set_ylabel(column)
    fig.autofmt_xdate()

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

if __name__ == '__main__':
    app.run(port=5000)