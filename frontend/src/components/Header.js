import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Header.css';

function Header({ isLoggedIn, handleLogout }) {
    const navigate = useNavigate();

    const handleMyPageClick = () => {
        if (isLoggedIn) {
            navigate('/mypage'); // 로그인 상태면 이동
        } else {
            alert('로그인 후 이용해 주세요.'); // 아니면 경고
        }
    };

    return (
        <header className="header">
            <Link to="/" style={{ textDecoration: 'none' }}>
                <h1 className="logo">동양학교 환경관리</h1>
            </Link>
            <nav className="nav">
                <Link to="/Monitoring_indoor" style={{ textDecoration: 'none' }}>온습도 / 미세먼지 모니터링</Link>
                <Link to="/dataanalysis" style={{ textDecoration: 'none' }}>데이터 분석</Link>
                <Link to="/" style={{ textDecoration: 'none' }}>보고서</Link>
                <Link to="/devicecontrol" style={{ textDecoration: 'none' }}>기기 제어</Link>
                <button onClick={handleMyPageClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                    내정보
                </button>
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
