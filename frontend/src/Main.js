import { useNavigate } from "react-router-dom";
import "./css/Main.css";
import React, { useEffect, useState, useRef } from 'react';

import OutdoorBlue from './assets/outdoor_img/outdoor_blue.png';
import OutdoorGreen from './assets/outdoor_img/outdoor_green.png';
import OutdoorYellow from './assets/outdoor_img/outdoor_yellow.png';
import OutdoorOrange from './assets/outdoor_img/outdoor_orange.PNG';
import OutdoorRed from './assets/outdoor_img/outdoor_red.png';

import IndoorBlue from './assets/indoor_img/indoor_blue.png';
import IndoorGreen from './assets/indoor_img/indoor_green.png';
import IndoorYellow from './assets/indoor_img/indoor_yellow.png';
import IndoorOrange from './assets/indoor_img/indoor_orange.png';
import IndoorRed from './assets/indoor_img/indoor_red.png';

function Main({ isLoggedIn, userNickname, message, socket }) {

    const navigate = useNavigate();
    const [sensorData, setSensorData] = useState({
                                                   id: 0,
                                                   timestamp: "-",
                                                   CURRENT: 0,
                                                   VOLT: 0,
                                                   TEMP: 0,
                                                   HUM: 0,
                                                   MODE: "-",
                                                   SPEED: 0,
                                                   "PM1": 0,
                                                   "PM2.5": 0,
                                                   PM10: 0,
                                                   "POWER": "-",
                                                 });
    const [lastMonthUsageSeconds, setLastMonthUsageSeconds] = useState("-");

    const [oneMinCost, setOneMinCost] = useState(0);   // 1분간 누적 요금
    const accumulatedCost = useRef(0);

    const [savedCostByAutoMode, setSavedCostByAutoMode] = useState(0);
    const accumulatedAutoSaving = useRef(0);

    // sensorData와 lastMonthUsageSeconds가 바뀔 때마다 1초 기준 요금 계산하여 누적
    useEffect(() => {
        if (sensorData && lastMonthUsageSeconds !== "-" && lastMonthUsageSeconds > 0) {
            // AUTO 모드에서만 절약 계산 수행
            if (sensorData.MODE === "AUTO") {
                const baseCurrent = 2; // 수동 모드 기준 고정 전류값
                const actualCurrent = sensorData.CURRENT;
                const savedEnergy = (baseCurrent - actualCurrent) * sensorData.VOLT * lastMonthUsageSeconds / 3600000;
                const adjustedSavedEnergy = savedEnergy * 10; // 보정값
                const savedCost = adjustedSavedEnergy * 100;

                // 음수 절약 방지
                if (savedCost > 0) {
                    accumulatedAutoSaving.current += savedCost;
                }
            }

            // 누적 사용 요금 계산 (기존 코드 유지)
            const energy_kWh = (sensorData.CURRENT * sensorData.VOLT * lastMonthUsageSeconds) / 3600000;
            const adjusted_kWh = energy_kWh * 10;
            const cost_per_sec = adjusted_kWh * 100;
            accumulatedCost.current += cost_per_sec;
        }
    }, [sensorData, lastMonthUsageSeconds]);

    // 1분마다 누적 비용을 state에 반영하고 초기화
    useEffect(() => {
        const interval = setInterval(() => {
            setOneMinCost(accumulatedCost.current.toFixed(2));
            setSavedCostByAutoMode(accumulatedAutoSaving.current.toFixed(2));

            accumulatedCost.current = 0;
            accumulatedAutoSaving.current = 0;
        }, 10000); // 10초

        return () => clearInterval(interval);
    }, []);







    // 실외 온도별 이미지
    const selectOutdoorImageByTemperature = (temp) => {
        if (Number.isNaN(temp)) return OutdoorBlue;
        if (temp >= 30) return OutdoorRed;
        if (temp >= 26) return OutdoorOrange;
        if (temp >= 22) return OutdoorYellow;
        if (temp >= 19) return OutdoorGreen;
        return OutdoorBlue;
    }

    // 실내 온도별 이미지
    const selectIndoorImageByTemperature = (temp) => {
        if (Number.isNaN(temp)) return IndoorBlue;
        if (temp >= 30) return IndoorRed;
        if (temp >= 26) return IndoorOrange;
        if (temp >= 22) return IndoorYellow;
        if (temp >= 19) return IndoorGreen;
        return IndoorBlue;
    };

// 전력(W)별 이미지 (에너지 섹션 아이콘용)
// 전력 = CURRENT(A) * VOLT(V)
    const selectEnergyImageByPower = (powerW) => {
        if (Number.isNaN(powerW)) return IndoorBlue;
        if (powerW >= 250) return IndoorRed;
        if (powerW >= 180) return IndoorOrange;
        if (powerW >= 120) return IndoorYellow;
        if (powerW >= 60)  return IndoorGreen;
        return IndoorBlue;
    };

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
    };

}, [socket]);

