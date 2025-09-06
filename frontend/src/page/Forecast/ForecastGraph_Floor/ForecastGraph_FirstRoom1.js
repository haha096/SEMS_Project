import React, { useState, useEffect } from "react";
import "../../../css/page_css/ForecastGraph_FirstRoom1.css"; // 새 CSS

function ForecastGraph_FirstRoom1() {
    // 날짜(페이지 특성상 일자 선택은 유지하되, 최근 과거 시간도 추가)
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // 조건
    const [minutes, setMinutes] = useState(30);               // 15 | 30 | 60
    const [viewMode, setViewMode] = useState("chart");       // chart | table
    const [metric, setMetric] = useState("temperature");     // temperature | humidity | dust

    // 데이터 소스 (기존 파이썬 서버)
    const [chartUrl, setChartUrl] = useState("http://localhost:5000/chart");
    const [tableData, setTableData] = useState([]);

    // 슬라이드: 0 = 분석(기존), 1 = 전력 예측(자리)
    const [page, setPage] = useState(0);

    const metricMap = {
        temperature: "avg_temperature",
        humidity: "avg_humidity",
        dust: "avg_dust",
    };

    // 오늘 날짜 기본
    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        setStartDate(today);
        setEndDate(today);
    }, []);

    // 조회 실행
    const handleSearch = () => {
        if (!startDate) {
            alert("날짜를 선택하세요.");
            return;
        }
        const baseUrl = `http://localhost:5000/${viewMode === "chart" ? "chart" : "table"}`;
        const finalEndDate = endDate || startDate;
        // minutes 조건을 백엔드가 쓰도록 같이 전달(백엔드가 무시해도 무방)
        const query = `?start=${startDate}&end=${finalEndDate}&type=${metric}&minutes=${minutes}`;

        if (viewMode === "chart") {
            setChartUrl(baseUrl + query);
        } else {
            fetch(baseUrl + query)
                .then((res) => res.json())
                .then((data) => setTableData(data))
                .catch(() => setTableData([]));
        }
    };

    // 조건이 바뀌면 자동 조회
    useEffect(() => {
        if (startDate && endDate) handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, minutes, viewMode, metric]);

    // 슬라이드 이동
    const nextPage = () => setPage((p) => Math.min(p + 1, 1));
    const prevPage = () => setPage((p) => Math.max(p - 1, 0));

    return (
        <div className="forecast-root">
            <div className="forecast-layout">
                {/* ===== 좌측: 세로 조건 패널 ===== */}
                <aside className="forecast-aside">
                    <h4 className="forecast-aside-title">📅 날짜 선택 영역</h4>

                    <label className="forecast-label-block">날짜 단위</label>
                    <input
                        type="date"
                        className="forecast-input w-full"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />

                    <div className="forecast-box">
                        {/* 최근 과거 시간 */}
                        <div className="forecast-group">
                            <div className="forecast-group-title">최근 과거 시간</div>
                            <label className="forecast-radio">
                                <input
                                    type="radio"
                                    name="minutes"
                                    value={15}
                                    checked={minutes === 15}
                                    onChange={() => setMinutes(15)}
                                />
                                15분
                            </label>
                            <label className="forecast-radio">
                                <input
                                    type="radio"
                                    name="minutes"
                                    value={30}
                                    checked={minutes === 30}
                                    onChange={() => setMinutes(30)}
                                />
                                30분
                            </label>
                            <label className="forecast-radio">
                                <input
                                    type="radio"
                                    name="minutes"
                                    value={60}
                                    checked={minutes === 60}
                                    onChange={() => setMinutes(60)}
                                />
                                60분
                            </label>
                        </div>

                        {/* 분석방식 */}
                        <div className="forecast-group">
                            <div className="forecast-group-title">분석방식</div>
                            <label className="forecast-radio">
                                <input
                                    type="radio"
                                    name="analysisType"
                                    value="chart"
                                    checked={viewMode === "chart"}
                                    onChange={() => setViewMode("chart")}
                                />
                                그래프
                            </label>
                            <label className="forecast-radio">
                                <input
                                    type="radio"
                                    name="analysisType"
                                    value="table"
                                    checked={viewMode === "table"}
                                    onChange={() => setViewMode("table")}
                                />
                                표 분석
                            </label>
                        </div>

                        {/* 데이터 그래프(지표) */}
                        <div className="forecast-group">
                            <div className="forecast-group-title">데이터 그래프</div>
                            <label className="forecast-radio">
                                <input
                                    type="radio"
                                    name="metric"
                                    value="temperature"
                                    checked={metric === "temperature"}
                                    onChange={(e) => setMetric(e.target.value)}
                                />
                                온도
                            </label>
                            <label className="forecast-radio">
                                <input
                                    type="radio"
                                    name="metric"
                                    value="humidity"
                                    checked={metric === "humidity"}
                                    onChange={(e) => setMetric(e.target.value)}
                                />
                                습도
                            </label>
                            <label className="forecast-radio">
                                <input
                                    type="radio"
                                    name="metric"
                                    value="dust"
                                    checked={metric === "dust"}
                                    onChange={(e) => setMetric(e.target.value)}
                                />
                                미세먼지
                            </label>
                        </div>
                    </div>
                </aside>

                {/* ===== 우측: 슬라이드 그래프 ===== */}
                <main className="forecast-main">
                    {/* 우측 상단 화살표 스위치 */}
                    <div className="forecast-switchbar">
                        {page > 0 && (
                            <button className="forecast-arrow left" onClick={prevPage} aria-label="분석 슬라이드로 이동">
                                ◀
                            </button>
                        )}
                        {page < 1 && (
                            <button className="forecast-arrow right" onClick={nextPage} aria-label="전력 예측 슬라이드로 이동">
                                ▶
                            </button>
                        )}
                    </div>

                    <div className="forecast-slider">
                        <div
                            className="forecast-slider-inner"
                            style={{ transform: `translateX(-${page * 100}%)` }}
                        >
                            {/* 슬라이드 1: 기존 분석(그래프/표) */}
                            <div className="forecast-slide">
                                <div className="forecast-card">
                                    {viewMode === "chart" ? (
                                        <img className="forecast-chart-img" src={chartUrl} alt="Python Chart" />
                                    ) : (
                                        <div className="forecast-table-wrap">
                                            <table className="forecast-table">
                                                <thead>
                                                <tr>
                                                    <th>시간</th>
                                                    <th>{metric}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {tableData.map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td>{row.timestamp}</td>
                                                        <td>{row[metricMap[metric]]}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 슬라이드 2: 전력 예측(자리) */}
                            <div className="forecast-slide">
                                <div className="forecast-placeholder">
                                    <div className="forecast-placeholder-title">예상 전력 사용량</div>
                                    <div className="forecast-placeholder-desc">
                                        전력 예측 API 연결 후 이 영역에 그래프가 표시됩니다.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ForecastGraph_FirstRoom1;