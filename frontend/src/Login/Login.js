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

        try {
            const response = await fetch("http://107.21.218.155:8080/api/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: id.trim(), password: password.trim() }),
//                credentials: "include"
            });

            const result = await response.json();

            if (response.ok) {
                 // 서버가 응답한 데이터에 토큰이 있는지 확인합니다.
                 if (result.token) {
                     // ✅ 1. 서버에서 받은 토큰을 localStorage에 저장합니다.
                     localStorage.setItem("token", result.token);

                     // ✅ 2. 닉네임, 이메일, 관리자 여부 등 사용자 정보도 함께 저장합니다.
                     //     (서버 응답에 토큰 외에 이 정보들이 포함되어 있다는 가정 하에)
                     localStorage.setItem("userInfo", JSON.stringify({
                         nickname: result.nickname,
                         email: result.email, // 이메일 정보도 추가
                         isAdmin: result.isAdmin
                     }));

                     // 로그인 상태를 앱 전반에 반영하기 위해 상위 컴포넌트의 함수를 호출합니다.
                     // 이 부분은 기존 코드를 활용하면 됩니다.
                     handleLogin(result.nickname, result.isAdmin);

                    navigate("/");
                } else {
                // 서버가 토큰을 보내주지 않았을 경우의 예외 처리
                    setErrorMessage("로그인에 성공했지만 토큰을 받지 못했습니다.");
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
