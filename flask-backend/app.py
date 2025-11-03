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

# 한글 폰트 설정 (EC2 환경)
try:
    font_path = 'C:\Windows\Fonts\malgun.ttf'
    font_prop = fm.FontProperties(fname=font_path)
    plt.rc('font', family=font_prop.get_name())
    plt.rcParams['axes.unicode_minus'] = False  # 마이너스 기호 깨짐 방지
except FileNotFoundError:
    print("경고: EC2에 한글 폰트가 설치되지 않았습니다. 기본 폰트를 사용합니다.")
    plt.rcParams['axes.unicode_minus'] = False
    font_prop = None  # 폰트가 없을 경우 변수를 None으로 설정

@app.route('/')
def home():
    return "🎉 Flask 서버가 정상 작동합니다!"

# 최신 24개 데이터만 가져오는 함수 (정렬 포함)
def get_filtered_data(date_str, column):
    conn = None
    try:
        conn = pymysql.connect(
            host='database-1.ckbuuw6oc2uf.us-east-1.rds.amazonaws.com',
            user='admin',
            password='mysqlmysql',
            db='springdb',
            charset='utf8mb4'
        )
        cursor = conn.cursor()

        # 날짜 조건 안에서만 데이터 가져오기 (시간 순 정렬)
        query = f"""
            SELECT timestamp, {column}
            FROM environment_data
            WHERE DATE(timestamp) = %s
            ORDER BY timestamp ASC
        """

        cursor.execute(query, (date_str,))
        result = cursor.fetchall()
        return result
    except pymysql.MySQLError as e:
        print(f"❌ 데이터베이스 연결 또는 쿼리 오류: {e}")
        return None
    finally:
        if conn:
            conn.close()

# 공통 메시지 이미지 그리기
def _draw_message_image(text):
    buf = io.BytesIO()
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.axis('off')
    if font_prop:
        ax.text(0.5, 0.5, text, fontproperties=font_prop, fontsize=24, ha='center', va='center', fontweight='bold')
    else:
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

    type_map = {
        'temperature': 'avg_temperature',
        'humidity': 'avg_humidity',
        'dust': 'avg_dust'
    }

    column = type_map.get(sensor_type)
    if not column:
        return "Invalid type", 400

    now = datetime.now()
    try:
        start_dt = datetime.strptime(start_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        return _draw_message_image("잘못된 날짜 형식입니다. (YYYY-MM-DD)")

    if start_dt.date() > now.date():
        return _draw_message_image("미래 날짜의 그래프는 없습니다.")

    data = get_filtered_data(start_str, column)

    if not data:
        return _draw_message_image("등록된 그래프가 없습니다.")

    x = [row[0] for row in data]
    y = [row[1] for row in data]

    fig, ax = plt.subplots(figsize=(12, 5))

    ax.plot(x, y, marker='o', markersize=2, linestyle='-')

    if font_prop:
        ax.set_title(f"{sensor_type} 데이터 그래프", fontproperties=font_prop)
        ax.set_xlabel("시간", fontproperties=font_prop)
        ax.set_ylabel(column, fontproperties=font_prop)
    else:
        ax.set_title(f"{sensor_type} 데이터 그래프")
        ax.set_xlabel("시간")
        ax.set_ylabel(column)

    locator = AutoDateLocator(minticks=5, maxticks=10)
    formatter = ConciseDateFormatter(locator)
    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(formatter)
    fig.autofmt_xdate()

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

# 테이블 API
@app.route('/table')
def table():
    sensor_type = request.args.get('type')
    start = request.args.get('start')

    type_map = {
        'temperature': 'avg_temperature',
        'humidity': 'avg_humidity',
        'dust': 'avg_dust'
    }

    column = type_map.get(sensor_type)
    if not column:
        return jsonify({'error': 'Invalid type'}), 400

    try:
        start_dt = datetime.strptime(start, "%Y-%m-%d")
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid date format'}), 400

    now = datetime.now()
    if start_dt.date() > now.date():
        return jsonify({'error': '등록된 데이터가 없습니다.'}), 400

    # get_filtered_data 함수는 날짜 문자열만 받으므로 수정
    data = get_filtered_data(start, column)

    if data is None:  # DB 연결 오류로 데이터가 None일 경우
        return jsonify({'error': '데이터베이스 연결 오류'}), 500

    if not data:
        return jsonify({'message': '📭 등록된 데이터가 없습니다.'}), 200

    result = [{'timestamp': row[0].strftime("%Y-%m-%d %H:%M:%S"), column: row[1]} for row in data]
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)