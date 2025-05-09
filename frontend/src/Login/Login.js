import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../css/Login.css';
import { Link } from "react-router-dom";

function Login({ handleLogin }) {
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        // 서버에 로그인 요청
        try {
            const response = await fetch("http://localhost:8080/api/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: id.trim(), password: password.trim() })
            });

            const result = await response.json(); // JSON 응답 받기

            if (response.ok) {
                if (result.nickname) {
                    handleLogin(result.nickname); // 닉네임 전달
                    navigate("/");
                } else {
                    setErrorMessage("로그인 성공했지만 닉네임이 없습니다.");
                }
            } else {
                setErrorMessage(result.message || "아이디 또는 비밀번호가 틀렸습니다.");
            }
        } catch (error) {
            console.error("로그인 오류:", error);
            setErrorMessage("서버 요청 실패");
        }
    };

    return (
        <div className="login-container">
            <h2>로그인</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>아이디</label>
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-button">로그인</button>
            </form>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <div className="login-links">
                <Link to="/find-id">아이디 찾기</Link>
                <span>|</span>
                <Link to="/find-password">비밀번호 찾기</Link>
                <span>|</span>
                <Link to="/signup">회원가입</Link>
            </div>
        </div>
    );
}

export default Login;
