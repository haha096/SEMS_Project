// src/components/Device_Control_FirstRoom1.js
import React, { useState } from "react";
import axios from "axios";
import "../../css/page_css/Device_Control_Floor/Device_Control_FirstRoom1.css";

function Device_Control_FirstRoom1() {
    // ─────────────────────────────────────────────
    // state 정의
    // ─────────────────────────────────────────────
    // 전원 상태 (true = ON, false = OFF)
    const [powerOn, setPowerOn] = useState(true);

    // 자동/수동 모드 ( "AUTO" 또는 "MANUAL" )
    const [mode, setMode] = useState("AUTO");

    // 수동 모드에서 선택한 단계 (1~3)
    const [manualLevel, setManualLevel] = useState(1);

    // 실제로 저장(전송)된 수동 단계
    const [savedLevel, setSavedLevel] = useState(null);

    // API 호출 후 피드백 메시지
    const [statusMessage, setStatusMessage] = useState("");

    // ─────────────────────────────────────────────
    // 1) 전원 ON/OFF 토글 함수
    // ─────────────────────────────────────────────
    const handlePowerToggle = async (turnOn) => {
        try {
            // 백엔드: POST /api/motor/power { on: true/false }
            const res = await axios.post("/api/motor/power", { on: turnOn });
            setPowerOn(turnOn);
            setStatusMessage(res.data); // 예: "전원 ON 명령 전송 완료" or "전원 OFF 명령 전송 완료"
        } catch (error) {
            console.error("Power API 호출 에러:", error);
            setStatusMessage("⚠ 전원 명령 전송 실패");
        }
    };

    // ─────────────────────────────────────────────
    // 2) 자동 모드 설정 함수
    // ─────────────────────────────────────────────
    const handleAutoMode = async () => {
        try {
            // 백엔드: GET /api/motor/auto
            const res = await axios.get("/api/motor/auto");
            setMode("AUTO");
            setStatusMessage(res.data); // 예: "AUTO 모드 명령 전송 완료"
        } catch (error) {
            console.error("Auto Mode API 호출 에러:", error);
            setStatusMessage("⚠ AUTO 모드 명령 전송 실패");
        }
    };

    // ─────────────────────────────────────────────
    // 3) 수동 모드(저장) 함수
    // ─────────────────────────────────────────────
    const handleManualSave = async () => {
        // manualLevel 이 1~3 사이인지 검증
        if (manualLevel < 1 || manualLevel > 3) {
            setStatusMessage("⚠ 레벨은 1~3 사이여야 합니다.");
            return;
        }
        try {
            // 백엔드: POST /api/motor/manual { level: manualLevel }
            const res = await axios.post("/api/motor/manual", { level: manualLevel });
            setMode("MANUAL");
            setSavedLevel(manualLevel);
            setStatusMessage(res.data); // 예: "MANUAL 모드 및 속도(2) 명령 전송 완료"
        } catch (error) {
            console.error("Manual API 호출 에러:", error);
            setStatusMessage("⚠ 수동 모드 명령 전송 실패");
        }
    };

    return (
        <div className="device_control_detail-container">
            <div className="device_control_detail-container2">
                <div className="update_time">업데이트 시간 : 2025 / 03 / 29</div>
                <br />
                <br />
                {/* 현재 실내 온습도 현황 영역 (예시) */}
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

            <br />

            {/* ────────────────────────────────────────────────────────── */}
            {/* 전원 제어 섹션 */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="device_control_detail-container3">
                <div className="aircon-power-label">공기청정기 전원</div>
                <div className="power-button-group">
                    {/* ON 버튼 */}
                    <button
                        className={`power-button ${powerOn ? "active" : ""}`}
                        onClick={() => handlePowerToggle(true)}
                        disabled={powerOn}
                    >
                        ON
                    </button>
                    {/* OFF 버튼 */}
                    <button
                        className={`power-button ${!powerOn ? "active" : ""}`}
                        onClick={() => handlePowerToggle(false)}
                        disabled={!powerOn}
                    >
                        OFF
                    </button>
                </div>
                <div className="power-state-text">
                    전원 <strong>{powerOn ? "ON" : "OFF"}</strong>
                </div>
            </div>

            <br />

            {/* ────────────────────────────────────────────────────────── */}
            {/* 자동 / 수동 모드 토글 버튼 추가 */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="mode-toggle-group">
                {/* 자동 버튼 */}
                <button
                    className={`mode-toggle-button ${mode === "AUTO" ? "active" : ""}`}
                    onClick={handleAutoMode}
                >
                    자동
                </button>

                {/* 수동 버튼 */}
                <button
                    className={`mode-toggle-button ${mode === "MANUAL" ? "active" : ""}`}
                    onClick={() => {
                        // UI만 먼저 수동 모드로 바꾸고, 실제 백엔드 호출은 '저장' 버튼에서 처리
                        setMode("MANUAL");
                        setStatusMessage("수동 모드 선택됨. 레벨을 조정하고 저장하세요.");
                    }}
                >
                    수동
                </button>
            </div>

            {/* 자동 모드일 경우엔 수동 레벨 UI를 회색 처리(비활성화)하거나 감출 수 있습니다. */}
            {/* ────────────────────────────────────────────────────────── */}
            {/* 수동 모드 및 속도 설정 섹션 */}
            {/* ────────────────────────────────────────────────────────── */}
            <div
                className="device_control_detail-container4"
                style={{
                    opacity: mode === "AUTO" ? 0.5 : 1,
                    pointerEvents: mode === "AUTO" ? "none" : "auto",
                }}
            >
                <div className="aircon-passvity-label">공기청정기 수동설정</div>
                <div className="manual-control-group">
                    {/* 선택된 manualLevel 표시 */}
                    <span className="manual-level">{manualLevel}단</span>

                    {/* ▲ 버튼: manualLevel 증가 (최대 3) */}
                    <button
                        className="manual-button"
                        onClick={() =>
                            setManualLevel((prev) => Math.min(prev + 1, 3))
                        }
                    >
                        ▲
                    </button>

                    {/* ▼ 버튼: manualLevel 감소 (최소 1) */}
                    <button
                        className="manual-button"
                        onClick={() =>
                            setManualLevel((prev) => Math.max(prev - 1, 1))
                        }
                    >
                        ▼
                    </button>

                    {/* 저장(전송) 버튼 */}
                    <button
                        className="manual-save-button"
                        onClick={handleManualSave}
                        disabled={mode !== "MANUAL"}
                    >
                        저장
                    </button>
                </div>
            </div>

            {/* 저장된 단계(savedLevel) 표시 */}
            <div className="saved-level-text">
                현재 설정: <strong>{savedLevel !== null ? savedLevel : "-"}</strong>단
            </div>

            <br />

            {/* ────────────────────────────────────────────────────────── */}
            {/* 상태 메시지 영역 */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="status-message-box">
                {statusMessage && (
                    <p className="status-message-text">{statusMessage}</p>
                )}
            </div>
        </div>
    );
}

export default Device_Control_FirstRoom1;
