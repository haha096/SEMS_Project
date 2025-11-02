import React, { useState } from "react";
import axios from 'axios';

function FindPassword() {
    const [email, setEmail] = useState("");

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            alert("이메일을 입력해주세요.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/api/auth/password-reset', { email });

            if (response.status === 200) {
                alert("비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.");
            } else {
                alert("이메일 전송에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            if (error.response && error.response.status === 404) {
                alert("등록되지 않은 이메일입니다.");
            } else {
                alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }
        }
    };

    return (
        <div className="find-container">
            <h2>비밀번호 찾기</h2>
            <form className="find-content" onSubmit={handleSubmit}>
                <div className="find-inputform">
                    <div className="find-input">
                        <label>이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="가입한 이메일을 입력하세요"
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="find-button">이메일로 전송</button>
            </form>
        </div>
    );
}

export default FindPassword;