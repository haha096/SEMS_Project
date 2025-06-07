import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import '../../../css/page_css/Floor/Monitoring_indoor_FirstRoom1.css';
import { useNavigate } from "react-router-dom";

function Monitoring_indoor_FirstRoom1({ socket }){
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

    //실내 데이터 (웹소켓)
    useEffect(() => {
        if (!socket) return;

    socket.onmessage = (event) => {
        //console.log("📡 수신된 센서 데이터:", event.data);
        const parsedData = JSON.parse(event.data);
        setSensorData(parsedData);
    };

}, [socket]);


    return(
        <div className="detail_indoor-container">

            <div className="detail_indoor-container2">
                <div className="update_time">업데이트 시간 : {sensorData["timestamp"]}</div>
                <button className="outdoor_button"
                        onClick={() => navigate("/monitoring_outdoor")}>
                    실외</button>
            </div>

            <div className="status-section">
                <h3>현재 실내 온습도 상황</h3>
                <div className="status-box">
                    <div className="status-item">
                        <span>온도</span>
                        <span>{sensorData["TEMP"]}도</span>
                    </div>
                    <div className="status-item">
                        <span>습도</span>
                        <span>{sensorData["HUM"]}%</span>
                    </div>
                    <div className="status-item">
                        <span>상태</span>
                        <span>{sensorData["POWER"]}</span>
                    </div>
                </div>
            </div>


            <div className="status-section">
                <h3>현재 실내 미세먼지 상황</h3>
                <div className="status-box">
                    <div className="status-item">
                        <span>미세먼지</span>
                        <span>{sensorData["PM1"]}ug</span>
                    </div>
                    <div className="status-item">
                        <span>상태</span>
                        <span>{sensorData["POWER"]}</span>
                    </div>
                </div>
            </div>


            <div className="status-section">
                <h3>저장된 온습도 상황</h3>
                <div className="status-box">
                    <div className="status-item">
                        <span>온도</span>
                        <span>26도</span>
                    </div>
                    <div className="status-item">
                        <span>공기청정기</span>
                        <span>ON</span>
                    </div>
                </div>
            </div>


        </div>
    );
}

export default Monitoring_indoor_FirstRoom1;