import React from 'react';
import { useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import '../css/Header.css';

function Header({ isLoggedIn, handleLogout, hasNewMessage }) {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false); // 관리자 여부 저장

    //관리자 여부 설정
    useEffect(() => {
        fetch("http://localhost:8080/api/user/session", {
            credentials: "include", // 세션 쿠키 유지
        })
            .then((res) => {
                if (!res.ok) throw new Error("로그인 안 됨");
                return res.json();
            })
            .then((data) => {
                setIsAdmin(data.isAdmin === true || data.isAdmin === true);
            })
            .catch(() => setIsAdmin(false));
    }, []);

    const handleMyPageClick = () => {
        if (isLoggedIn) {
            navigate('/mypage'); // 로그인 상태면 이동
        } else {
            alert('로그인 후 이용해 주세요.'); // 아니면 경고
        }
    };
    console.log("🔍 Header 렌더링 - hasNewMessage:", hasNewMessage);

    return (
        <header className="header">
            <Link to="/" style={{ textDecoration: 'none' }}>
                <h1 className="logo">동양학교 환경관리</h1>
            </Link>
            <nav className="nav">
                <Link to="/Monitoring_indoor" style={{ textDecoration: 'none' }}>온습도 / 미세먼지 모니터링</Link>
                <Link to="/dataanalysis" style={{ textDecoration: 'none' }}>데이터 분석</Link>
                <Link to="/" style={{ textDecoration: 'none' }}>보고서</Link>
                <button
                  onClick={() => {
                    if (isAdmin) {
                          navigate("/devicecontrol");
                        } else {
                          alert("관리자만 접근할 수 있습니다.");
                        }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  기기 제어</button>
                <button onClick={handleMyPageClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                    내정보
                </button>
                <Link to="/chat" style={{ textDecoration: 'none' }}>
                    실시간 문의
                    {hasNewMessage && <span style={{ color: 'red', fontSize: '18px', marginLeft: '5px' }}>N</span>}
                </Link>

            </nav>

            {isLoggedIn ? (
                <button onClick={handleLogout} className="login-btn">LOGOUT</button>
            ) : (
                <Link to="/login">
                    <button className="login-btn">LOGIN</button>
                </Link>
            )}
        </header>
    );
}

export default Header;
