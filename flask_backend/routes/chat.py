from flask import Blueprint, request, Response
import os, requests

bp = Blueprint('chat', __name__, url_prefix='/api/chat')

SPRING_BASE = os.environ.get('SPRING_BASE', 'http://localhost:8080')
HDR_NAME = os.environ.get('SPRING_HEADER_NAME')
HDR_VALUE = os.environ.get('SPRING_HEADER_VALUE')

def make_headers():
    h = {}
    if HDR_NAME and HDR_VALUE:
        h[HDR_NAME] = HDR_VALUE
    return h

HOP_BY_HOP = {
    'connection','keep-alive','proxy-authenticate','proxy-authorization',
    'te','trailers','transfer-encoding','upgrade','content-encoding','content-length'
}

def relay(resp: requests.Response) -> Response:
    out = Response(resp.content, status=resp.status_code)
    ct = resp.headers.get('Content-Type')
    if ct:
        out.headers['Content-Type'] = ct
    for k, v in resp.headers.items():
        if k.lower() in HOP_BY_HOP or k.lower() == 'content-type':
            continue
        out.headers[k] = v
    return out

@bp.route('/users', methods=['GET'])
def get_users():
    r = requests.get(f"{SPRING_BASE}/api/chat/users", headers=make_headers(), timeout=10)
    return relay(r)

@bp.route('/history/<user_id>', methods=['GET'])
def get_chat_history(user_id):
    r = requests.get(f"{SPRING_BASE}/api/chat/history/{user_id}", headers=make_headers(), timeout=10)
    return relay(r)

# (REST 전송 브리지는 선택사항)
@bp.route('/send', methods=['POST'])
def send_message():
    data = request.get_json()
    r = requests.post(f"{SPRING_BASE}/api/chat/send", json=data, headers=make_headers(), timeout=10)
    return relay(r)
