import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Calendar, Filter } from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from "recharts";

import { fetchAnalysisData, type AnalysisPoint } from "@/api/analysis";

// 차트 높이 (필요하면 조절)
const CHART_HEIGHT = 600;

// 실제 사용하는 4개 지표
export type MetricKey = "pm10" | "pm25" | "temp" | "rh";

const METRIC_LABEL: Record<MetricKey, string> = {
    pm10: "미세먼지 (PM₁₀)",
    pm25: "초미세먼지 (PM₂.₅)",
    temp: "온도 (TEMP)",
    rh:   "습도 (RH)",
};

const SERIES_STYLE: Record<MetricKey, { stroke: string; yAxis: "left" | "right" }> = {
    pm10: { stroke: "#64748B", yAxis: "left" },
    pm25: { stroke: "#3B82F6", yAxis: "left" },
    temp: { stroke: "#F97316", yAxis: "right" },
    rh:   { stroke: "#14B8A6", yAxis: "right" },
};

// 기본 ON: pm25/temp/rh
const DEFAULT_ON: MetricKey[] = ["pm25", "temp", "rh"];

export default function AnalysisDashboard() {
    const [station, setStation] = useState("A");
    const today = new Date().toISOString().slice(0, 10);
    // ✅ 단일 날짜만 관리
    const [date, setDate] = useState(today);

    const [enabled, setEnabled] = useState<Record<MetricKey, boolean>>(() => {
        const base: Record<MetricKey, boolean> = { pm10:false, pm25:false, temp:false, rh:false };
        DEFAULT_ON.forEach((k) => (base[k] = true));
        return base;
    });

    const chartRef = useRef<HTMLDivElement>(null);
    const [rows, setRows] = useState<AnalysisPoint[]>([]);

    const activeKeys = (Object.keys(enabled) as MetricKey[]).filter((k) => enabled[k]);
    const handleToggle = (k: MetricKey, v: boolean | string) =>
        setEnabled((prev) => ({ ...prev, [k]: !!v }));

    // ── X축 도메인: 선택한 날짜의 00:00 ~ 23:59
    function dayDomainMs(d: string) {
        const start = new Date(`${d}T00:00:00`).getTime();
        const end   = new Date(`${d}T23:59:00`).getTime();
        return { start, end };
    }
    // HH:mm → ms (선택 날짜 기준)
    function hhmmToMs(dateYYYYMMDD: string, hhmm: string) {
        return new Date(`${dateYYYYMMDD}T${hhmm}:00`).getTime();
    }

    // 안전 접근/할당(타입 안전)
    function getMetricValue(p: AnalysisPoint, key: MetricKey): number | undefined {
        switch (key) {
            case "pm10": return (p as { pm10?: number }).pm10;
            case "pm25": return (p as { pm25?: number }).pm25;
            case "temp": return (p as { temp?: number }).temp;
            case "rh":   return (p as { rh?: number }).rh;
        }
    }
    function setMetricValue(target: AnalysisPoint, key: MetricKey, value: number): void {
        switch (key) {
            case "pm10": (target as { pm10?: number }).pm10 = value; break;
            case "pm25": (target as { pm25?: number }).pm25 = value; break;
            case "temp": (target as { temp?: number }).temp = value; break;
            case "rh":   (target as { rh?: number }).rh   = value; break;
        }
    }

    // ── 15분 리샘플링(평균) + 00:00~24:00 고정 버킷
    function resample15min(points: AnalysisPoint[], startMs: number, endMs: number, d: string) {
        const intervalMin = 15;
        type Bucket = { c: number; sums: Record<MetricKey, number> };
        const buckets: Record<number, Bucket> = {};
        for (let t = startMs; t <= endMs; t += intervalMin * 60 * 1000) {
            buckets[t] = { c: 0, sums: {} as Record<MetricKey, number> };
        }

        const metrics: MetricKey[] = ["pm25", "temp", "rh", "pm10"];
        for (const p of points) {
            const pt = (typeof (p as { t?: number }).t === "number")
                ? (p as { t: number }).t
                : hhmmToMs(d, (p as { ts: string }).ts);

            const minutes = Math.floor(pt / 60000);
            const bucketMin = Math.floor(minutes / intervalMin) * intervalMin;
            const bt = bucketMin * 60000;

            const bucket = buckets[bt];
            if (!bucket) continue;

            bucket.c += 1;
            for (const key of metrics) {
                const v = getMetricValue(p, key);
                if (typeof v === "number") bucket.sums[key] = (bucket.sums[key] ?? 0) + v;
            }
        }

        const out: AnalysisPoint[] = [];
        for (let t = startMs; t <= endMs; t += intervalMin * 60 * 1000) {
            const b = buckets[t];
            const dt = new Date(t);
            const hh = String(dt.getHours()).padStart(2, "0");
            const mm = String(dt.getMinutes()).padStart(2, "0");
            const row: AnalysisPoint = { t, ts: `${hh}:${mm}` };
            if (b.c > 0) {
                (Object.keys(b.sums) as MetricKey[]).forEach((k) => {
                    setMetricValue(row, k, b.sums[k] / b.c);
                });
            }
            out.push(row);
        }
        return out;
    }

    // ✅ 조회: 단일 날짜만 사용 (start=end=date)
    const handleQuery = async () => {
        try {
            const raw = await fetchAnalysisData({ from: date, to: date });
            const { start, end } = dayDomainMs(date);
            const sampled = resample15min(raw, start, end, date);
            setRows(sampled);
        } catch (e) {
            console.error(e);
            alert("데이터 조회 중 오류가 발생했습니다.");
        }
    };

    // PNG 다운로드
    const handleDownload = async () => {
        const wrapper = chartRef.current;
        if (!wrapper) return;
        const svg = wrapper.querySelector("svg");
        if (!svg) return;

        const xml = new XMLSerializer().serializeToString(svg);
        const svg64 = btoa(unescape(encodeURIComponent(xml)));
        const image64 = `data:image/svg+xml;base64,${svg64}`;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const png = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = png;
            a.download = `SEMS_그래프_${date}.png`;
            a.click();
        };
        img.src = image64;
    };

    const { start, end } = dayDomainMs(date);

    return (
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
            {/* 상단 필터바 */}
            <Card className="border border-slate-200/80">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2 min-w-[220px]">
                            <span className="text-sm text-slate-600">스테이션</span>
                            <Select value={station} onValueChange={setStation}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="스테이션" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">3-201호</SelectItem>
                                    <SelectItem value="B">3-202호</SelectItem>
                                    <SelectItem value="C">3-203호</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ✅ 달력 1개만 사용 */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="pl-8 w-[160px]" />
                            </div>

                            <Button onClick={handleQuery} className="gap-2">
                                <Filter className="h-4 w-4" /> 조회
                            </Button>
                            <Button variant="secondary" onClick={handleDownload} className="gap-2">
                                <Download className="h-4 w-4" /> 그래프 다운로드
                            </Button>
                        </div>
                    </div>

                    {/* 체크박스 */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                        {(Object.keys(METRIC_LABEL) as MetricKey[]).map((k) => (
                            <label key={k} className="flex items-center gap-2 rounded-lg border border-slate-200/80 px-3 py-2 hover:bg-slate-50">
                                <Checkbox checked={enabled[k]} onCheckedChange={(v) => handleToggle(k, v)} />
                                <span className="text-xs text-slate-700 select-none" style={{ color: enabled[k] ? SERIES_STYLE[k].stroke : undefined }}>
                  {METRIC_LABEL[k]}
                </span>
                            </label>
                        ))}
                        {/* 빈 칸(레이아웃 유지용) */}
                        <div className="hidden lg:block" />
                        <div className="hidden lg:block" />
                        <div className="hidden lg:block" />
                    </div>
                </CardContent>
            </Card>

            {/* 그래프 */}
            <div className="mt-4 min-w-0">
                <Card className="border border-slate-200/80" style={{ minHeight: CHART_HEIGHT + 80 }}>
                    <CardContent className="p-3 md:p-4">
                        <div ref={chartRef} className="w-full min-w-0" style={{ height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={rows} margin={{ top: 16, right: 32, bottom: 24, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="t"
                                        type="number"
                                        scale="time"
                                        domain={[start, end]}              // ✅ 하루 고정
                                        tickFormatter={(value) => {
                                            const d = new Date(value as number);
                                            const hh = String(d.getHours()).padStart(2, "0");
                                            const mm = String(d.getMinutes()).padStart(2, "0");
                                            return `${hh}:${mm}`;
                                        }}
                                        tick={{ fontSize: 12, fill: "#64748B" }}
                                        minTickGap={24}
                                        tickMargin={8}
                                    />
                                    <YAxis yAxisId="left"  tick={{ fontSize: 12, fill: "#64748B" }} width={44} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#64748B" }} width={44} />
                                    <Tooltip
                                        labelFormatter={(value) => {
                                            const d = new Date(value as number);
                                            const hh = String(d.getHours()).padStart(2, "0");
                                            const mm = String(d.getMinutes()).padStart(2, "0");
                                            return `${hh}:${mm}`;
                                        }}
                                        contentStyle={{ borderRadius: 12, borderColor: "#CBD5E1" }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: 8 }} />
                                    {activeKeys.map((k) => (
                                        <Line
                                            key={k}
                                            type="monotone"
                                            dataKey={k}
                                            name={METRIC_LABEL[k]}
                                            yAxisId={SERIES_STYLE[k].yAxis}
                                            stroke={SERIES_STYLE[k].stroke}
                                            strokeWidth={2}
                                            dot={false}
                                            isAnimationActive={false}
                                            connectNulls
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
