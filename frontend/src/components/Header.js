import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Header.css';

function Header({ isLoggedIn, handleLogout }) {
    return (
        <header className="header">
            <Link to="/" style={{ textDecoration: 'none' }}>
                <h1 className="logo">동양학교 환경관리</h1>
            </Link>
            <nav className="nav">
                <Link to="/" style={{ textDecoration: 'none' }}>온습도 / 미세먼지 모니터링</Link>
                <Link to="/" style={{ textDecoration: 'none' }}>데이터 분석</Link>
                <Link to="/" style={{ textDecoration: 'none' }}>보고서</Link>
                <Link to="/" style={{ textDecoration: 'none' }}>기기 제어</Link>
                <Link to="/" style={{ textDecoration: 'none' }}>내정보</Link>
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
