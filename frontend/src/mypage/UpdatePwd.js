import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/mypage_css/UpdatePwd.css';

function UpdatePwd() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (newPassword !== confirmNewPassword) {
            setMessage('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!currentPassword || !newPassword) {
            setMessage('모든 필드를 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 세션 쿠키 포함
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const resultText = await response.text();

            if (response.ok) {
                alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
                // 로컬 스토리지 정보 삭제
                localStorage.removeItem("userInfo");
                // 로그인 페이지로 이동
                navigate('/login');
            } else {
                setMessage(resultText);
            }
        } catch (error) {
            console.error('비밀번호 변경 중 오류 발생:', error);
            setMessage('비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    return (
        <div className="update-container">
            <h2>비밀번호 변경</h2>
            <form className="update-content" onSubmit={handleSubmit}>
                <div className="update-inputform">
                    <div className="update-input">
                        <label>현재 비밀번호</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="update-input">
                        <label>새 비밀번호</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="update-input">
                        <label>새 비밀번호 확인</label>
                        <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="update-button">비밀번호 변경</button>
            </form>
            {message && <p className="error-message">{message}</p>}
        </div>
    );
}

export default UpdatePwd;
