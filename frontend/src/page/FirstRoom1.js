import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import '../css/page_css/Floor/FirstRoom1.css';

function FirstRoom1(){
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [type, setType] = useState('temperature'); //온도를 선택하면
    // 온도 그래프를 보이게하도록 설계

    const [viewMode, setViewMode] = useState('chart');
    const [chartUrl, setChartUrl] = useState("http://107.21.218.155:5000/chart");
    //표 렌더링 컴포넌트
    const [tableData, setTableData] = useState([]);

    const typeMap = {
        temperature: "avg_temperature",
        humidity: "avg_humidity",
        dust: "avg_dust"
    };

    const handleSearch = () => {
        if (!startDate) {
            alert("날짜를 선택하세요.");
            return;
        }

        const baseUrl = `http://107.21.218.155:5000/${viewMode === 'chart' ? 'chart' : 'table'}`;
        const finalEndDate = endDate || startDate;
        const query = `?start=${startDate}&end=${finalEndDate}&type=${type}`;

        if (viewMode === 'chart') {
            setChartUrl(baseUrl + query);
        } else {
            fetch(baseUrl + query)
                .then((res) => res.json())
                .then((data) => setTableData(data));
        }
    };

    //처음에 들어가면 바로 데이터 시각화 그래프가 보일 수 있도록
    // 오늘 날짜 기본 설정
    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        setStartDate(today);
        setEndDate(today);
    }, []);

// 날짜가 설정되면 자동 조회 실행
    useEffect(() => {
        if (startDate && endDate) {
            handleSearch();
        }
    }, [startDate, endDate, type, viewMode]);



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


            </div>

            <div className="detail_container2">
                <div className="check-container">
                    {/* 분석 방식 */}
                    <div className="graph-container">
                        <label><input type="radio" name="analysisType" value="graph"
                                      checked={viewMode === 'chart'} onChange={() => setViewMode('chart')}/>
                            그래프 분석</label>

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