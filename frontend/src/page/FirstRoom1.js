import React, {useState} from "react";
import { Link } from "react-router-dom";
import '../css/page_css/Floor/FirstRoom1.css';

function FirstRoom1(){
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [type, setType] = useState('temperature'); //온도를 선택하면
                                                                     // 온도 그래프를 보이게하도록 설계

    const [viewMode, setViewMode] = useState('chart');
    const [chartUrl, setChartUrl] = useState("http://localhost:5000/chart");
    //표 렌더링 컴포넌트
    const [tableData, setTableData] = useState([]);

    const handleSearch = () => {
        if (!startDate || !endDate) {
            alert("날짜를 선택하세요.");
            return;
        }

        if (viewMode === 'chart') {
            const url = `http://localhost:5000/chart?start=${startDate}&end=${endDate}&type=${type}`;
            setChartUrl(url);
        } else {
            fetch(`http://localhost:5000/table?start=${startDate}&end=${endDate}&type=${type}`)
                .then((res) => res.json())
                .then((data) => setTableData(data));
        }
    };


    const typeMap = {
        temperature: "temp",
        humidity: "hum",
        dust: "pm2_5"
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
                        <label><input type="radio" name="analysisType" value="graph"
                                      checked={viewMode === 'chart'} onChange={() => setViewMode('chart')}/>
                            그래프 분석</label>
                        <label><input type="radio" name="analysisType" value="table"
                                      checked={viewMode === 'table'} onChange={() => setViewMode('table')}/>
                            표 분석</label>
                    </div>

                    {/* 항목 선택 */}
                    <div className="weather-container">
                        <label><input type="radio" name="weatherType" value="temperature"
                                      checked={type === 'temperature'} onChange={(e) => setType(e.target.value)}/>
                            온도</label>
                        <label><input type="radio" name="weatherType" value="humidity"
                                      checked={type === 'humidity'} onChange={(e) => setType(e.target.value)}/>
                            습도</label>
                        <label><input type="radio" name="weatherType" value="dust"
                                      checked={type === 'dust'} onChange={(e) => setType(e.target.value)}/>
                            미세먼지</label>
                    </div>
                </div>

                <div className="search-button-container">
                    {/* 조회 버튼 */}
                    <button className="search-button" onClick={handleSearch}>조회</button>
                </div>

            </div>

            {/*<div className="detail_container3">*/}
            {/*    <div className="python_graph">*/}
            {/*        <img src={chartUrl} alt="Python Chart" />*/}
            {/*        /!*<img*!/*/}
            {/*        /!*    src={`http://localhost:5000/chart?timestamp=${new Date().getTime()}`}*!/*/}
            {/*        /!*    alt="Python Chart"*!/*/}
            {/*        /!*    style={{ width: '600px', border: '1px solid #ccc' }}*!/*/}
            {/*        /!*//*/}
            {/*    </div>*/}
            {/*</div>*/}

            <div className="detail_container3">
                <div className="python_graph">

                    {viewMode === 'chart' ? (
                        <img src={chartUrl} alt="Python Chart" />
                    ) : (
                        <table>
                            <thead>
                            <tr>
                                <th>시간</th>
                                <th>{type}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tableData.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{row.timestamp}</td>
                                    <td>{row[typeMap[type]]}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>


        </div>
    );
}

export default FirstRoom1;