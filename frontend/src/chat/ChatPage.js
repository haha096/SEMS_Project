import React, { useEffect } from 'react';
import AdminChat from '../chat/AdminChat';
import UserChat from '../chat/UserChat';
import { useNavigate } from "react-router-dom";
import '../css/LoginBox.css';

function ChatPage({ isLoggedIn, isAdmin, userNickname, onEnterChatPage }) {
    const navigate = useNavigate();

    useEffect(() => {
        onEnterChatPage();
    }, [onEnterChatPage]);

    if (!isLoggedIn) {
        return (
            <div className="logincontainer">
                <div className="welcomebox">
                    <p className="welcomemessage">로그인이 필요합니다</p>
                    <button
                        className="loginactionbutton"
                        onClick={() => navigate("/login")}
                    >
                        로그인 하러가기
                    </button>
                </div>
            </div>
        );
    }

    return isAdmin ? (
        <AdminChat userNickname={userNickname} />
    ) : (
        <UserChat userNickname={userNickname} />
    );
}

export default ChatPage;
