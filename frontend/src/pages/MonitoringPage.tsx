import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import FilterBar from "../components/layout/FilterBar";
import Header from "../components/layout/Header";
import MainGridOriginal from "../components/dashboard/MainGrid";
import type { MonitoringData } from "../types/monitoring";
import { fetchMonitoring } from "../api/monitoring";
import type { AxiosError } from "axios";
import { buildScorers, type FacilityType, type SeasonMode } from "@/lib/scoring";
import { useWeather } from "@/contexts/WeatherContext";
import { useLocation, useSearchParams } from "react-router-dom";

const MainGrid = React.memo(
    MainGridOriginal,
    (prev, next) => {
        if (prev.loading !== next.loading) return false;
        if (prev.statusForAll !== next.statusForAll) return false;
        if (prev.deviceStopped !== next.deviceStopped) return false;

        const ag = prev.data?.gauges;
        const bg = next.data?.gauges;
        if (!ag || !bg) return false;

        const sameIndoor =
            ag.pm10 === bg.pm10 &&
            ag.pm25 === bg.pm25 &&
            ag.temp === bg.temp &&
            ag.rh === bg.rh &&
            ag.cici === bg.cici;

        const ao = prev.data?.outdoor;
        const bo = next.data?.outdoor;
        if (!ao || !bo) return false;

        const sameOutdoor =
            ao.windSpeed === bo.windSpeed &&
            ao.windDir === bo.windDir &&
            ao.temp === bo.temp &&
            ao.humidity === bo.humidity &&
            ao.weather === bo.weather;

        return sameIndoor && sameOutdoor;
    }
);

const NOISE = { pct: 0.001, abs: 0.01 };
const STALE_AFTER_MS = 5_000;
const POLL_MS_INDOOR = 5_000;

function buildPlaceholder(station: string): MonitoringData {
    return {
        updatedAt: new Date().toISOString(),
        station,
        deviceId: "",
        location: station,
        outdoor: { district: "", temp: 0, humidity: 0, windSpeed: 0, windDir: "", weather: "" },
        gauges: { pm10: 0, pm25: 0, co2: 0, cici: 0, temp: 0, rh: 0 },
        raw: { pm10: 0, pm25: 0, co2: 0, temp: 0, rh: 0 },
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

// ---- 🔔 거부/권한 안내 배너 (쿼리 유무와 무관하게 sessionStorage 읽음) ----
function DenyBanner() {
    const [sp] = useSearchParams();
    const loc = useLocation();
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        // 쿼리 파라미터가 없어도 sessionStorage에 있으면 출력
        const hasSignal = !!sp.get("denied") || !!sessionStorage.getItem("lastDeniedMsg");
        if (!hasSignal) return;

        const saved = sessionStorage.getItem("lastDeniedMsg");
        if (saved) {
            setMsg(saved);
            // 한 번만 보여주고 정리
            sessionStorage.removeItem("lastDeniedMsg");
            sessionStorage.removeItem("lastDeniedCode");
            sessionStorage.removeItem("lastDeniedId");
        }

        // 해시 라우터/브라우저 모두에서 쿼리지우기 (UX 깔끔하게)
        const base = loc.pathname + loc.search;
        if (base.includes("?")) {
            window.history.replaceState({}, "", loc.pathname);
        }
    }, [sp, loc.pathname]);

    if (!msg) return null;
    return (
        <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {msg}
        </div>
    );
}

export default function MonitoringPage() {
    const [selectedStation, setSelectedStation] = useState<string>("3-201호");
    const [facility, setFacility] = useState<FacilityType>("office");
    const [season, setSeason] = useState<SeasonMode>("neutral");

    const [data, setData] = useState<MonitoringData>(buildPlaceholder("3-201호"));
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

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
            changed(prev.gauges.rh, next.gauges.rh) ||
            changed(prev.gauges.cici, next.gauges.cici);
        const stale = Date.now() - (lastApplyAtRef.current || 0) >= STALE_AFTER_MS;
        return tsChanged || valChanged || stale;
    };

    const scheduleIndoor = () => {
        if (timerIndoor.current) window.clearTimeout(timerIndoor.current);
        if (!document.hidden) timerIndoor.current = window.setTimeout(fetchIndoorOnce, POLL_MS_INDOOR);
        else timerIndoor.current = null;
    };

    const fetchIndoorOnce = async () => {
        if (inFlightIndoor.current) return;
        inFlightIndoor.current = true;
        try {
            if (!didInitialLoad.current) setLoading(true);

            const latest = await fetchMonitoring();
            setError(null);

            const S = buildScorers(facility, season);

            setData((prev) => {
                const pm10s = S.scorePM10(latest.raw.pm10);
                const pm25s = S.scorePM25(latest.raw.pm25);
                const temps = S.scoreTemp(latest.raw.temp);
                const rhs = S.scoreRH(latest.raw.rh);
                const cici = S.scoreCICI(pm25s, pm10s, temps, rhs);

                const candidate: MonitoringData = {
                    ...prev,
                    updatedAt: latest.updatedAt,
                    station: selectedStation,
                    location: selectedStation,
                    gauges: { pm10: pm10s, pm25: pm25s, temp: temps, rh: rhs, cici, co2: 0 },
                    raw: latest.raw,
                    outdoor: weather
                        ? {
                            district: weather.district,
                            temp: weather.temp,
                            humidity: weather.humidity,
                            windSpeed: weather.windSpeed,
                            windDir: weather.windDir,
                            weather: weather.weather,
                        }
                        : prev.outdoor,
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
        fetchIndoorOnce();
        return () => {
            live = false;
            document.removeEventListener("visibilitychange", onVis);
            if (timerIndoor.current) window.clearTimeout(timerIndoor.current);
        };
    }, [selectedStation, facility, season]);

    useEffect(() => {
        if (!weather) return;
        setData((prev) => ({
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

                    {/* 🔔 접근 거부 사유 배너 */}
                    <DenyBanner />

                    <FilterBar
                        station={selectedStation}
                        onStationChange={setSelectedStation}
                        right={
                            <div className="flex flex-wrap items-center gap-3 text-slate-500">
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

                    <MainGrid data={data} statusForAll={error ? "missing" : undefined} deviceStopped={false} loading={loading} />
                </div>
            </div>
        </div>
    );
}
