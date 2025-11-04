import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import FilterBar from "../components/layout/FilterBar";
import Header from "../components/layout/Header";
import MainGridOriginal from "../components/dashboard/MainGrid";
import type { MonitoringData } from "../types/monitoring";
import { fetchMonitoring } from "../api/monitoring";
import type { AxiosError } from "axios";
import {
    buildScorers, type FacilityType, type SeasonMode,
} from "@/lib/scoring";
import { useWeather } from "@/contexts/WeatherContext";

// MainGrid는 값 변화시에만 렌더하도록 메모이제이션
const MainGrid = React.memo(
    MainGridOriginal,
    (prev, next) => {
        // 1) 기본 플래그가 바뀌면 즉시 리렌더
        if (prev.loading !== next.loading) return false;
        if (prev.statusForAll !== next.statusForAll) return false;
        if (prev.deviceStopped !== next.deviceStopped) return false;

        // 2) 실내 gauges 비교 (없으면 렌더 허용)
        const ag = prev.data?.gauges;
        const bg = next.data?.gauges;
        if (!ag || !bg) return false;

        const sameIndoor =
            ag.pm10 === bg.pm10 &&
            ag.pm25 === bg.pm25 &&
            ag.temp === bg.temp &&
            ag.rh   === bg.rh   &&
            ag.cici === bg.cici;

        // 3) ✅ 실외(outdoor) 비교 추가 (없으면 렌더 허용)
        const ao = prev.data?.outdoor;
        const bo = next.data?.outdoor;
        if (!ao || !bo) return false;

        const sameOutdoor =
            ao.windSpeed === bo.windSpeed &&
            ao.windDir   === bo.windDir   &&
            ao.temp      === bo.temp      &&
            ao.humidity  === bo.humidity  &&
            ao.weather   === bo.weather;

        // 4) 실내&실외가 모두 동일할 때만 재렌더를 생략한다.
        return sameIndoor && sameOutdoor;
    }
);

// 민감도/최소주기/폴링주기(실내만)
const NOISE = { pct: 0.001, abs: 0.01 };
const STALE_AFTER_MS = 5_000;
const POLL_MS_INDOOR = 5_000;

// 실패/오프라인 기본값
function buildPlaceholder(station: string): MonitoringData {
    return {
        updatedAt: new Date().toISOString(),
        station,
        deviceId: "",
        location: station,
        outdoor: { district: "", temp: 0, humidity: 0, windSpeed: 0, windDir: "", weather: "" },
        gauges:  { pm10: 0, pm25: 0, co2: 0, cici: 0, temp: 0, rh: 0 },
        raw:     { pm10: 0, pm25: 0, co2: 0, temp: 0, rh: 0 },
    };
}

function changed(prev: number, next: number, { pct, abs } = NOISE): boolean {
    if (!isFinite(prev) || !isFinite(next)) return true;
    const diffAbs = Math.abs(next - prev);
    if (diffAbs >= abs) return true;
    const base = Math.max(Math.abs(prev), 1e-6);
    const diffPct = diffAbs / base;
    return diffPct >= pct;
}

