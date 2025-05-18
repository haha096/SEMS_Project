import './App.css';
import { useEffect, useState, useRef } from "react";
import AppRouter from "./AppRouter";
import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom";

function App() {
    const socketRef = useRef(null);

    const [message, setMessage] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userNickname, setUserNickname] = useState("");

    const handleLogin = (nickname) => {
        setIsLoggedIn(true);
        setUserNickname(nickname);
    };

    const handleLogout = () => {
        fetch("http://localhost:8080/api/user/logout", {
            method: "POST",
            credentials: "include"
        })
            .then(() => {
                console.log("로그아웃 완료");
                window.location.href = "/";
            })
            .catch(err => console.error("로그아웃 실패:", err));
    };

   useEffect(() => {
     // WebSocket 연결
     const socket = new WebSocket('ws://localhost:8080/ws/sensor');  // WebSocket 서버 주소
     socketRef.current = socket;

     // 서버로부터 메시지를 받았을 때
     socket.onmessage = (event) => {
     console.log("WebSocket 메시지 수신:", event.data);  // 수신한 데이터 로그
       const data = JSON.parse(event.data);  // 메시지가 JSON 형식이라면
       setMessage(data);  // 받은 데이터를 상태에 업데이트
     };

     // WebSocket 연결 종료 시
     socket.onclose = () => {
       console.log("WebSocket 연결 종료");
     };

     // 에러 처리
     socket.onerror = (error) => {
       console.error("WebSocket 오류 발생:", error);
       setMessage("서버 연결 실패 😢");
     };

     // 컴포넌트가 언마운트 될 때 WebSocket 연결 종료
     return () => {
       socket.close();
     };
   }, []);  // 빈 배열을 넣어서 컴포넌트가 마운트될 때만 실행

    //로그인 세션
    useEffect(() => {
        fetch('http://localhost:8080/api/user/session', {
            credentials: 'include'
        })
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => {
                setIsLoggedIn(true);
                setUserNickname(data.nickname);
            })
            .catch(() => {
                setIsLoggedIn(false);
                setUserNickname("");
            });
    }, []);


    return (
    <div>
        <AppRouter
            message={message}
            isLoggedIn={isLoggedIn}
            userNickname={userNickname}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            socket={socketRef.current}
        />

    </div>
    );
}

export default App;
