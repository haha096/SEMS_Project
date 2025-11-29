// components/dashboard/Sidebar.tsx
import { useEffect, useRef } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import WeatherCard from "./WeatherCard";
import { Cloud, Monitor, BarChart3, FileText, Lock, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useWeather } from "@/contexts/WeatherContext";
import { fetchWeather } from "@/api/weather";

const POLL_MS_WEATHER = 300_000; // 5분

export default function Sidebar() {
    const { weather, setWeather, district } = useWeather();
    const timerRef = useRef<number | null>(null);
    const loc = useLocation();

    const schedule = () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        if (!document.hidden) {
            timerRef.current = window.setTimeout(loadOnce, POLL_MS_WEATHER);
        } else {
            timerRef.current = null;
        }
    };

    const loadOnce = async () => {
        try {
            const w = await fetchWeather();
            setWeather(w);
        } catch (e) {
            // 콘솔 정도만
            console.warn("Weather fetch failed:", e);
        } finally {
            schedule();
        }
    };

    useEffect(() => {
        const onVis = () => {
            if (document.hidden) {
                if (timerRef.current) window.clearTimeout(timerRef.current);
                timerRef.current = null;
            } else {
                loadOnce();
            }
        };
        document.addEventListener("visibilitychange", onVis);
        // 진입/경로 변경 시도 즉시 1회
        loadOnce();

        return () => {
            document.removeEventListener("visibilitychange", onVis);
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
        // district 바뀌거나 라우트 바뀔 때 새로고침
    }, [district, loc.pathname]);

    // WeatherCard가 기대하는 데이터 형태로 매핑
    const cardData = weather
        ? {
            location: weather.district || "—",
            condition: weather.weather || "—",
            temperature: Number.isFinite(weather.temp) ? `${weather.temp.toFixed(1)}℃` : "—",
            humidity: Number.isFinite(weather.humidity) ? `${weather.humidity}%` : "—",
            rainfall: "-mm", // 백엔드에서 주면 연결
            windSpeed: Number.isFinite(weather.windSpeed) ? `${weather.windSpeed}m/s` : "—",
            windDir: weather.windDir || "—",
        }
        : {
            location: "—",
            condition: "—",
            temperature: "—",
            humidity: "—",
            rainfall: "—",
            windSpeed: "—",
            windDir: "—",
        };

    return (
        <aside className="w-64 h-screen bg-[#337CCF] text-white flex flex-col">
            {/* 로고 */}
            <div className="p-4 flex items-center gap-2 text-white font-bold text-lg">
                <Cloud className="w-5 h-5" /> SEMS
            </div>

            {/* 네비게이션 */}
            <nav className="px-3 space-y-2 text-[15px] font-medium">
                <Link
                    to="/monitoring"
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#3F8DF0] hover:bg-[#2C6FC8] transition rounded-md shadow-sm"
                >
          <span className="flex items-center gap-2">
            <Monitor size={18} /> 모니터링
          </span>
                    <span className="text-white/90">›</span>
                </Link>

                <Link
                    to="/analysis"
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#3F8DF0] hover:bg-[#2C6FC8] transition rounded-md shadow-sm"
                >
          <span className="flex items-center gap-2">
            <BarChart3 size={18} /> 분석
          </span>
                    <span className="text-white/90">›</span>
                </Link>

                <button className="w-full flex items-center justify-between px-4 py-3 bg-[#3F8DF0] hover:bg-[#2C6FC8] transition rounded-md shadow-sm">
          <span className="flex items-center gap-2">
            <FileText size={18} /> 보고서
          </span>
                    <span className="text-white/90">›</span>
                </button>

                {/* 관리자 문의하기 (라우팅/권한은 다음 단계에서 적용) */}
                <Link
                    to="/inquiry"
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#3F8DF0] hover:bg-[#2C6FC8] transition rounded-md shadow-sm"
                >
                    <span className="flex items-center gap-2">
                      <MessageSquare size={18} /> 관리자에게 문의하기
                    </span>
                    <span className="text-white/90">›</span>
                </Link>


                <Accordion type="single" collapsible className="text-white">
                    <AccordionItem value="control" className="border-none">
                        <AccordionTrigger
                            className="px-4 py-3 bg-[#3F8DF0] hover:bg-[#2C6FC8] transition rounded-md shadow-sm flex items-center justify-between"
                        >
              <span className="flex items-center gap-2">
                <Lock size={18} /> 공기 가전 제어
              </span>
                        </AccordionTrigger>
                        <AccordionContent className="mt-1 rounded-md bg-white text-[#337CCF] px-5 py-2">
                            <ul className="list-disc list-inside text-[14px]">
                                <li className="py-1">
                                    <Link to="/control" className="hover:underline">
                                        환기청정기 제어
                                    </Link>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </nav>

            {/* 하단 날씨 카드 */}
            <div className="flex-1" />
            <WeatherCard data={cardData} />
        </aside>
    );
}
