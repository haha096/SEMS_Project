import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import '../../../css/page_css/Floor/Monitoring_outdoor_default.css';
import { useNavigate } from "react-router-dom";

function Monitoring_outdoor_default(){
    const navigate = useNavigate();
    const [temperature, setTemperature] = useState("-");
    const [humidity, setHumidity] = useState("-");
    const [weatherStatus, setWeatherStatus] = useState("-");
    const [updateTime, setUpdateTime] = useState("-");
    const [pm10, setPm10] = useState("-");
    const [pm10Grade, setPm10Grade] = useState("-");

    //온도와 습도 가져오기 위한 useEffect
    useEffect(() => {
        fetch("http://107.21.218.155:8080/weather/outdoor?nx=58&ny=125")
            .then(res => res.text())
            .then(data => {
                // 예: "온도: 23.3℃, 습도: 32%"
                const tempMatch = data.match(/온도:\s*([\d.]+)℃/);
                const humiMatch = data.match(/습도:\s*([\d.]+)%/);

                if (tempMatch) setTemperature(tempMatch[1]);
                if (humiMatch) setHumidity(humiMatch[1]);

                const temp = parseFloat(tempMatch?.[1]);
                if (temp >= 30) setWeatherStatus("더움");
                else if (temp >= 20) setWeatherStatus("맑음");
                else setWeatherStatus("쌀쌀함");
            })
            .catch(err => {
                console.error("데이터 로드 실패:", err);
            });
    }, []);

    //업데이트 시간 가져오기 위한 useEffect
    useEffect(() => {
        fetch("http://107.21.218.155:8080/weather/outdoor?nx=58&ny=125")
            .then(res => res.text())
            .then(data => {
                const tempMatch = data.match(/온도:\s*([\d.]+)℃/);
                const humiMatch = data.match(/습도:\s*([\d.]+)%/);

                if (tempMatch) setTemperature(tempMatch[1]);
                if (humiMatch) setHumidity(humiMatch[1]);

                const temp = parseFloat(tempMatch?.[1]);
                if (temp >= 30) setWeatherStatus("더움");
                else if (temp >= 20) setWeatherStatus("맑음");
                else setWeatherStatus("쌀쌀함");

                // 🔽 업데이트 시간 설정 (현재 시각으로)
                const now = new Date();
                const formatted = now.getFullYear() + " / " +
                    String(now.getMonth() + 1).padStart(2, '0') + " / " +
                    String(now.getDate()).padStart(2, '0') + "  " +
                    String(now.getHours()).padStart(2, '0') + ":" +
                    String(now.getMinutes()).padStart(2, '0');
                setUpdateTime(formatted);
            });
    }, []);

    //미세먼지 데이터 옮기기 위한 useEfect
    useEffect(() => {
        fetch("http://107.21.218.155:8080/api/dust")
            .then(res => res.json())
            .then(data => {
                setPm10(data.pm10Value);
                const grade = data.pm10Grade;
                if (grade === "1") setPm10Grade("좋음");
                else if (grade === "2") setPm10Grade("보통");
                else if (grade === "3") setPm10Grade("나쁨");
                else if (grade === "4") setPm10Grade("매우 나쁨");
                else setPm10Grade("정보 없음");
            })
            .catch(err => {
                console.error("미세먼지 정보 불러오기 실패:", err);
            });
    }, []);

    return(
        <div className="detail_outdoor-container">

            <div className="detail_outdoor-container2">
                <div className="update_time">업데이트 시간 : {updateTime}</div>
                <button className="indoor_button"
                        onClick={() => navigate("/monitoring_indoor")}>
                    실내</button>
            </div>

            <div className="status-section">
                <h3>현재 실외 온습도 상황</h3>
                <div className="status-box">
                    <div className="status-item">
                        <span>온도</span>
                        <span>{temperature}℃</span>
                    </div>
                    <div className="status-item">
                        <span>습도</span>
                        <span>{humidity}%</span>
                    </div>
                    <div className="status-item">
                        <span>상태</span>
                        <span>{weatherStatus}</span>
                    </div>
                </div>
            </div>


            <div className="status-section">
                <h3>현재 실외 미세먼지 상황</h3>
                <div className="status-box">
                    <div className="status-item">
                        <span>미세먼지</span>
                        <span>{pm10}㎍/m³</span>
                    </div>
                    <div className="status-item">
                        <span>상태</span>
                        <span>{pm10Grade}</span>
                    </div>
                </div>
            </div>


        </div>
    );
}

export default Monitoring_outdoor_default;