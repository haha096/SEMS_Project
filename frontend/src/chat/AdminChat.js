import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import '../css/AdminChat.css';

const AdminChat = () => {
    const [messagesMap, setMessagesMap] = useState({}); // { userId: [messages] }
    const [selectedUser, setSelectedUser] = useState('');
    const [input, setInput] = useState('');
    const [userList, setUserList] = useState([]);
    const [unreadMap, setUnreadMap] = useState({});
    const clientRef = useRef(null);
    const chatBoxRef = useRef(null);

    useEffect(() => {
        if (clientRef.current) return;

        axios.get('http://localhost:8080/api/chat/users')
            .then(res => setUserList(res.data))
            .catch(err => console.error('유저 목록 불러오기 실패:', err));

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('[ADMIN] WebSocket Connected');

                client.subscribe('/topic/messages/admin', (msg) => {
                    const newMsg = JSON.parse(msg.body);
                    const { senderId } = newMsg;
                    console.log('[ADMIN] 수신된 메시지:', newMsg);

                    setMessagesMap(prev => {
                        const prevMessages = prev[senderId] || [];
                        const combined = [...prevMessages, newMsg];

                        // 중복 제거
                        const unique = [
                            ...new Map(combined.map(m => [`${m.timestamp}_${m.senderId}_${m.content}`, m])).values()
                        ];

                        return { ...prev, [senderId]: unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) };
                    });

                    setUserList(prev => {
                        const newList = [...new Set([...prev, senderId])];
                        return newList.sort();
                    });

                    if (senderId !== selectedUser) {
                        setUnreadMap(prev => ({ ...prev, [senderId]: true }));
                    }
                });

                clientRef.current = client;
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
            }
        });

        client.activate();

        return () => {
            if (clientRef.current && clientRef.current.active) {
                clientRef.current.deactivate().then(() => {
                    console.log('[ADMIN] WebSocket Disconnected');
                    clientRef.current = null;
                });
            }
        };
    }, []);

    useEffect(() => {
        chatBoxRef.current?.scrollTo(0, chatBoxRef.current.scrollHeight);
    }, [messagesMap, selectedUser]);

    const handleUserClick = async (userId) => {
        setSelectedUser(userId);

        setUnreadMap(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
        });

        try {
            const res = await axios.get(`http://localhost:8080/api/chat/history/${userId}`);
            const dbMessages = res.data;

            const wsMessages = messagesMap[userId] || [];
            const allMessages = [...dbMessages, ...wsMessages];

            const uniqueMessages = [
                ...new Map(allMessages.map(m => [`${m.timestamp}_${m.senderId}_${m.content}`, m])).values()
            ];

            setMessagesMap(prev => ({
                ...prev,
                [userId]: uniqueMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            }));
        } catch (error) {
            console.error('이전 채팅 불러오기 실패:', error);
        }
    };

    const formatTimestamp = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const sendMessage = async () => {
        if (!clientRef.current?.connected || !input.trim() || !selectedUser) return;

        const message = {
            senderId: 'admin',
            receiverId: selectedUser,
            content: input,
            timestamp: new Date().toISOString()
        };

        clientRef.current.publish({
            destination: '/app/admin-to-user',
            body: JSON.stringify(message)
        });

        setMessagesMap(prev => {
            const prevMsgs = prev[selectedUser] || [];
            const updated = [...prevMsgs, message];
            const unique = [
                ...new Map(updated.map(m => [`${m.timestamp}_${m.senderId}_${m.content}`, m])).values()
            ];
            return { ...prev, [selectedUser]: unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) };
        });

        setInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    const selectedMessages = messagesMap[selectedUser] || [];

    return (
        <div className="admin-chat-container">
            <h2>실시간 문의 관리</h2>
            <div className="admin-chat-main">
                <div className="user-list">
                    <h3>유저 목록</h3>
                    {userList.map(user => (
                        <div
                            key={user}
                            className={`user-item ${selectedUser === user ? 'selected' : ''}`}
                            onClick={() => handleUserClick(user)}
                            style={{ backgroundColor: unreadMap[user] ? 'red' : '' }}
                        >
                            {user}
                        </div>
                    ))}
                </div>
                <div className="admin-chat-box">
                    <div className="chat-history" ref={chatBoxRef}>
                        {selectedMessages.map((msg, idx) => (
                            <div key={idx}>
                                <div className="timestamp-admin">{formatTimestamp(msg.timestamp)}</div>
                                <div className={msg.senderId === 'admin' ? 'admin-my-message' : 'user-message'}>
                                    <b>{msg.senderId}:</b> {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="chat-input">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="메시지 입력..."
                        />
                        <button onClick={sendMessage}>전송</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminChat;
