import matplotlib
matplotlib.use('Agg')

from flask import Flask, send_file
import matplotlib.pyplot as plt
import io
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "🎉 Flask 서버가 정상 작동합니다!"

@app.route('/chart')
def chart():
    x = [1, 2, 3, 4, 5]
    y = [100, 34, 14, 41, 33]

    fig, ax = plt.subplots()
    ax.plot(x, y, marker='o')
    ax.set_title("1-1교실의 그래프")
    ax.set_xlabel("X Axis")
    ax.set_ylabel("Y Axis")

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

if __name__ == '__main__':
    app.run(port=5000)