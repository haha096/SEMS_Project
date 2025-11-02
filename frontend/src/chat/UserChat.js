import React, { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../css/UserChat.css';

function UserChat({ userNickname }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [client, setClient] = useState(null);
    const chatBoxRef = useRef(null);

    useEffect(() => {
        // 과거 메시지 로드
        fetch(`http://localhost:8080/api/chat/history/${userNickname}`)
            .then(res => res.json())
            .then(data => setMessages(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error('채팅 기록 불러오기 실패:', err);
                setMessages([]);
            });

        // WebSocket 연결
        const socket = new SockJS(`http://localhost:8080/ws?userId=${userNickname}`);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log("[UserChat] WebSocket connected");
                stompClient.subscribe(`/user/queue/messages`, (msg) => {
                    const received = JSON.parse(msg.body);
                    setMessages(prev => [...prev, received]);
                });
            }
        });

        stompClient.activate();
        setClient(stompClient);

        return () => {
            stompClient.deactivate();
        };
    }, []);

    useEffect(() => {
        chatBoxRef.current?.scrollTo(0, chatBoxRef.current.scrollHeight);
    }, [messages]);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const sendMessage = async () => {
        if (client && input.trim()) {
            const message = {
                senderId: userNickname,
                receiverId: 'admin',
                content: input,
                timestamp: new Date().toISOString()
            };

            client.publish({
                destination: '/app/user-to-admin',
                body: JSON.stringify(message)
            });

            setMessages(prev => [...prev, message]);
            setInput('');
        }
    };

    return (
        <div className="chat-container">
            <h2>실시간 문의내역</h2>
            <div className="chat-box" ref={chatBoxRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={msg.senderId === userNickname ? "my-message" : "admin-message"}>
                        <div className="timestamp">{formatTimestamp(msg.timestamp)}</div>
                        <div className="message-bubble">
                            <span>{msg.content}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="메시지를 입력하세요..."
                />
                <button onClick={sendMessage}>전송</button>
            </div>
        </div>
    );
}

export default UserChat;
