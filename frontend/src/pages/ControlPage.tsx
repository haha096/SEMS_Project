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

/* ===== Reason → Korean short mapping (라벨 요약) ===== */
function mapReasonKorean(reasonRaw?: string): string {
    const txt = (reasonRaw ?? "").toLowerCase();
    const tokens = txt
        .split(/[;|,]+|\s*\+\s*/g)
        .map(s => s.trim())
        .filter(Boolean);

    const dict: Record<string, string> = {
        "high pollution": "실내 오염 높음",
        "purify": "청정 운전",
        "outdoor-bad": "실외 오염 높음 → 환기 억제",
        "vent-suppressed": "환기 억제",
        "outdoor-better-than-indoor": "실외가 실내보다 깨끗 → 환기 유리",
        "class-cap": "수업 시간 상한 적용",
        "night-cap": "야간 상한 적용",
        "hysteresis-hold": "최소 유지시간 유지",
        "hold(hysteresis)": "최소 유지시간 유지",
        "ml-spike": "예측: 곧 악화 → 선제 상향",
        "ml-forecast-spike": "예측: 곧 악화 → 선제 상향",
        "ml-forecast-cool": "예측: 개선 → 단계 완화",
        "fallback-no-state": "센서 미수신 → 보수 운전"
    };

    const mapped = tokens.map(t => dict[t] ?? t);
    const uniq = Array.from(new Set(mapped)).filter(Boolean);
    return uniq.length ? uniq.join(" · ") : "최근 의사결정 없음";
}

