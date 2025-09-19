import React, { useEffect, useMemo, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    ReferenceLine
} from "recharts";
import "../../../css/page_css/ForecastGraph_FirstRoom1.css"; // 새 CSS


const metricToApi = {
    temperature: "temp",
    humidity: "hum",
};

const metricLabel = {
    temperature: "온도(°C)",
    humidity: "습도(%)",
};

function useForecastData(startDate, metric) {
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!startDate) return;
        const controller = new AbortController();
        const apiMetric = metricToApi[metric] || "temp";
        const d = startDate;

        setLoading(true);
        setError("");

        fetch(`http://localhost:8001/forecast/curve?metric=${apiMetric}&date=${d}`, {
            signal: controller.signal,
        })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => setPayload(json))
            .catch((e) => {
                if (e.name !== "AbortError") setError("데이터를 불러오지 못했습니다.");
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [startDate, metric]);

    return { payload, loading, error };
}

function mergeSeries(payload) {
    if (!payload) return [];
    const map = new Map();

    const attach = (arr, key) => {
        (arr || []).forEach((row) => {
            const ts = row.ts; // "YYYY-MM-DD HH:mm:ss"
            if (!map.has(ts)) map.set(ts, { ts });
            map.get(ts)[key] = row[key];
        });
    };

    attach(payload.past_indoor, "indoor");
    attach(payload.past_outdoor, "outdoor");
    (payload.forecast || []).forEach((p) => {
        if (!map.has(p.ts)) map.set(p.ts, { ts: p.ts });
        map.get(p.ts).forecast = p.forecast;
        map.get(p.ts).alert = p.alert;
    });

    // 정렬
    return Array.from(map.values()).sort(
        (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );
}

function ForecastGraph_FirstRoom1() {
    // 날짜/옵션 상태
    const [startDate, setStartDate] = useState(
        () => new Date().toISOString().slice(0, 10)
    );
    const [viewMode, setViewMode] = useState("chart"); // chart | table
    const [metric, setMetric] = useState("temperature"); // temperature | humidity

    const { payload, loading, error } = useForecastData(startDate, metric);
    const data = useMemo(() => mergeSeries(payload), [payload]);

    // now 기준선 (서버 JSON의 ts 포맷에 맞춤)
    const nowTs = useMemo(() => {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
            d.getHours()
        )}:${pad(d.getMinutes())}:${pad(0)}`;
    }, [payload]); // payload 바뀔 때마다 재계산(대략)

    return (
        <div className="forecast-root">
            <div className="forecast-layout">
                {/* ===== 좌측: 세로 조건 패널 ===== */}
                <aside className="forecast-aside">
                    <h4 className="forecast-aside-title">📅 날짜 선택</h4>

                    <label className="forecast-label-block">날짜</label>
                    <input
                        type="date"
                        className="forecast-input w-full"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />

                    <div className="forecast-box">
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
                                표
                            </label>
                        </div>

                        {/* 데이터 그래프(지표) */}
                        <div className="forecast-group">
                            <div className="forecast-group-title">지표</div>
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
                        </div>
                    </div>
                </aside>

                {/* ===== 우측: 그래프/표 ===== */}
                <main className="forecast-main">
                    <div className="forecast-card">
                        {viewMode === "chart" ? (
                            <>
                                {loading && <div className="forecast-loader">로딩중...</div>}
                                {error && <div className="forecast-error">{error}</div>}
                                {!loading && !error && (
                                    <ResponsiveContainer width="100%" height={360}>
                                        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                                            <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Legend />

                                            {/* now 기준선 */}
                                            <ReferenceLine
                                                x={nowTs}
                                                stroke="#9ca3af"
                                                strokeDasharray="3 3"
                                                ifOverflow="extendDomain"
                                            />

                                            {/* 과거 실내/실외: 점선 */}
                                            <Line
                                                type="monotone"
                                                dataKey="indoor"
                                                name="실내(과거)"
                                                stroke="#1f77b4"
                                                strokeDasharray="4 4"
                                                strokeWidth={2}
                                                dot={false}
                                                isAnimationActive={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="outdoor"
                                                name="실외(과거)"
                                                stroke="#2ca02c"
                                                strokeDasharray="4 4"
                                                strokeWidth={2}
                                                dot={false}
                                                isAnimationActive={false}
                                            />

                                            {/* 예측: 실선 + 경고 점 */}
                                            <Line
                                                type="monotone"
                                                dataKey="forecast"
                                                name={`예측(${metricLabel[metric]})`}
                                                stroke="#ff7f0e"
                                                strokeWidth={3}
                                                isAnimationActive={false}
                                                dot={({ cx, cy, payload }) =>
                                                    payload.alert ? (
                                                        <circle cx={cx} cy={cy} r={5} fill="red" />
                                                    ) : null
                                                }
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}

                                <div className="forecast-legend">
                                    <span className="chip chip-blue">실내(과거) · 점선</span>
                                    <span className="chip chip-green">실외(과거) · 점선</span>
                                    <span className="chip chip-orange">예측(미래) · 실선</span>
                                    <span className="chip chip-red">경고 지점</span>
                                </div>
                            </>
                        ) : (
                            // 표 모드 (같은 payload 재사용)
                            <div className="forecast-table-wrap">
                                {loading && <div className="forecast-loader">로딩중...</div>}
                                {error && <div className="forecast-error">{error}</div>}
                                {!loading && !error && (
                                    <table className="forecast-table">
                                        <thead>
                                        <tr>
                                            <th>시간</th>
                                            <th>실내</th>
                                            <th>실외</th>
                                            <th>예측</th>
                                            <th>알림</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.map((r, i) => (
                                            <tr key={i}>
                                                <td>{r.ts}</td>
                                                <td>{r.indoor ?? "-"}</td>
                                                <td>{r.outdoor ?? "-"}</td>
                                                <td>{r.forecast ?? "-"}</td>
                                                <td>{r.alert ? "⚠️" : ""}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ForecastGraph_FirstRoom1;