useEffect(() => {
    fetch("http://localhost:8080/sensor/energy/usage-time")
        .then(res => res.json())
        .then(data => {
            if (data.seconds !== undefined) {
                setLastMonthUsageSeconds(data.seconds);
            } else {
                setLastMonthUsageSeconds("-");
            }
        })
        .catch(() => setLastMonthUsageSeconds("-"));
}, []);

    //실외 온습도, 미세먼지 함수
    useEffect(() => {
        let mounted = true;
        const BASE = "http://localhost:8080";        // 필요 시 10.0.2.2:8080(에뮬), 혹은 배포 도메인

        const fetchOutdoor = async () => {
            try {
                // 1) 날씨(백엔드 JSON: { temp, humidity, windSpeed, windDir, weather, ... })
                const r1 = await fetch(`${BASE}/weather/outdoor?nx=58&ny=125`, { cache: "no-store" });
                if (!r1.ok) throw new Error(`weather ${r1.status}`);
                const w = await r1.json();

                // 2) 미세먼지(기존 API 유지)
                const r2 = await fetch(`${BASE}/api/dust`, { cache: "no-store" });
                const d = r2.ok ? await r2.json() : {};

                if (!mounted) return;
                setOutdoorTemperature(
                    typeof w.temp === "number" && !Number.isNaN(w.temp) ? w.temp.toFixed(1) : "-"
                );
                setOutdoorHumidity(
                    typeof w.humidity === "number" && !Number.isNaN(w.humidity) ? w.humidity.toFixed(0) : "-"
                );
                {
                    const rawPm10 =
                    typeof d.pm10 === "number" ? d.pm10 :
                        typeof d.pm10Value === "number" ? d.pm10Value :
                            (d?.pm10 ?? d?.pm10Value);
                    const pm10Num = Number(rawPm10);
                    setOutdoorPm10(Number.isFinite(pm10Num) ? pm10Num.toFixed(0) : "-");
                }
            } catch (e) {
                if (!mounted) return;
                setOutdoorTemperature("-");
                setOutdoorHumidity("-");
                setOutdoorPm10("-");
            }
        };

        fetchOutdoor();
        const id = setInterval(fetchOutdoor, 60_000); // 1분마다 갱신
        return () => { mounted = false; clearInterval(id); };
    }, []);



    // 센서 데이터가 없을 경우 표시할 기본 메시지
//    if (!sensorData) {
//        return <div>Loading...</div>;
//    }

    //실외데이터에 맞게 바꾼 이미지
    const outdoorTempValue = parseFloat(outdoorTemperature);
    const outdoorImage = selectOutdoorImageByTemperature(outdoorTempValue);


    // 실내
    const indoorTempValue = parseFloat(sensorData?.TEMP ?? NaN);
    const indoorImage = selectIndoorImageByTemperature(indoorTempValue);

   // 에너지(순간 전력)
    const powerW = (sensorData?.CURRENT ?? 0) * (sensorData?.VOLT ?? 0);
    const energyImage = selectEnergyImageByPower(powerW);

    return (
        <div className="container1">
            <div className="main-banner">
                <img src="/images/main_logo.png" alt="배경 이미지" className="background-image" />
            </div>

            <div className="container2">
                <div className="container3">
                    <div id="indoor" className="custom-box">실내상황</div>
                    <div className="indoor_content">
                        <img src={indoorImage} name="indoor_image" className="icon"/>
                        <div className="info-text">
                            <p>현재 실내 온도 : {sensorData["TEMP"]}도</p>
                            <p>현재 실내 습도 : {sensorData["HUM"]}%</p>
                            <p>현재 실내 미세먼지 : {sensorData["PM1"]}ug</p>
                        </div>
                    </div> {/* indoor_content */}
                </div> {/* container3 */}



                <div className="container3" id="outdoor_container">
                    <div id="outdoor" className="custom-box">실외상황</div>
                    <div className="outdoor_content">
                        <img src={outdoorImage} name="outdoor_image" className="icon" />
                        <div className="info-text">
                            <p>현재 실외 온도 : {outdoorTemperature}도</p>
                            <p>현재 실외 습도 : {outdoorHumidity}%</p>
                            <p>현재 실외 미세먼지 : {outdoorPm10 === "-" ? "--" : outdoorPm10} μg/m³</p>
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
                        <h2 className="title">사용시간</h2>
                        <img src={energyImage} alt="에너지 아이콘" className="energy-icon" />
                        <p className="energy-text">공기 청정기 쓴 시간<br />{lastMonthUsageSeconds} 초</p>
                    </div> {/* container6 */}


                    <div className="next_container">
                        <img src="/images/next.PNG" alt="플레이 아이콘" className="next_icon" />
                    </div>


                    <div className="container6">
                        <h2 className="title">전력량</h2>
                        <img src={energyImage} alt="에너지 아이콘" className="energy-icon" />
                        <p className="energy-text">공기 청정기 전력량<br /> {( (sensorData.CURRENT * sensorData.VOLT * lastMonthUsageSeconds) / 3600000 * 10 /* 오차값 */ ).toFixed(2)}  kWh</p>
                    </div> {/* container6 */}

                    <div className="saving_energy_wrapper">
                        <div className="saving_energy_container">
                            <p className="saving_energy_title">최근 10초간 전기요금</p>
                            <p className="saving_energy_amount">{oneMinCost}원</p>
                        </div>
                        <div className="saving_energy_container">
                            <p className="saving_energy_title">AUTO 모드로 절약된 요금</p>
                            <p className="saving_energy_amount">{savedCostByAutoMode}원</p>
                        </div>
                    </div>
                </div> {/* container5 */}

            </div> {/* container4 */}

            <div className="empty"></div>
            {/* Spring 메시지 표시 */}
            <div style={{ textAlign: "center", margin: "20px 0", fontSize: "20px", fontWeight: "bold" }}>
                {/* <p>Spring에서 받은 메시지: {message}</p> */}
                {/* <p>센서 데이터: {JSON.stringify(sensorData)}</p> */}
            </div>

        </div> /* container1 */
    );
}

//<img src="/images/indoor_icon.png" alt="실내 아이콘" className="icon" />
export default Main;
