import React, {useState} from "react";
import { Link } from "react-router-dom";
import '../css/page_css/Floor/FirstRoom1.css';

function FirstRoom1(){
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [chartUrl, setChartUrl] = useState("http://localhost:5000/chart");

    const handleSearch = () => {
        const timestamp = new Date().getTime(); // 현재 시간으로 쿼리 파라미터 생성
        setChartUrl(`http://localhost:5000/chart?ts=${timestamp}`);
    };

    return(
        <div className="first-room-wrapper">
             📅 날짜 선택 영역
            <div className="detail_container1">
                <label>날짜 단위&nbsp;</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                &nbsp;-&nbsp;
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>

            <div className="detail_container2">
                <div className="check-container">
                    {/* 분석 방식 */}
                    <div className="graph-container">
                        <label><input type="radio" name="analysisType" value="graph"/> 그래프 분석</label>
                        <label><input type="radio" name="analysisType" value="table"/> 표 분석</label>
                    </div>

                    {/* 항목 선택 */}
                    <div className="weather-container">
                        <label><input type="radio" name="weatherType" value="temperature"/> 온도</label>
                        <label><input type="radio" name="weatherType" value="humidity"/> 습도</label>
                        <label><input type="radio" name="weatherType" value="dust"/> 미세먼지</label>
                    </div>
                </div>

                <div className="search-button-container">
                    {/* 조회 버튼 */}
                    <button className="search-button">조회</button>
                </div>

            </div>

            <div className="detail_container3">
                <div className="python_graph">
                    <img src={chartUrl} alt="Python Chart" />
                    {/*<img*/}
                    {/*    src={`http://localhost:5000/chart?timestamp=${new Date().getTime()}`}*/}
                    {/*    alt="Python Chart"*/}
                    {/*    style={{ width: '600px', border: '1px solid #ccc' }}*/}
                    {/*/>*/}
                </div>
            </div>
        </div>
    );
}

export default FirstRoom1;