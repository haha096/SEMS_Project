import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Signup.css";

function Signup() {
    const [form, setForm] = useState({
        id: "",
        password: "",
        confirmPassword: "",
        email: "",
        nickname: ""
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const checkDuplicate = async () => {
        const response = await fetch("http://localhost:8080/api/user/check-duplicate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: form.id,
                email: form.email,
                nickname: form.nickname
            })
        });

        const data = await response.text();
        if (!response.ok) {
            setErrorMessage(data);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (form.password !== form.confirmPassword) {
            setErrorMessage("비밀번호가 일치하지 않습니다.");
            return;
        }

        // 중복 체크
        const isDuplicateFree = await checkDuplicate();
        if (!isDuplicateFree) {
            return; // 중복이 있으면 회원가입을 진행하지 않음
        }

        const userDTO = {
            id: form.id,
            password: form.password,
            nickname: form.nickname,
            email: form.email,
            isAdmin: false
        };

        try {
            const response = await fetch("http://localhost:8080/api/user/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userDTO)
            });

            if (response.ok) {
                setSuccessMessage("회원가입 성공! 로그인 페이지로 이동합니다.");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);  // 2초 후 로그인 페이지로 리디렉션
            } else {
                const message = await response.text();
                setErrorMessage(message);
            }
        } catch (error) {
            console.error("회원가입 오류:", error);
            setErrorMessage("서버 요청 실패");
        }
    };

    return (
        <div className="signup-container">
            <h2>회원가입</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>아이디</label>
                    <input
                        type="text"
                        name="id"
                        value={form.id}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>비밀번호</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>비밀번호 확인</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>이메일</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>닉네임</label>
                    <input
                        type="text"
                        name="nickname"
                        value={form.nickname}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="button-container">
                    <button type="submit" className="signup-button">회원가입</button>
                </div>

            </form>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
    );
}

export default Signup;
