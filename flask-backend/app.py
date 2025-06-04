import matplotlib
from matplotlib.dates import AutoDateLocator, ConciseDateFormatter

matplotlib.use('Agg')

from flask import Flask, send_file, request, jsonify
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import io
from flask_cors import CORS
from datetime import datetime, timedelta

import pymysql

app = Flask(__name__)
CORS(app)

#한글폰트 관련 matplotlib -> 절대 건들지 말 것
font_path = "C:/Windows/Fonts/malgun.ttf"
font_prop = fm.FontProperties(fname=font_path)
plt.rc('font', family=font_prop.get_name())

plt.rcParams['axes.unicode_minus'] = False

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
    print("🔥 실제 접속된 DB:", conn.get_server_info())

    cursor = conn.cursor()
    query = f"""
        SELECT timestamp, {column}
        FROM environment_data
        WHERE timestamp BETWEEN %s AND %s
        ORDER BY timestamp
    """
    cursor.execute(query, (start, end))
    result = cursor.fetchall()
    conn.close()
    return result


@app.route('/chart')
def chart():
    import matplotlib.dates as mdates

    sensor_type = request.args.get('type')
    start = request.args.get('start')
    end = request.args.get('end')

    type_map = {
        'temperature': 'temperature',
        'humidity': 'humidity',
        'dust': 'dust'
    }

    column = type_map.get(sensor_type)
    if not column:
        return "Invalid type", 400

    if not start or not end:
        now = datetime.now()
        start = (now - timedelta(hours=12)).strftime('%Y-%m-%d %H:%M:%S')
        end = now.strftime('%Y-%m-%d %H:%M:%S')
    else:
        start = f"{start} 00:00:00"
        end = f"{end} 23:59:59"

    data = get_filtered_data(start, end, column)
    if not data:
        return "No data found", 404

    x = [row[0] for row in data]
    y = [row[1] for row in data]

    width = max(10, len(x) * 0.4)  # 데이터 하나당 0.4인치, 최소 10
    fig, ax = plt.subplots(figsize=(width, 5))


    ax.plot(x, y, marker='o', linestyle='-')
    ax.set_title(f"{sensor_type} 데이터 그래프")
    ax.set_xlabel("시간")
    ax.set_ylabel(column)

    locator = AutoDateLocator()
    formatter = ConciseDateFormatter(locator)
    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(formatter)

    fig.autofmt_xdate()

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

#표분석 table함수
@app.route('/table')
def table():
    sensor_type = request.args.get('type')
    start = request.args.get('start')
    end = request.args.get('end')

    type_map = {
        'temperature': 'temp',
        'humidity': 'hum',
        'dust': 'pm2_5'
    }
    column = type_map.get(sensor_type)
    if not column:
        return "Invalid type", 400

    # 날짜가 없으면 최근 12시간으로 자동 설정
    if not start or not end:
        now = datetime.now()
        start = (now - timedelta(hours=12)).strftime('%Y-%m-%d %H:%M:%S')
        end = now.strftime('%Y-%m-%d %H:%M:%S')

    data = get_filtered_data(start, end, column)
    if not data:
        return jsonify([])

    result = [
        {'timestamp': str(row[0]), column: row[1]}
        for row in data
    ]
    return jsonify(result)




if __name__ == '__main__':
    app.run(port=5000)