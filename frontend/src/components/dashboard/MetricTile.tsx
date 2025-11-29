// src/components/dashboard/MetricTile.tsx
import * as React from "react";
import { motion } from "framer-motion";

export type Quality = "good" | "moderate" | "bad";

export type TileMetric = {
    label?: string;                 // ex) "초미세먼지(PM2.5)"
    value?: string | number | null; // ex) 14 or "27%"
    unit?: string;                  // ex) "µg/m³"
    status?: string;                // ex) "좋음"
    quality?: Quality;              // 색상 결정
    icon?: "pm25" | "pm10" | "temp" | "humid" | "rh";
};

const toText = (v: string | number | null | undefined) =>
    v == null ? "" : String(v);

const valueColor = (q?: Quality) => {
    switch (q) {
        case "good":     return "text-sky-600";
        case "moderate": return "text-amber-600";
        case "bad":      return "text-rose-600";
        default:         return "text-sky-700";
    }
};
const statusColor = (q?: Quality) => {
    switch (q) {
        case "good":     return "text-sky-600";
        case "moderate": return "text-amber-600";
        case "bad":      return "text-rose-600";
        default:         return "text-slate-600";
    }
};

// 배지 텍스트 자동 매핑
function badgeText(m: TileMetric): string {
    if (m.icon === "pm25") return "PM2.5";
    if (m.icon === "pm10") return "PM10";
    if (m.icon === "temp") return "TEMP";
    if (m.icon === "humid" || m.icon === "rh") return "RH";
    const L = (m.label ?? "").toUpperCase();
    if (L.includes("PM2.5")) return "PM2.5";
    if (L.includes("PM10"))  return "PM10";
    if (L.includes("TEMP") || L.includes("온도")) return "TEMP";
    if (L.includes("RH")   || L.includes("습도")) return "RH";
    return "INFO";
}

export default function MetricTile({ m }: { m: TileMetric }) {
    const has = m.value !== undefined && m.value !== null && m.value !== "";
    const val = has ? toText(m.value) : "--";
    const badge = badgeText(m);

    // 값에 단위가 이미 포함되어 있으면 오른쪽 단위 숨김
    const unitInValue =
        val.includes("%") || val.includes("㎍") || val.includes("µg") ||
        val.includes("ppm") || val.includes("℃");
    const showRightUnit = has && !!m.unit && !unitInValue;

    // 좌우 여백(패딩) 고정: 배지(36px) + 좌/우 마진 12 + 간격 8 ≈ 56
    const SIDE_PAD = 56; // 좌/우 동일하게 줘서 숫자 완전 중앙 보장

    return (
        <motion.div
            initial={{ y: 6, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="h-full rounded-2xl bg-white shadow-[0_6px_18px_rgba(8,33,66,0.12)] border border-white/60 overflow-hidden flex flex-col"
        >
            {/* 상단 제목 바 */}
            <div className="px-3 py-1.5 bg-[#EAF3FF] text-slate-800 text-[12px] font-semibold text-center">
                {m.label}
            </div>

            {/* 본문: 배지/단위는 absolute, 값+상태는 중앙 고정 */}
            <div
                className="relative flex-1"
                style={{ paddingLeft: SIDE_PAD, paddingRight: SIDE_PAD }}
            >
                {/* 왼쪽 배지 */}
                <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#F3F6FA] border border-slate-200 grid place-items-center text-slate-500 font-semibold text-[10px] tracking-wider select-none"
                    aria-hidden
                >
                    {badge}
                </div>

                {/* 오른쪽 단위(필요 시만) */}
                {showRightUnit && (
                    <div
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 select-none"
                        aria-hidden
                    >
                        {m.unit}
                    </div>
                )}

                {/* 중앙 값 + 상태 (항상 정확히 가운데) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] text-center select-none">
                    <div
                        className={`font-extrabold ${valueColor(m.quality)}`}
                        style={{ fontSize: 26, lineHeight: 1 }}
                    >
                        {val}
                    </div>
                    <div className={`mt-1 text-[12px] font-semibold ${statusColor(m.quality)}`}>
                        {m.status ?? ""}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
