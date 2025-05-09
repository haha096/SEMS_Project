import './App.css';
import { useEffect, useState } from "react";
import AppRouter from "./AppRouter";

function App() {
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
            handleLogin={handleLogin}
            handleLogout={handleLogout}
        />
    );
}

export default App;
