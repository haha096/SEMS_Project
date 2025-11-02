import React, {useState} from "react";
import { Link } from "react-router-dom";
import '../../../css/page_css/Floor/Monitoring_indoor_FirstRoom1.css';
import { useNavigate } from "react-router-dom";

function Monitoring_indoor_FirstRoom1(){
    const navigate = useNavigate();

    return(
        <div className="detail_indoor-container">

            <div className="detail_indoor-container2">
                <div className="update_time">업데이트 시간 : 2025 / 03 / 29</div>
                <button className="outdoor_button"
                        onClick={() => navigate("/monitoring_outdoor")}>
                    실외</button>
            </div>

            <div className="status-section">
                <h3>현재 실내 온습도 상황</h3>
                <div className="status-box">
                    <div className="status-item">
                        <span>온도</span>
                        <span>23도</span>
                    </div>
                    <div className="status-item">
                        <span>습도</span>
                        <span>43%</span>
                    </div>
                    <div className="status-item">
                        <span>상태</span>
                        <span>정상</span>
                    </div>
                </div>
            </div>


            <div className="status-section">
                <h3>현재 실내 미세먼지 상황</h3>
                <div className="status-box">
                    <div className="status-item">
                        <span>미세먼지</span>
                        <span>240ug</span>
                    </div>
                    <div className="status-item">
                        <span>상태</span>
                        <span>정상</span>
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