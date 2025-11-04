import React from 'react';
import { useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import '../css/Header.css';

function Header({ isLoggedIn, handleLogout, hasNewMessage }) {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false); // 관리자 여부 저장
    const [sessionChecked, setSessionChecked] = useState(false);

    //관리자 여부 설정
    useEffect(() => {
        (async () => {
            try {
                console.log("세션 요청 중...");
                const res = await fetch("http://localhost:8080/api/auth/session", {
                    credentials: "include",
                });

                if (!res.ok) throw new Error("not logged in");
                const data = await res.json();

                console.log("세션 응답 데이터:", data);
                console.log("isAdmin 필드 타입:", typeof data.isAdmin, "값:", data.isAdmin);

                const admin =
                    data?.isAdmin === true ||
                    data?.isAdmin === "true" ||
                    data?.isAdmin === 1;

                setIsAdmin(!!admin);
            } catch (err) {
                console.error("❌ 세션 확인 실패:", err);
                setIsAdmin(false);
            } finally {
                setSessionChecked(true);
            }
        })();
    }, [isLoggedIn]);

        const handleMyPageClick = () => {
            if (isLoggedIn) {
                navigate('/mypage'); // 로그인 상태면 이동
            } else {
                alert('로그인 후 이용해 주세요.'); // 아니면 경고
            }
        };
        console.log("🔍 Header 렌더링 - hasNewMessage:", hasNewMessage);

        const handleDeviceControl = () => {
            if (!sessionChecked) {
                alert("세션 확인 중입니다. 잠시만 기다려주세요.");
                return;
            }
            if (isAdmin) {
                console.log("관리자 권한 확인됨 → 기기 제어 페이지로 이동");
                navigate("/devicecontrol");
            } else {
                console.warn("관리자 아님 → 접근 차단");
                alert("관리자만 접근할 수 있습니다.");
            }
        };

        console.log("🔍 Header 렌더링 완료 - 로그인상태:", isLoggedIn, "관리자:", isAdmin);

        return (
            <header className="header">
                <Link to="/" style={{textDecoration: 'none'}}>
                    <h1 className="logo">동양학교 환경관리</h1>
                </Link>
                <nav className="nav">
                    <Link to="/Monitoring_indoor" style={{textDecoration: 'none'}}>온습도 / 미세먼지 모니터링</Link>
                    <Link to="/dataanalysis" style={{textDecoration: 'none'}}>데이터 분석</Link>
                    <Link to="/" style={{textDecoration: 'none'}}>보고서</Link>
                    <button onClick={handleDeviceControl}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: sessionChecked ? "pointer" : "wait",
                                color: "inherit",
                            }}
                            title={isAdmin ? "기기 제어 페이지로 이동" : "관리자만 접근 가능"}>
                        기기 제어
                    </button>
                    <button onClick={handleMyPageClick}
                            style={{background: 'none', border: 'none', cursor: 'pointer', color: 'inherit'}}>
                        내정보
                    </button>
                    <Link to="/chat" style={{textDecoration: 'none'}}>
                        실시간 문의
                        {hasNewMessage && <span style={{color: 'red', fontSize: '18px', marginLeft: '5px'}}>N</span>}
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
