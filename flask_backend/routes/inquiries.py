# flask_backend/routes/inquiries.py
from flask import Blueprint, request, Response
import os, requests

bp = Blueprint('inquiries', __name__, url_prefix='/api/inquiries')

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

@bp.route('/thread', methods=['GET'])
def get_my_thread():
    r = requests.get(f"{SPRING_BASE}/api/inquiries/thread", headers=make_headers(), timeout=10)
    return relay(r)

@bp.route('/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    r = requests.post(f"{SPRING_BASE}/api/inquiries/messages", json=data, headers=make_headers(), timeout=10)
    return relay(r)

@bp.route('/threads', methods=['GET'])
def admin_list_threads():
    r = requests.get(f"{SPRING_BASE}/api/inquiries/threads", headers=make_headers(), timeout=10)
    return relay(r)

@bp.route('/threads/<user_id>', methods=['GET'])
def admin_get_thread(user_id):
    r = requests.get(f"{SPRING_BASE}/api/inquiries/threads/{user_id}", headers=make_headers(), timeout=10)
    return relay(r)