export default function MonitoringPage() {
    const [selectedStation, setSelectedStation] = useState<string>("3-201호");
    const [facility, setFacility] = useState<FacilityType>("office");
    const [season, setSeason]     = useState<SeasonMode>("neutral");

    const [data, setData] = useState<MonitoringData>(buildPlaceholder("3-201호"));
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // 날씨는 전역 컨텍스트에서 구독 (Sidebar가 폴링해서 올려줌)
    const { weather } = useWeather();

    const inFlightIndoor = useRef(false);
    const lastApplyAtRef = useRef<number>(0);
    const timerIndoor = useRef<number | null>(null);
    const didInitialLoad = useRef(false);

    const needUpdate = (prev: MonitoringData, next: MonitoringData): boolean => {
        const tsChanged = (prev.updatedAt ?? "") !== (next.updatedAt ?? "");
        const valChanged =
            changed(prev.gauges.pm10, next.gauges.pm10) ||
            changed(prev.gauges.pm25, next.gauges.pm25) ||
            changed(prev.gauges.temp, next.gauges.temp) ||
            changed(prev.gauges.rh,   next.gauges.rh)   ||
            changed(prev.gauges.cici, next.gauges.cici);
        const stale = Date.now() - (lastApplyAtRef.current || 0) >= STALE_AFTER_MS;
        return tsChanged || valChanged || stale;
    };

    const scheduleIndoor = () => {
        if (timerIndoor.current) window.clearTimeout(timerIndoor.current);
        if (!document.hidden) timerIndoor.current = window.setTimeout(fetchIndoorOnce, POLL_MS_INDOOR);
        else timerIndoor.current = null;
    };

    // 실내(센서) 1회
    const fetchIndoorOnce = async () => {
        if (inFlightIndoor.current) return;
        inFlightIndoor.current = true;
        try {
            if (!didInitialLoad.current) setLoading(true);

            const latest = await fetchMonitoring(); // raw 포함
            setError(null);

            const S = buildScorers(facility, season);

            setData((prev) => {
                const pm10s = S.scorePM10(latest.raw.pm10);
                const pm25s = S.scorePM25(latest.raw.pm25);
                const temps = S.scoreTemp(latest.raw.temp);
                const rhs   = S.scoreRH(latest.raw.rh);
                const cici  = S.scoreCICI(pm25s, pm10s, temps, rhs);

                // 화면 데이터 후보
                const candidate: MonitoringData = {
                    ...prev,
                    updatedAt: latest.updatedAt,
                    station: selectedStation,
                    location: selectedStation,
                    gauges: { pm10: pm10s, pm25: pm25s, temp: temps, rh: rhs, cici, co2: 0 },
                    raw: latest.raw,
                    // ✅ 실외는 컨텍스트(weather) 값으로 병합 (Sidebar가 업데이트하면 자동 반영)
                    outdoor: weather ? {
                        district: weather.district,
                        temp: weather.temp,
                        humidity: weather.humidity,
                        windSpeed: weather.windSpeed,
                        windDir: weather.windDir,
                        weather: weather.weather,
                    } : prev.outdoor,
                };

                if (needUpdate(prev, candidate)) {
                    lastApplyAtRef.current = Date.now();
                    return candidate;
                }
                return prev;
            });
        } catch (e: unknown) {
            const err = e as AxiosError<{ message?: string }>;
            setError(err.response?.data?.message ?? err.message ?? "센서 데이터 수신 실패");
        } finally {
            if (!didInitialLoad.current) {
                didInitialLoad.current = true;
                setLoading(false);
            }
            inFlightIndoor.current = false;
            scheduleIndoor();
        }
    };

    // 초기/변경 트리거
    useEffect(() => {
        let live = true;
        const onVis = () => {
            if (!live) return;
            if (document.hidden) {
                if (timerIndoor.current) window.clearTimeout(timerIndoor.current);
                timerIndoor.current = null;
            } else {
                fetchIndoorOnce();
            }
        };
        document.addEventListener("visibilitychange", onVis);

        fetchIndoorOnce(); // 진입 시 1회 + 폴링 시작

        return () => {
            live = false;
            document.removeEventListener("visibilitychange", onVis);
            if (timerIndoor.current) window.clearTimeout(timerIndoor.current);
        };
    }, [selectedStation, facility, season]);

    // 날씨 컨텍스트가 갱신될 때, 실외 블록만 즉시 반영 (실내 폴링 주기와 무관)
    useEffect(() => {
        if (!weather) return;
        setData(prev => ({
            ...prev,
            outdoor: {
                district: weather.district,
                temp: weather.temp,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed,
                windDir: weather.windDir,
                weather: weather.weather,
            },
        }));
    }, [weather]);

    const manualRefresh = () => {
        if (timerIndoor.current) window.clearTimeout(timerIndoor.current);
        fetchIndoorOnce();
    };

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 min-w-0">
                    <Header left="모니터링" center="실내·실외 공기질 현황" user="kw3@korea.kr" />

                    <FilterBar
                        station={selectedStation}
                        onStationChange={setSelectedStation}
                        right={
                            <div className="flex flex-wrap items-center gap-3 text-slate-500">
                                {/* 시설/계절 선택 UI */}
                                <label className="text-xs">시설</label>
                                <select
                                    value={facility}
                                    onChange={(e) => setFacility(e.target.value as FacilityType)}
                                    className="rounded border px-2 py-1 text-xs"
                                >
                                    <option value="school">학교</option>
                                    <option value="hospital">병원</option>
                                    <option value="office">사무실</option>
                                    <option value="home">집</option>
                                </select>
                                <label className="text-xs">계절</label>
                                <select
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value as SeasonMode)}
                                    className="rounded border px-2 py-1 text-xs"
                                >
                                    <option value="neutral">중간기</option>
                                    <option value="summer">여름</option>
                                    <option value="winter">겨울</option>
                                </select>

                                <span className="ml-2">
                  <b className="text-sky-600">1</b> 개의 기기가 등록되어 있습니다.
                </span>
                                <button onClick={manualRefresh} className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">
                                    새로고침
                                </button>
                            </div>
                        }
                    />

                    {error && (
                        <div className="mx-4 mt-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                            ⚠️ 센서 데이터 수신 불가: {error} (자동 5초 간격 재시도)
                        </div>
                    )}

                    <MainGrid
                        data={data}
                        statusForAll={error ? "missing" : undefined}
                        deviceStopped={false}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
}
