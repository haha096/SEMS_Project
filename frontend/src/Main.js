import { useNavigate } from "react-router-dom";
import "./css/Main.css";
import React, { useEffect, useState } from 'react';

function Main({ isLoggedIn, userNickname, message, socket }) {

    const navigate = useNavigate();
    const [sensorData, setSensorData] = useState(null);

    // 실외 온습도 & 미세먼지 상태
    const [outdoorTemperature, setOutdoorTemperature] = useState("-");
    const [outdoorHumidity, setOutdoorHumidity] = useState("-");
    const [outdoorPm10, setOutdoorPm10] = useState("-");

    useEffect(() => {
        if (!socket) return;

    socket.onmessage = (event) => {
        //console.log("📡 수신된 센서 데이터:", event.data);
        const parsedData = JSON.parse(event.data);
        setSensorData(parsedData);
        localStorage.setItem("sensorData", JSON.stringify(parsedData));  // 👉 저장
    };

    const savedData = localStorage.getItem("sensorData");
    if (savedData) {
        setSensorData(JSON.parse(savedData));  // 👉 새로고침 시 복원
    }
}, [socket]);

    useEffect(() => {
        fetch("http://localhost:8080/weather/outdoor?nx=58&ny=125")
            .then(res => res.text())
            .then(data => {
                const tempMatch = data.match(/온도:\s*([\d.]+)℃/);
                const humiMatch = data.match(/습도:\s*([\d.]+)%/);
                setOutdoorTemperature(tempMatch ? tempMatch[1] : "-");
                setOutdoorHumidity(humiMatch ? humiMatch[1] : "-");
            })
            .catch(() => {
                setOutdoorTemperature("-");
                setOutdoorHumidity("-");
            });

        fetch("http://localhost:8080/api/dust")
            .then(res => res.json())
            .then(data => {
                setOutdoorPm10(data.pm10Value || "-");
            })
            .catch(() => {
                setOutdoorPm10("-");
            });
    }, []);

    // 센서 데이터가 없을 경우 표시할 기본 메시지
    if (!sensorData) {
        return <div>Loading...</div>;
    }


    return (
        <div className="container1">
            <div className="main-banner">
                <img src="/images/main_logo.png" alt="배경 이미지" className="background-image" />
            </div>

            <div className="container2">
                <div className="container3">
                    <div id="indoor" className="custom-box">실내상황</div>
                    <div className="indoor_content">
                        <img src="/images/indoor_yellow.PNG" name="indoor_image" className="icon"/>
                        <div className="info-text">
                            <p>현재 실내 온도 : {sensorData["TEMP"]}도</p>
                            <p>현재 실내 습도 : {sensorData["HUM"]}%</p>
                            <p>현재 실내 미세먼지 : {sensorData["PM1.0"]}ug</p>
                        </div>
                    </div> {/* indoor_content */}
                </div> {/* container3 */}



                <div className="container3" id="outdoor_container">
                    <div id="outdoor" className="custom-box">실외상황</div>
                    <div className="outdoor_content">
                        <img src="/images/outdoor_orange.PNG" name="indoor_image" className="icon"/>
                        <div className="info-text">
                            <p>현재 실외 온도 : {outdoorTemperature}도</p>
                            <p>현재 실외 습도 : {outdoorHumidity}%</p>
                            <p>현재 실외 미세먼지 : {outdoorPm10}ug</p>
                        </div>
                    </div> {/* outdoor_content */}
                </div> {/* container3 */}

                {isLoggedIn ? (
                    <div className="container3 main-login-container">
                        <div className="welcome-box">
                            <p className="welcome-message">{userNickname}님, 반갑습니다 😊</p>
                        </div>
                    </div>
                ) : (
                    <div className="container3 main-login-container">
                        <div className="welcome-box">
                            <p className="welcome-message">로그인이 필요합니다</p>
                            <button
                                className="login-action-button"
                                onClick={() => navigate("/login")}
                            >
                                로그인 하러가기
                            </button>
                        </div>
                    </div>
                )}



            </div> {/* container2 */}


            <div className="container4">
                <div className="energy_title">
                    <div id="energy_text" className="custom-box">에너지 절약</div>
                </div> {/* energy_title */}

                <div className="container5"> {/* 지난달 에너지 총량, next이미지, 이번달 에너지 총량, 절약힌 에너지*/}
                    <div className="container6">
                        <h2 className="title">지난 달 에너지 총량</h2>
                        <img src="/images/indoor_yellow.PNG" alt="에너지 아이콘" className="energy-icon" />
                        <p className="energy-text">공기 청정기 쓴 에너지<br />230 시간</p>
                    </div> {/* container6 */}


                    <div className="next_container">
                        <img src="/images/next.PNG" alt="플레이 아이콘" className="next_icon" />
                    </div>


                    <div className="container6">
                        <h2 className="title">지난 달 에너지 총량</h2>
                        <img src="/images/indoor_blue.PNG" alt="에너지 아이콘" className="energy-icon" />
                        <p className="energy-text">공기 청정기 쓴 에너지<br />120 시간</p>
                    </div> {/* container6 */}


                    <div className="saving_energy_container">
                        <p className="saving_energy_title">총 절약한 에너지</p>
                        <p className="saving_energy_amount">24만원</p>
                    </div>

                </div> {/* container5 */}

            </div> {/* container4 */}

            <div className="empty"></div>
            {/* Spring 메시지 표시 */}
            <div style={{ textAlign: "center", margin: "20px 0", fontSize: "20px", fontWeight: "bold" }}>
                <p>Spring에서 받은 메시지: {message}</p>
            </div>

        </div> /* container1 */
    );
}

//<img src="/images/indoor_icon.png" alt="실내 아이콘" className="icon" />
export default Main;