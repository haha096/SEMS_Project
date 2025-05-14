import './App.css';
import { useEffect, useState, useRef } from "react";
import AppRouter from "./AppRouter";
import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom";

import Login from "./Login/Login";
import Signup from "./Login/Signup";
import Main from "./Main";
import Header from "./components/Header";
import Footer from "./components/Footer";
import DataAnalysis from "./page/DataAnalysis";
import Monitoring_indoor from "./page/Monitoring/Monitoring_indoor";
import Monitoring_outdoor from "./page/Monitoring/Monitoring_outdoor";
import Device_Control from "./page/Device_Control";

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
        setIsLoggedIn(false);
        setUserNickname("");
    };

   useEffect(() => {
     // WebSocket 연결
     const socket = new WebSocket('ws://localhost:8080/');  // WebSocket 서버 주소
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

        <Router>
            <Header />

            <Routes>
                <Route path="/" element={<Main message={message} />} />
                <Route path="/login" element={<Login handleLogin={handleLogin} />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dataanalysis" element={<DataAnalysis />} />
                <Route path="/monitoring_indoor" element={<Monitoring_indoor />} />
                <Route path="/monitoring_outdoor" element={<Monitoring_outdoor />} />
                <Route path="/devicecontrol" element={<Device_Control />} />
            </Routes>

            <Footer />
        </Router>
    </div>
    );
}

export default App;
