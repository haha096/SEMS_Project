// src/pages/ControlPage.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/layout/Header";
import FilterBar from "@/components/layout/FilterBar";
import PanelCard from "@/components/dashboard/PanelCard";
import { Card, CardContent } from "@/components/ui/card";
import type { PanelData } from "@/types/ui";
import { ControlPanelKW } from "@/components/control/ControlPanel";
import { setPower } from "@/services/deviceApi";

/* ===== BASE URLs =====
   - 스프링은 기존 프록시(/api -> 8080)와도 잘 동작하므로 빈 문자열 경로도 안전.
   - Flask는 상대경로로 두면 5173으로 붙어 404가 나니, 반드시 절대주소로 고정한다. */
const SPRING =
    (import.meta as any).env?.VITE_SPRING_BASE ?? "";

const FLASK: string =
    (import.meta as any).env?.VITE_FLASK_BASE ?? "http://localhost:5000";

/* ===== Types ===== */
type UIMode = "auto" | "manual" | "ai";
type FanLevel = 0 | 1 | 2 | 3;
type AutoAction = {
    mode: "AUTO";
    fan: FanLevel;
    duration_min: number;
    until: string; // ISO
    reason: string;
    ts: string;
    by: string;
};

const asNum = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
const round = (v: number | null | undefined, d = 0) =>
    v == null ? null : Number(Number(v).toFixed(d));

async function safeJson(res: Response): Promise<any> {
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    if (ct.includes("application/json")) {
        try {
            return JSON.parse(text);
        } catch {
            return {};
        }
    }
    return {};
}

