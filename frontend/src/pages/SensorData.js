import React, { useEffect, useState } from 'react';

function SensorData() {
        const [sensorData, setSensorData] = useState([]);

        // 센서 전체 데이터 요청
        useEffect(() => {
            fetch('http://localhost:8080/sensor')  // 백엔드 API 경로
                .then(response => response.json())
                .then(data => {
                console.log("백엔드 응답 구조:", data);  // 여기 확인
                    setSensorData(data);  // 받은 데이터를 상태에 저장
                })
                .catch(error => {
                    console.error("전체 데이터 가져오기 오류:", error);
                });
        }, []);

    // 센서 데이터가 없을 경우 표시할 기본 메시지
    if (sensorData.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div>
                   <h1>Sensor Dashboard</h1>
                   <table>
                       <thead>
                           <tr>
                               <th>Id</th>
                               <th>시간</th>
                               <th>Temperature</th>
                               <th>Humidity</th>
                               <th>Mode</th>
                               <th>Speed</th>
                               <th>PM1.0</th>
                               <th>PM2.5</th>
                               <th>PM10</th>
                               <th>Power Usage</th>
                           </tr>
                       </thead>
                       <tbody>
                            {sensorData.map((data, index) => (
                                <tr key={index}>
                                    <td>{data["id"]}</td>
                                    <td>{data["timestamp"]}</td>
                                    <td>{data["TEMP"]}</td>
                                    <td>{data["HUM"]}</td>
                                    <td>{data["MODE"]}</td>
                                    <td>{data["SPEED"]}</td>
                                    <td>{data["PM1.0"]} µg/m³</td>
                                    <td>{data["PM2.5"]} µg/m³</td>
                                    <td>{data["PM10"]} µg/m³</td>
                                    <td>{data["전력량"]} kWh</td>
                                </tr>
                            ))}
                       </tbody>
                   </table>
               </div>
    );
}

export default SensorData;
