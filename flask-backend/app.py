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

# 한글 폰트 설정
font_path = "C:/Windows/Fonts/malgun.ttf"
font_prop = fm.FontProperties(fname=font_path)
plt.rc('font', family=font_prop.get_name())
plt.rcParams['axes.unicode_minus'] = False

@app.route('/')
def home():
    return "🎉 Flask 서버가 정상 작동합니다!"

# 최신 24개 데이터만 가져오는 함수 (정렬 포함)
def get_filtered_data(date_str, column):
    conn = pymysql.connect(
        host='34.231.96.8',
        user='admin',
        password='mysqlmysql',
        db='springdb',
        charset='utf8mb4'
    )
    cursor = conn.cursor()

    # 날짜 조건 안에서만 최신 24개 정렬
    query = f"""
        SELECT * FROM (
            SELECT timestamp, {column}
            FROM environment_data
            WHERE DATE(timestamp) = %s
            ORDER BY timestamp DESC
        ) AS sub
        ORDER BY timestamp ASC
    """

    cursor.execute(query, (date_str,))
    result = cursor.fetchall()
    conn.close()
    return result

# 공통 메시지 이미지 그리기
def _draw_message_image(text):
    buf = io.BytesIO()
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.axis('off')
    ax.text(0.5, 0.5, text, fontsize=24, ha='center', va='center', fontweight='bold')
    plt.tight_layout()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

# 차트 API
@app.route('/chart')
def chart():
    sensor_type = request.args.get('type')
    start_str = request.args.get('start')
    end_str = request.args.get('end') or start_str

    type_map = {
        'temperature': 'avg_temperature',
        'humidity': 'avg_humidity',
        'dust': 'avg_dust'
    }

    column = type_map.get(sensor_type)
    if not column:
        return "Invalid type", 400

    start_dt = datetime.strptime(f"{start_str} 00:00:00", "%Y-%m-%d %H:%M:%S")
    end_dt = datetime.strptime(f"{end_str} 23:59:59", "%Y-%m-%d %H:%M:%S")

    print("📅 받은 start:", start_str)
    print("📅 받은 end:", end_str)
    print("📅 실제 start_dt:", start_dt)
    print("📅 실제 end_dt:", end_dt)

    now = datetime.now()
    if start_dt > now:
        return _draw_message_image("등록된 그래프가 없습니다")

    data = get_filtered_data(start_str, column)

    if not data:
        return _draw_message_image("등록된 그래프가 없습니다")

    x = [row[0] for row in data]
    y = [row[1] for row in data]

    #그래프 고정 크기로 설정
    fig, ax = plt.subplots(figsize=(12, 5))

    #너무 많아도 안 깨지게
    ax.plot(x, y, marker='o', markersize=2, linestyle='-')

    ax.set_title(f"{sensor_type} 데이터 그래프")
    ax.set_xlabel("시간")
    ax.set_ylabel(column)

    #x축 라벨 자동 간격 조정
    locator = AutoDateLocator(minticks=5, maxticks=10)
    formatter = ConciseDateFormatter(locator)
    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(formatter)

    fig.autofmt_xdate()  # x축 라벨 기울이기
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

# 테이블 API (선택)
@app.route('/table')
def table():
    sensor_type = request.args.get('type')
    start = request.args.get('start')
    end = request.args.get('end') or start

    type_map = {
        'temperature': 'avg_temperature',
        'humidity': 'avg_humidity',
        'dust': 'avg_dust'
    }

    column = type_map.get(sensor_type)
    if not column:
        return "Invalid type", 400

    start_dt = datetime.strptime(f"{start} 00:00:00", "%Y-%m-%d %H:%M:%S")
    end_dt = datetime.strptime(f"{end} 23:59:59", "%Y-%m-%d %H:%M:%S")
    now = datetime.now()

    if start_dt > now:
        return jsonify({'error': '그래프 없음'}), 400

    data = get_filtered_data(start_dt.strftime("%Y-%m-%d %H:%M:%S"),
                             end_dt.strftime("%Y-%m-%d %H:%M:%S"),
                             column)

    if not data:
        return jsonify({'message': '📭 등록된 데이터가 없습니다.'}), 200

    result = [{'timestamp': str(row[0]), column: row[1]} for row in data]
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000)