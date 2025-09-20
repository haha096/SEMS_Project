import './App.css';
import { useEffect, useState } from "react";
import AppRouter from "./AppRouter";

function App() {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userNickname, setUserNickname] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    const handleLogin = (nickname, isAdminValue) => {
        setIsLoggedIn(true);
        setUserNickname(nickname);
        setIsAdmin(isAdminValue);
    };

    const handleLogout = () => {
        fetch("http://107.21.218.155:8080/api/user/logout", {
            method: "POST",
            credentials: "include"
        })
            .then(() => {
                console.log("로그아웃 완료");
                window.location.href = "/";
            })
            .catch(err => console.error("로그아웃 실패:", err));
        setIsLoggedIn(false);
        setUserNickname("");
        setIsAdmin(false);
        localStorage.removeItem("userInfo");
    };

    useEffect(() => {
        // WebSocket 연결
        const ws = new WebSocket('ws://107.21.218.155:8080/ws/sensor');

        ws.onopen = () => {
            console.log("✅ WebSocket 연결 성공");
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            console.log("WebSocket 메시지 수신:", event.data);
            try {
                const data = JSON.parse(event.data);
                setMessage(data);
            } catch (e) {
                console.error("❌ JSON 파싱 실패:", e, "📨 메시지 내용:", event.data);
                setMessage("서버에서 잘못된 형식의 데이터를 받았습니다.");
            }
        };

        ws.onclose = () => {
            console.log("WebSocket 연결 종료");
        };

        ws.onerror = (error) => {
            console.error("WebSocket 오류 발생:", error);
            setMessage("서버 연결 실패 😢");
        };

        // 로그인 정보 설정
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo) {
            setIsLoggedIn(true);
            setUserNickname(userInfo.nickname);
            setIsAdmin(userInfo.isAdmin);
        }

        // 서버 연결 테스트
        fetch("http://107.21.218.155:8080/")
            .then(res => res.text())
            .then(data => setMessage(data))
            .catch(err => {
                console.error("API 요청 실패:", err);
                setMessage("서버 연결 실패 😢");
            });

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    return (
        <AppRouter
            message={message}
            isLoggedIn={isLoggedIn}
            userNickname={userNickname}
            isAdmin={isAdmin}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            socket={socket}
            hasNewMessage={hasNewMessage}
            setHasNewMessage={setHasNewMessage}
        />
    );
}

export default App;