/* ===== Narrative builder (사람친화 한줄 문장 + 행동요령) ===== */
function buildNarrative(opts: {
    indoor?: { pm25?: number | null; pm10?: number | null };
    outdoor?: { pm25?: number | null; pm10?: number | null };
    fan?: FanLevel | null;
    tokensText?: string;
    block?: string;
}): { line: string; tooltip: string } {
    const { indoor, outdoor, fan, tokensText, block } = opts;
    const tok = (tokensText ?? "").toLowerCase();
    const tokens = tok
        .split(/[;|,]+|\s*\+\s*/g)
        .map(s => s.trim())
        .filter(Boolean);

    // 비교/값
    const in25 = indoor?.pm25 ?? null;
    const out25 = outdoor?.pm25 ?? null;
    const diff25 = (in25 != null && out25 != null) ? in25 - out25 : null;

    // 원인 파트
    const causes: string[] = [];
    if (tokens.includes("high pollution")) causes.push("실내 공기질이 좋지 않아");
    if (tokens.includes("outdoor-better-than-indoor")) causes.push("실외가 더 깨끗해");
    if (tokens.includes("outdoor-bad") || tokens.includes("vent-suppressed")) causes.push("실외 공기가 좋지 않아 환기를 피해야 해");
    if (tokens.includes("hysteresis-hold") || tokens.includes("hold(hysteresis)")) causes.push("잦은 변동을 막기 위해 현재 풍량을 유지하고");
    if (tokens.includes("ml-forecast-spike") || tokens.includes("ml-spike")) causes.push("곧 오염이 악화될 것으로 예측되어");
    if (tokens.includes("ml-forecast-cool")) causes.push("곧 개선될 전망이라");

    // 정책 블록 문구
    if (block === "class") causes.push("수업 중 소음을 줄이기 위해");
    if (block === "night") causes.push("야간 정책으로");

    // 풍량 문구
    const fanText =
        fan === 3 ? "강풍(3단)으로 운전합니다." :
            fan === 2 ? "중간 풍량(2단)으로 운전합니다." :
                fan === 1 ? "약풍(1단)으로 운전합니다." :
                    fan === 0 ? "전원을 꺼 유지합니다." :
                        "적절한 풍량으로 운전합니다.";

    // 행동요령
    let tip = "";
    const outdoorBad = tokens.includes("outdoor-bad") || tokens.includes("vent-suppressed");
    const outdoorBetter = tokens.includes("outdoor-better-than-indoor");
    if (outdoorBetter || (diff25 != null && diff25 > 8)) {
        tip = "창문을 살짝 열어 환기하세요.";
    } else if (outdoorBad || (diff25 != null && diff25 < -8)) {
        tip = "창문은 닫고 청정을 유지하세요.";
    } else {
        tip = "주기적으로 상태를 확인하세요.";
    }

    // 한 줄 문장
    const causeText = causes.length ? (causes.join(", ") + ", ") : "";
    const line = `${causeText}${fanText} ${tip}`;
    const tooltipParts: string[] = [];
    if (in25 != null) tooltipParts.push(`실내 PM2.5=${Math.round(in25)}`);
    if (out25 != null) tooltipParts.push(`실외 PM2.5=${Math.round(out25)}`);
    if (diff25 != null) tooltipParts.push(`차이=${diff25 > 0 ? "+" : ""}${Math.round(diff25)}`);
    const tooltip = `${line}${tooltipParts.length ? ` · (${tooltipParts.join(", ")})` : ""}`;

    return { line, tooltip };
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

    // === (문제1 해결) AI 루프가 센서 폴링에 영향받지 않도록 최신값 ref 보관
    const inPM25Ref = useRef<number | null>(null);
    const inPM10Ref = useRef<number | null>(null);
    const inTempRef = useRef<number | null>(null);
    const inRHRef = useRef<number | null>(null);
    const outPM25Ref = useRef<number | null>(null);
    const outPM10Ref = useRef<number | null>(null);

    useEffect(() => { inPM25Ref.current = inPM25; }, [inPM25]);
    useEffect(() => { inPM10Ref.current = inPM10; }, [inPM10]);
    useEffect(() => { inTempRef.current  = inTemp;  }, [inTemp]);
    useEffect(() => { inRHRef.current    = inRH;    }, [inRH]);
    useEffect(() => { outPM25Ref.current = outPM25; }, [outPM25]);
    useEffect(() => { outPM10Ref.current = outPM10; }, [outPM10]);

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

    // ⚠️ "ai" 모드일 땐 Spring 호출 금지
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

    /* ===== (문제2 개선) 데이터 로딩: 모니터링식 '폴링 + 병렬' ===== */
    const POLL_MS = 5_000;
    const inFlightRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        let alive = true;

        const scheduleNext = () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            if (!document.hidden) timerRef.current = window.setTimeout(fetchOnce, POLL_MS);
            else timerRef.current = null;
        };

        const fetchOnce = async () => {
            if (inFlightRef.current) return;
            inFlightRef.current = true;
            try {
                // 실내/실외 요청 완전 병렬 + 캐시 무력화
                const indoorReq = fetch(`/api/sensor/latest`, {
                    credentials: "include",
                    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache", "Accept": "application/json" },
                    cache: "no-store",
                });
                const dustReq = fetch(`/api/dust`, {
                    credentials: "include",
                    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache", "Accept": "application/json" },
                    cache: "no-store",
                });
                const weatherReq = fetch(`/api/weather/outdoor`, {
                    credentials: "include",
                    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache", "Accept": "application/json" },
                    cache: "no-store",
                });

                const [indoorRes, dustRes, weatherRes] = await Promise.allSettled([indoorReq, dustReq, weatherReq]);

                // 실내
                if (indoorRes.status === "fulfilled") {
                    try {
                        const j = await safeJson(indoorRes.value);
                        if (!alive) return;
                        setInPM25(asNum(j.PM2_5 ?? j.pm2_5 ?? j.pm25));
                        setInPM10(asNum(j.PM10 ?? j.pm10));
                        setInTemp(asNum(j.TEMP ?? j.temp ?? j.temperature));
                        setInRH(asNum(j.HUM ?? j.rh ?? j.humidity));
                    } catch {/* ignore */}
                } else {
                    if (!alive) return;
                    setInPM25(null); setInPM10(null); setInTemp(null); setInRH(null);
                }

                // 실외
                if (dustRes.status === "fulfilled" && weatherRes.status === "fulfilled") {
                    try {
                        const dust = await safeJson(dustRes.value);
                        const w = await safeJson(weatherRes.value);
                        if (!alive) return;
                        setOutPM10(asNum(dust.pm10));
                        setOutPM25(asNum(dust.pm25));
                        setOutTemp(asNum(w.temp ?? w.temperature));
                        setOutRH(asNum(w.humidity ?? w.rh));
                    } catch {/* ignore */}
                } else {
                    if (!alive) return;
                    setOutPM10(null); setOutPM25(null); setOutTemp(null); setOutRH(null);
                }
            } finally {
                inFlightRef.current = false;
                if (alive) scheduleNext();
            }
        };

        const onVis = () => {
            if (document.hidden) {
                if (timerRef.current) window.clearTimeout(timerRef.current);
                timerRef.current = null;
            } else {
                fetchOnce();
            }
        };

        document.addEventListener("visibilitychange", onVis);
        fetchOnce();
        // 첫 로딩 워밍업: 0.5초 뒤 한 번 더 (콜드스타트/세션 확립 보정)
        const warm = window.setTimeout(() => { if (!document.hidden) fetchOnce(); }, 500);

        return () => {
            alive = false;
            document.removeEventListener("visibilitychange", onVis);
            if (timerRef.current) window.clearTimeout(timerRef.current);
            window.clearTimeout(warm);
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
        // (문제1 해결) 센서값은 state가 아닌 ref에서 읽음 → 폴링과 독립
        const indoor = { pm25: inPM25Ref.current, pm10: inPM10Ref.current, temp: inTempRef.current, rh: inRHRef.current, co2: null as any };
        const outdoor = { pm25: outPM25Ref.current, pm10: outPM10Ref.current };


        const payload = { building: "K", room: "301", block, indoor, outdoor, prev_action: prevForPolicy };

        // 1️⃣ 정책 결정
        const r = await fetch(`${FLASK}/auto/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        const j = await safeJson(r);
        if (j?.action) setLastAction(j.action as AutoAction);

        // 2️⃣ 설명
        try {
            const expRes = await fetch(`${FLASK}/auto/explain`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ state: payload, action: j.action }),
            });
            const expJson = await safeJson(expRes);
            const serverLine = expJson?.explanation as string | undefined;
            if (serverLine) {
                console.log("[AI EXPLAIN]", serverLine);
            }
        } catch (e) {
            console.warn("[AI explain fetch failed]", e);
        }
    }

    // StrictMode 중복 interval 방지
    const pollTimerRef = useRef<number | null>(null);
    const firedRef = useRef(false);

    // (문제1 해결) 의존성에서 센서값 제거 → 폴링과 독립
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
            callAutoApply().catch(() => {}); // AI On 시 1회 즉시
        }

        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = window.setInterval(() => {
            callAutoApply().catch(() => {});
        }, 30_000) as unknown as number; // 30초 주기

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
        // 센서값 의존성 제거!
    }, [aiOn, block, prevForPolicy]);

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
    const reasonShort = mapReasonKorean(lastAction?.reason);
    const narrative = buildNarrative({
        indoor: { pm25: inPM25 ?? undefined, pm10: inPM10 ?? undefined },
        outdoor: { pm25: outPM25 ?? undefined, pm10: outPM10 ?? undefined },
        fan: lastAction?.fan ?? null,
        tokensText: lastAction?.reason ?? "",
        block
    });

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
                            {/* 상단 바: 왼쪽(사유 한 줄) - 오른쪽(컨트롤 버튼) */}
                            <div className="mb-4 shrink-0 flex items-center gap-2">
                                {/* 왼쪽: 사람친화 한줄 설명 (긴 내용은 말줄임 + 툴팁) */}
                                <div className="flex-1 min-w-0">
                                    <div
                                        className="rounded-xl bg-white/80 border border-sky-200 px-4 py-2 text-[13px] font-semibold text-slate-800 truncate"
                                        title={`요약: ${reasonShort} · 상세: ${narrative.tooltip}`}
                                    >
                                        AI 판단: {narrative.line}
                                    </div>
                                </div>

                                {/* 오른쪽: 컨트롤 버튼들(기존) */}
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

                            {/* 본문 콘텐츠 */}
                            <div className="flex-1 min-h-0">
                                <PanelCard data={indoor} fillParent outdoorTiles={outdoorTiles} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
