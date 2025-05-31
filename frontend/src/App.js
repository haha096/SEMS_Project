import './App.css';
import { useEffect, useState } from "react";
import AppRouter from "./AppRouter";

function App() {
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
        setIsLoggedIn(false);
        setUserNickname("");
        setIsAdmin(false);
        localStorage.removeItem("userInfo");
    };

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo) {
            setIsLoggedIn(true);
            setUserNickname(userInfo.nickname);
            setIsAdmin(userInfo.isAdmin); // 추가
        }
        //서버 연결 테스트
        fetch("http://localhost:8080/")
            .then(res => res.text())
            .then(data => setMessage(data))
            .catch(err => {
                console.error("API 요청 실패:", err);
                setMessage("서버 연결 실패 😢");
            });
    }, []);

    return (
        <AppRouter
            message={message}
            isLoggedIn={isLoggedIn}
            userNickname={userNickname}
            isAdmin={isAdmin}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            hasNewMessage={hasNewMessage}
            setHasNewMessage={setHasNewMessage}
        />
    );
}

export default App;
