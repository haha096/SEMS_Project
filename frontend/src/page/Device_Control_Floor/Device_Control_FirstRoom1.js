import React, {useState} from "react";
import { Link } from "react-router-dom";
import "../../css/page_css/Device_Control_Floor/Device_Control_FirstRoom1.css";

function Device_Control_FirstRoom1(){
    const [powerOn, setPowerOn] = useState(true);
    const [manualLevel, setManualLevel] = useState(1);
    const [savedLevel, setSavedLevel] = useState(null);

    return(
        <div className="device_control_detail-container">
            <div className="device_control_detail-container2">
                <div className="update_time">업데이트 시간 : 2025 / 03 / 29</div>

                <br/>
                <br/>


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

            </div>

            <br/>

            <div className="device_control_detail-container3">
                <div className="aircon-power-label">공기천정기 전원</div>

                <div className="power-button-group">
                    <button
                        className={`power-button ${powerOn ? "active" : ""}`}
                        onClick={() => setPowerOn(true)}
                    >
                        ON
                    </button>
                    <button
                        className={`power-button ${!powerOn ? "active" : ""}`}
                        onClick={() => setPowerOn(false)}
                    >
                        OFF
                    </button>
                </div>

                <div className="power-state-text">
                    전원 {powerOn ? "ON" : "OFF"}
                </div>
            </div>

            <br/>

            <div className="device_control_detail-container4">
                <div className="aircon-passvity-label">공기청정기 수동설정</div>
                <div className="manual-control-group">
                    <span className="manual-level">{manualLevel}단</span>

                    <button
                        className="manual-button"
                        onClick={() => setManualLevel(prev => Math.min(prev + 1, 3))}
                    >
                        ▲
                    </button>

                    <button
                        className="manual-button"
                        onClick={() => setManualLevel(prev => Math.max(prev - 1, 1))}
                    >
                        ▼
                    </button>

                    <button
                        className="manual-save-button"
                        onClick={() => setSavedLevel(manualLevel)}
                    >
                        저장
                    </button>
                </div>
            </div>

            <div className="saved-level-text">현재 설정: {savedLevel}단</div>
        </div>


    );
}

export default Device_Control_FirstRoom1;