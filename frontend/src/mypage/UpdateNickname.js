import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/mypage_css/UpdateId.css';

function UpdateNickname() {
    const [nickname, setNickname] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!nickname) {
            setMessage('새 닉네임을 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/update-nickname', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 세션 쿠키를 포함하여 요청
                body: JSON.stringify({ nickname }),
            });

            const resultText = await response.text();

            if (response.ok) {
                alert('닉네임이 성공적으로 변경되었습니다.');
                // 로컬 스토리지의 닉네임도 업데이트
                const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                if (userInfo) {
                    userInfo.nickname = nickname;
                    localStorage.setItem("userInfo", JSON.stringify(userInfo));
                }
                // 메인 페이지로 이동하면서 새로고침하여 변경된 닉네임을 헤더에 반영
                window.location.href = "/";
            } else {
                setMessage(resultText);
            }
        } catch (error) {
            console.error('닉네임 변경 중 오류 발생:', error);
            setMessage('닉네임 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    return (
        <div className="update-container">
            <h2>닉네임 변경</h2>
            <form className="update-content" onSubmit={handleSubmit}>
                <div className="update-inputform">
                    <div className="update-input">
                        <label>새 닉네임</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder=""
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="update-button">닉네임 변경</button>
            </form>
            {message && <p className="error-message">{message}</p>}
        </div>
    );
}

export default UpdateNickname;
