// frontend/src/pages/MonitorPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MonitorPage = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchSensorData = async () => {
            try {
                const response = await axios.get('/api/sensor/latest'); // 백엔드에서 구현 예정
                setData(response.data);
            } catch (error) {
                console.error('센서 데이터 불러오기 실패:', error);
            }
        };

        const interval = setInterval(fetchSensorData, 2000); // 2초마다 요청
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">실시간 환경 모니터링</h1>
            {data ? (
                <div className="space-y-2">
                    <div>🌡️ 온도: {data.TEMP} °C</div>
                    <div>💧 습도: {data.HUM} %</div>
                    <div>🌫️ PM1.0: {data['PM1.0']} µg/m³</div>
                    <div>🌫️ PM2.5: {data['PM2.5']} µg/m³</div>
                    <div>🌫️ PM10: {data['PM10']} µg/m³</div>
                    <div>⚙️ 모터 모드: {data.MODE}</div>
                    <div>🔁 모터 속도: {data.SPEED}</div>
                </div>
            ) : (
                <div>📡 센서 데이터 수신 중...</div>
            )}
        </div>
    );
};

export default MonitorPage;
