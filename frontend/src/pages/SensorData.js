import React, { useEffect, useState } from 'react';

function SensorData() {
        const [sensorData, setSensorData] = useState([{
          id: 0,
          timestamp: "-",
          CURRENT: 0,
          VOLT: 0,
          TEMP: 0,
          HUM: 0,
          MODE: "-",
          SPEED: 0,
          "POWER":"-",
          "PM1": 0,
          "PM2.5": 0,
          PM10: 0,
          "전력량": 0,
        }]);

        // 센서 전체 데이터 요청
        useEffect(() => {
            fetch('http://localhost:8080/sensor')  // 백엔드 API 경로
                .then(response => response.json())
                .then(data => {
                console.log("백엔드 응답 구조:", data);  // 여기 확인
                  if (data.length === 0) {
                    // 아무것도 하지 않음 -> 초기값 유지
                  } else {
                    setSensorData(data);
                  }
                })
                .catch(error => {
                    console.error("전체 데이터 가져오기 오류:", error);
                });
        }, []);

    // 센서 데이터가 없을 경우 표시할 기본 메시지
//    if (sensorData.length === 0) {
//        return <div>Loading...</div>;
//    }

    return (
        <div>
                   <h1>Sensor Dashboard</h1>
                   <table>
                       <thead>
                           <tr>
                               <th>Id</th>
                               <th>시간</th>
                               <th>Current</th>
                               <th>Volt</th>
                               <th>Temperature</th>
                               <th>Humidity</th>
                               <th>Mode</th>
                               <th>Speed</th>
                               <th>POWER</th>
                               <th>PM1.0</th>
                               <th>PM2.5</th>
                               <th>PM10</th>
                               <th>전력</th>
                               <th>Power Usage</th>
                           </tr>
                       </thead>
                       <tbody>
                            {sensorData.map((data, index) => (
                                <tr key={index}>
                                    <td>{data["id"]}</td>
                                    <td>{data["timestamp"]}</td>
                                    <td>{data["CURRENT"]}</td>
                                    <td>{data["VOLT"]}</td>
                                    <td>{data["TEMP"]}</td>
                                    <td>{data["HUM"]}</td>
                                    <td>{data["MODE"]}</td>
                                    <td>{data["SPEED"]}</td>
                                     <td>{data["POWER"]}</td>
                                    <td>{data["PM1"]} µg/m³</td>
                                    <td>{data["PM2.5"]} µg/m³</td>
                                    <td>{data["PM10"]} µg/m³</td>
                                    <td>{(data["CURRENT"] * data["VOLT"]).toFixed(2)} W</td>
                                    <td>{data["전력량"]} kWh</td>
                                </tr>
                            ))}
                       </tbody>
                   </table>
               </div>
    );
}

export default SensorData;
