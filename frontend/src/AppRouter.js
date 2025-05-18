import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import Signup from "./Login/Signup";
import Chat from "./chat/Chat";
import SensorData from "./pages/SensorData";
import Main from "./Main";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FindId from "./Login/FindId";
import FindPassword from "./Login/FindPassword";
import MonitorPage from './pages/MonitorPage';
import DataAnalysis from "./page/DataAnalysis";
import Monitoring_indoor from "./page/Monitoring/Monitoring_indoor";
import Monitoring_outdoor from "./page/Monitoring/Monitoring_outdoor";
import Device_Control from "./page/Device_Control";
import MyPage from "./mypage/MyPage";
import {useEffect, useState} from "react";

function AppRouter({ message, isLoggedIn, userNickname, handleLogin, handleLogout, socket }) {

    return (
        <Router>
            <Header isLoggedIn={isLoggedIn} userNickname={userNickname} handleLogout={handleLogout} />

            <Routes>
                <Route path="/" element={<Main message={message} isLoggedIn={isLoggedIn} userNickname={userNickname} socket={socket} />} />
                <Route path="/login" element={<Login handleLogin={handleLogin} />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/find-id" element={<FindId />} />
                <Route path="/find-password" element={<FindPassword />} />
                <Route path="/monitor" element={<MonitorPage />} />
                <Route path="/chat" element={<Chat />} /> {/* 채팅 페이지 */}
                <Route path="/sensor" element={<SensorData />} /> {/* 센서 페이지 */}
                <Route path="/dataanalysis" element={<DataAnalysis />} />
                <Route path="/monitoring_indoor" element={<Monitoring_indoor />} />
                <Route path="/monitoring_outdoor" element={<Monitoring_outdoor />} />
                <Route path="/devicecontrol" element={<Device_Control />} />
                <Route path="/mypage" element={<MyPage />} />
            </Routes>

            <Footer />
        </Router>
    );
}

export default AppRouter;
