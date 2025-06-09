let socket;
let imagePreview = null;  // 이미지 미리보기 상태 변수

// 채팅 아이콘 클릭 시 채팅박스 토글
document.getElementById('chat-toggle').addEventListener('click', () => {
    const box = document.getElementById('chat-box');
    box.classList.toggle('show');
});

// WebSocket 연결 설정 및 메시지 수신 처리
function connect(userId, role) {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    socket = new WebSocket(`${protocol}${location.host}/ws/chat?userId=${userId}&role=${role}`);

    socket.onopen = () => console.log("✅ WebSocket 연결됨");

    socket.onmessage = (event) => {
        console.log("👈 onmessage 수신:", event.data);
        const chatWindow = document.getElementById('chat-window');
        const message = event.data;

        // 현재 시간 생성 (오전/오후 HH:MM)
        const timestamp = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        // Wrapper: 시간 + 말풍선 담는 외부 div
        const wrapperDiv = document.createElement('div');
        wrapperDiv.style.display = 'flex';
        wrapperDiv.style.flexDirection = 'column';
        wrapperDiv.style.alignItems = message.startsWith("[관리자]") ? 'flex-end' : 'flex-start';
        wrapperDiv.style.margin = '5px';

        // 시간 span
        const timeSpan = document.createElement('div');
        timeSpan.className = 'message-time';
        timeSpan.textContent = timestamp;

        // 메시지 말풍선 div
        const messageDiv = document.createElement('div');
        messageDiv.className = message.startsWith("[관리자]") ? 'message right' : 'message left';

        const messageContentDiv = document.createElement('div');
        messageContentDiv.className = 'message-content';

        if (message.includes('data:image')) {
            const img = document.createElement('img');
            img.src = message.replace(/^\[.*?\]\s*/, '');
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            messageContentDiv.appendChild(img);
        } else {
            messageContentDiv.textContent = message;
        }

        messageDiv.appendChild(messageContentDiv);
        wrapperDiv.appendChild(timeSpan);      // 시간 먼저
        wrapperDiv.appendChild(messageDiv);   // 말풍선 다음

        chatWindow.appendChild(wrapperDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    socket.onclose = () => console.log("❌ WebSocket 연결 종료됨");
    socket.onerror = (error) => console.error("⚠️ WebSocket 오류:", error);
}

// DOMContentLoaded 후 사용자 아이디와 역할 설정
document.addEventListener('DOMContentLoaded', function () {
    const userId = prompt("아이디 입력 (예: student1 또는 admin)");
    const role = userId.startsWith('admin') ? 'admin' : 'student';
    let selectedReceiver = 'admin';

    connect(userId, role);

    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const input = document.getElementById('message-input');
        const msg = input.value.trim();
        if (!msg && !imagePreview) return;

        const content = msg || imagePreview;
        if (role === 'admin') {
            selectedReceiver = prompt("메시지를 보낼 학생 ID를 입력하세요", selectedReceiver);
        }

        socket.send(JSON.stringify({ sender: userId, receiver: selectedReceiver, content: content }));
        input.value = '';
        document.getElementById('previewArea').innerHTML = '';
        imagePreview = null;
    }

    // 드래그 앤 드롭 이미지 처리
    const chatWindow = document.getElementById('chat-window');
    chatWindow.addEventListener('dragover', e => { e.preventDefault(); chatWindow.classList.add('dragover'); });
    chatWindow.addEventListener('dragleave', () => chatWindow.classList.remove('dragover'));
    chatWindow.addEventListener('drop', function (e) {
        e.preventDefault(); chatWindow.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        const maxSize = 800 * 1024;
        if (file && file.type.startsWith('image/') && file.size <= maxSize) {
            const reader = new FileReader();
            reader.onload = function (event) {
                imagePreview = event.target.result;
                sendMessage();
            };
            reader.readAsDataURL(file);
        }
    });

    // 파일 선택 이미지 업로드
    document.getElementById('image-upload-input').addEventListener('change', function (e) {
        const file = e.target.files[0];
        const maxSize = 800 * 1024;
        if (file && file.type.startsWith('image/') && file.size <= maxSize) {
            const reader = new FileReader();
            reader.onload = function (event) {
                imagePreview = event.target.result;
                sendMessage();
            };
            reader.readAsDataURL(file);
        }
    });
});
