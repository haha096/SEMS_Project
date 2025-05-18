import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import '../css/mypage_css/MyPage.css'
import { Link } from "react-router-dom";

function MyPage(){
    // const [userInfo, setUserInfo] = useState(null);
    // const navigate = useNavigate();
    //
    // useEffect(() => {
    //     fetch("http://localhost:8080/api/user/session", {
    //         credentials: "include"  // ✅ 세션 쿠키 포함
    //     })
    //         .then(res => {
    //             if (!res.ok) {
    //                 throw new Error("로그인 정보가 없습니다.");
    //             }
    //             return res.json();
    //         })
    //         .then(data => {
    //             console.log("서버에서 받은 유저 정보:", data);
    //             setUserInfo(data);
    //         })
    //         .catch(err => {
    //             console.error(err.message);
    //             alert("로그인 후 이용해 주세요.");
    //             navigate("/login");
    //         });
    // }, [navigate]);
    //
    // if (!userInfo) {
    //     return <div>Loading...</div>;
    // }

    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8080/api/user/session', {
            credentials: 'include'  // ✅ 세션 쿠키 포함
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("로그인 정보가 없습니다.");
                }
                return res.json();
            })
            .then(data =>{
                console.log("마이페이지 유저 정보:", data);  // 👉 데이터 확인용
                setUserInfo(data);
            })
            .catch(err => {
                console.error(err.message);
                alert("로그인 후 이용해 주세요.");
                window.location.href = "/login";
            });
    }, []);

    if (!userInfo) {
        return <div>Loading...</div>;
    }

    return(
        <div className="mypage-container">

            <div className="mypage-box">
                <div className="mypage-box_content">
                    <div className="mypage_title">마이페이지</div>

                    <div className="mypage_content2">
                        <div className="mypage_name">{userInfo.nickname}님 (사용자)</div>
                        <div className="mypage_id">아이디 : {userInfo.userId}</div>
                        <div className="mypage_email">이메일 : {userInfo.email}</div>
                    </div>

                </div>
            </div>


            <div className="mypage-actions">
                <button>아이디 수정</button>
                <span>|</span>
                <button>비밀번호 수정</button>
            </div>
        </div>
    );
}

export default MyPage;