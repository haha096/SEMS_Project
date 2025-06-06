import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import Signup from "./Login/Signup";
import Main from "./Main";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FindId from "./Login/FindId";
import FindPassword from "./Login/FindPassword";
import ChatPage from "./chat/ChatPage";
import Chat from "./chat/Chat";
import SensorData from "./pages/SensorData";
import MonitorPage from './pages/MonitorPage';
import DataAnalysis from "./page/DataAnalysis";
import Monitoring_indoor from "./page/Monitoring/Monitoring_indoor";
import Monitoring_outdoor from "./page/Monitoring/Monitoring_outdoor";
import Device_Control from "./page/Device_Control";
import MyPage from "./mypage/MyPage";
import UpdateId from "./mypage/UpdateId";
import UpdatePwd from "./mypage/UpdatePwd";
import {useEffect, useRef, useState} from "react";
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

function AppRouter({ message, isLoggedIn, userNickname, isAdmin, handleLogin, handleLogout, socket, hasNewMessage, setHasNewMessage }) {
    const clientRef = useRef(null);

    useEffect(() => {
        if (!userNickname) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`http://localhost:8080/ws?userId=${userNickname}`),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('[AppRouter] STOMP connected');

                if (isAdmin) {
                    client.subscribe('/topic/messages/admin', (msg) => {
                        const message = JSON.parse(msg.body);
                        console.log('[AppRouter] 관리자가 메시지를 수신했습니다:', message);
                        setHasNewMessage(true);
                    });
                } else {
                    client.subscribe('/user/queue/messages', (msg) => {
                        const message = JSON.parse(msg.body);
                        console.log('[AppRouter] 유저가 메시지를 수신했습니다:', message);
                        setHasNewMessage(true);
                    });
                }
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current && clientRef.current.active) {
                clientRef.current.deactivate().then(() => {
                    console.log('[AppRouter] WebSocket disconnected');
                    clientRef.current = null;
                });
            }
        };
    }, [isAdmin, userNickname, setHasNewMessage]);

    return (
        <Router>
            <Header
                isLoggedIn={isLoggedIn}
                userNickname={userNickname}
                handleLogout={handleLogout}
                hasNewMessage={hasNewMessage}
            />

            <Routes>
                <Route
                    path="/"
                    element={
                        <Main
                            message={message}
                            isLoggedIn={isLoggedIn}
                            userNickname={userNickname}
                            socket={socket}
                        />
                    }
                />
                <Route path="/login" element={<Login handleLogin={handleLogin} />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/find-id" element={<FindId />} />
                <Route path="/find-password" element={<FindPassword />} />
                <Route path="/monitor" element={<MonitorPage />} />
                <Route path="/chatt" element={<Chat />} />
                <Route path="/sensor" element={<SensorData />} />
                <Route path="/dataanalysis" element={<DataAnalysis />} />
                <Route path="/monitoring_indoor" element={<Monitoring_indoor />} />
                <Route path="/monitoring_outdoor" element={<Monitoring_outdoor />} />
                <Route path="/devicecontrol" element={<Device_Control />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/updateid" element={<UpdateId />} />
                <Route path="/updatepwd" element={<UpdatePwd />} />
                <Route
                    path="/chat"
                    element={
                        <ChatPage
                            isLoggedIn={isLoggedIn}
                            isAdmin={isAdmin}
                            userNickname={userNickname}
                            onEnterChatPage={() => setHasNewMessage(false)}
                            setHasNewMessage={setHasNewMessage}
                        />
                    }
                />
            </Routes>
            <Footer />
        </Router>
    );
}

export default AppRouter;