/* ===== Spring control APIs (기존 기능 유지) ===== */
async function enterAuto() {
    const r = await fetch(`${SPRING}/api/motor/auto`, {
        method: "GET",
        credentials: "include",
    });
    if (!r.ok) throw new Error(await r.text());
}
async function enterManual(level: 1 | 2 | 3 = 1) {
    const r = await fetch(`${SPRING}/api/motor/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ level }),
    });
    if (!r.ok) throw new Error(await r.text());
}

export default function ControlPage() {
    /* ===== 상단 선택 (기존) ===== */
    const [station, setStation] = useState("3-201호");
    const [device, setDevice] = useState("환기청정기");

    /* ===== 전원/모드 (기존) ===== */
    const [powerOn, setPowerOn] = useState(true);
    const [mode, setMode] = useState<UIMode>("auto"); // "ai" 포함

    /* ===== 실내/실외 데이터 (기존) ===== */
    const [inPM25, setInPM25] = useState<number | null>(null);
    const [inPM10, setInPM10] = useState<number | null>(null);
    const [inTemp, setInTemp] = useState<number | null>(null);
    const [inRH, setInRH] = useState<number | null>(null);

    const [outPM25, setOutPM25] = useState<number | null>(null);
    const [outPM10, setOutPM10] = useState<number | null>(null);
    const [outTemp, setOutTemp] = useState<number | null>(null);
    const [outRH, setOutRH] = useState<number | null>(null);

    const timestamp = useMemo(
        () => new Date().toISOString().slice(0, 16).replace("T", " "),
        []
    );

    /* ===== 전원/모드 핸들러 (기존) ===== */
    const onTogglePower = useCallback(
        async (next: boolean) => {
            const prev = powerOn;
            setPowerOn(next);
            try {
                await setPower(next);
            } catch {
                setPowerOn(prev);
                alert("전원 제어 실패");
            }
        },
        [powerOn]
    );

    // ⚠️ 핵심: "ai" 모드일 땐 Spring 호출을 금지
    const onChangeMode = useCallback(
        async (nextRaw: string) => {
            const next = (["manual", "ai"].includes(nextRaw) ? nextRaw : "auto") as UIMode;
            const prev = mode;
            setMode(next);
            try {
                if (next === "ai") {
                    console.log("[ControlPage] enter AI mode → Flask only");
                    return;
                }
                next === "auto" ? await enterAuto() : await enterManual(1);
            } catch (e) {
                console.error(e);
                setMode(prev);
                alert("모드 변경 실패");
            }
        },
        [mode]
    );

    /* ===== 데이터 로딩 (기존) ===== */
    useEffect(() => {
        let alive = true;

        // 실내
        (async () => {
            try {
                const r = await fetch(`/api/sensor/latest`, { credentials: "include" });
                const j = await safeJson(r);
                if (!alive) return;
                setInPM25(asNum(j.PM2_5 ?? j.pm2_5 ?? j.pm25));
                setInPM10(asNum(j.PM10 ?? j.pm10));
                setInTemp(asNum(j.TEMP ?? j.temp ?? j.temperature));
                setInRH(asNum(j.HUM ?? j.rh ?? j.humidity));
            } catch {
                if (!alive) return;
                setInPM25(null);
                setInPM10(null);
                setInTemp(null);
                setInRH(null);
            }
        })();

        // 실외
        (async () => {
            try {
                const [dustR, weatherR] = await Promise.all([
                    fetch(`/api/dust`, { credentials: "include" }),
                    fetch(`/api/weather/outdoor`, { credentials: "include" }),
                ]);
                const dust = await safeJson(dustR);
                const w = await safeJson(weatherR);
                if (!alive) return;
                setOutPM10(asNum(dust.pm10));
                setOutPM25(asNum(dust.pm25));
                setOutTemp(asNum(w.temp ?? w.temperature));
                setOutRH(asNum(w.humidity ?? w.rh));
            } catch {
                if (!alive) return;
                setOutPM10(null);
                setOutPM25(null);
                setOutTemp(null);
                setOutRH(null);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    /* ===== AI(Flask) 연동 ===== */
    const [aiOn, setAiOn] = useState(false);
    const [block] = useState<"class" | "break" | "night" | "default">("default");
    const [lastAction, setLastAction] = useState<AutoAction | null>(null);

    const prevForPolicy = useMemo(() => {
        if (!lastAction) return null;
        return { fan: lastAction.fan, until: lastAction.until, reason: lastAction.reason };
    }, [lastAction]);

    async function callAutoApply() {
        const indoor = { pm25: inPM25, pm10: inPM10, temp: inTemp, rh: inRH, co2: null as any };
        const outdoor = { pm25: outPM25, pm10: outPM10 };
        const payload = { building: "K", room: "301", block, indoor, outdoor, prev_action: prevForPolicy };

        const r = await fetch(`${FLASK}/auto/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        const j = await safeJson(r);
        if (j?.action) setLastAction(j.action as AutoAction);
    }

    // StrictMode 개발환경에서의 중복 실행/중복 interval 방지
    const pollTimerRef = useRef<number | null>(null);
    const firedRef = useRef(false);

    useEffect(() => {
        if (!aiOn) {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
            firedRef.current = false;
            return;
        }

        if (!firedRef.current) {
            firedRef.current = true;
            callAutoApply().catch(() => {}); // 즉시 1회
        }

        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = window.setInterval(() => {
            callAutoApply().catch(() => {});
        }, 30000) as unknown as number;

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aiOn, inPM25, inPM10, inTemp, inRH, outPM25, outPM10, block, prevForPolicy]);

    /* ===== ControlPanel → 이벤트 수신 ===== */
    const onControlCommand = useCallback(
        (cmd: any) => {
            const t = cmd?.type?.toString()?.toUpperCase?.() || "";
            const v = cmd?.value?.toString()?.toUpperCase?.() || "";
            if (t === "MODE" && v === "AI") {
                setAiOn(prev => !prev); // 토글
                setMode("ai");          // Spring 호출 차단 분기 유지
                return;
            }
            if (t === "MODE" && (v === "AUTO" || v === "MANUAL")) {
                onChangeMode(v.toLowerCase());
                return;
            }
            if (t === "POWER" && typeof cmd.value === "boolean") {
                onTogglePower(Boolean(cmd.value));
                return;
            }
        },
        [onChangeMode, onTogglePower]
    );

    /* ===== PanelCard에 넘길 값 (기존) ===== */
    const indoor: PanelData = useMemo(
        () => ({
            title: "실내",
            timestamp,
            items: [
                { label: "초미세먼지(PM2.5)", value: round(inPM25, 0) ?? "--", unit: "μg/m³", icon: "pm25" },
                { label: "미세먼지(PM10)",  value: round(inPM10, 0) ?? "--", unit: "μg/m³", icon: "pm10" },
                { label: "온도",              value: round(inTemp, 1) ?? "--", unit: "℃",     icon: "temp" },
                { label: "습도",              value: round(inRH, 0) ?? "--",  unit: "%",      icon: "rh"   },
            ],
        }),
        [inPM25, inPM10, inTemp, inRH, timestamp]
    );

    const outdoorTiles = useMemo(
        () => [
            { label: "초미세먼지(PM2.5)", value: round(outPM25, 0) ?? "--", unit: "μg/m³", icon: "pm25" as const },
            { label: "미세먼지(PM10)",    value: round(outPM10, 0) ?? "--", unit: "μg/m³", icon: "pm10" as const },
            { label: "온도",              value: round(outTemp, 1) ?? "--",  unit: "℃",     icon: "temp" as const },
            { label: "습도",              value: round(outRH, 0) ?? "--",    unit: "%",      icon: "rh"   as const },
        ],
        [outPM25, outPM10, outTemp, outRH]
    );

    /* ===== 렌더 ===== */
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0">
                <Header left="공기 가전 제어" center="환기청정기 제어" user="kw1@korea.kr" />
                <FilterBar
                    station={station}
                    onStationChange={setStation}
                    device={device}
                    onDeviceChange={setDevice}
                />
                <div className="flex-1 p-5 space-y-4 min-h-0">
                    <Card
                        className="rounded-[28px] bg-gradient-to-b from-sky-200/60 to-sky-50 overflow-hidden"
                        style={{ height: "clamp(560px, 82vh, 860px)" }}
                    >
                        <CardContent className="p-5 h-full flex flex-col min-h-0">
                            {/* 오른쪽 정렬 유지 */}
                            <div className="mb-4 shrink-0 flex items-center gap-2">
                                <div className="ml-auto flex items-center gap-2">
                                    <ControlPanelKW
                                        mode={mode}
                                        setMode={(m) => onChangeMode(m as string)}
                                        powerOn={powerOn}
                                        setPowerOn={onTogglePower}
                                        timestamp={timestamp}
                                        onCommand={onControlCommand} // 공기지능 이벤트 받는 곳
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-h-0">
                                <PanelCard data={indoor} fillParent outdoorTiles={outdoorTiles} />
                                {lastAction && (
                                    <div className="text-sm text-slate-600 mt-2">
                                        AI: {lastAction.fan}단 · {lastAction.duration_min}분 · {lastAction.reason}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
