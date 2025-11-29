// src/components/dashboard/PanelCard.tsx
import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { PanelData } from "@/types/ui";
import { motion } from "framer-motion";
import { House, CloudSun } from "lucide-react";
import MetricTile, { type TileMetric } from "./MetricTile";
import { WindCardKW } from "@/components/control/WindCard";

/* ================================ tokens & ratios ================================ */
const TOKENS = {
    radiusWall: 28,
    wallIndoor: "linear-gradient(180deg, #2247B7 0%, #3E6FD4 48%, #A2C5FF 100%)",
    wallOutdoor: "linear-gradient(180deg, #0B1E3A 0%, #0E3F6E 42%, #78B7FF 100%)",
};
type Variant = "indoor" | "outdoor";

const VIEW_W = 800;
const VIEW_H = 900;

// 실내 하우스 기준(5:6 비율 확장)
const HOUSE_BASE_W = 600;
const HOUSE_BASE_H = 720;

const INNER_LEFT_BASE = 90;
const INNER_W_BASE = 620;
const SHELF_Y_BASE = 300;
const BASE_Y_BASE = 850;

const GRID_TOP_BASE = SHELF_Y_BASE + 110;
const GRID_BOTTOM_BASE = BASE_Y_BASE + 20;
const GRID_H_BASE = GRID_BOTTOM_BASE - GRID_TOP_BASE - 100;
const GRID_GAP = 25;

const RX = HOUSE_BASE_W / VIEW_W;
const RY = HOUSE_BASE_H / VIEW_H;

const GRID_TOP = Math.round(GRID_TOP_BASE * RY);
const GRID_H = Math.round(GRID_H_BASE * RY);
const GRID_LEFT = Math.round(INNER_LEFT_BASE * RX);
const GRID_W = Math.round(INNER_W_BASE * RX);

const TILE_W_BASE = (GRID_W - GRID_GAP) / 2;
const TILE_H_BASE = (GRID_H - GRID_GAP) / 2;

/* 좌측 하우스 앵커 */
const HOUSE_BOX_LEFT_PAD = 24;
const HOUSE_BOX_TOP_PAD = 0;
const HOUSE_ANCHOR_LIFT = -60;

/* 실외 상단 ‘하늘’ 영역 */
const SKY_H = 120;          // 하늘 높이
const SKY_TO_GRID_GAP = 15;  // 하늘과 타일 사이 기본 간격

/* 초광폭에서 중앙 고정 폭(양옆 빈공간 방지) */
const MAX_CONTENT_W = 1380; // 1320~1480 권장

/* 우측 컬럼 폭 범위(창 크기에 따른 안정적 수축/확장) */
const RIGHT_COL_MIN = 460;
const RIGHT_COL_MAX = 540;

const clampPx = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

/* ================================ SkyHeader ================================ */
function SkyHeader({
                       height = SKY_H,
                       label = "실외",
                   }: {
    height?: number;
    label?: string;
}) {
    return (
        <div
            className="absolute left-0 top-0 w-full overflow-hidden rounded-t-[24px] z-0"
            style={{
                height,
                WebkitMaskImage: "linear-gradient(#000,#000)", // blur 번짐 방지
                maskImage: "linear-gradient(#000,#000)",
            }}
        >
            {/* 하늘 배경(새벽→하늘색→짙은 파랑) */}
            <div
                className="h-full w-full"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,0.66) 0%, rgba(186,219,255,0.42) 32%, rgba(120,170,230,0.28) 64%, rgba(60,110,200,0.22) 100%)",
                    backdropFilter: "blur(1.5px)",
                    WebkitBackdropFilter: "blur(1.5px)",
                }}
            />

            {/* 해(광륜) */}
            <svg
                className="absolute right-6 top-[-12px] pointer-events-none"
                width="140"
                height="140"
                viewBox="0 0 140 140"
                aria-hidden
            >
                <defs>
                    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                        <stop offset="45%" stopColor="rgba(255,255,255,0.55)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                </defs>
                <circle cx="70" cy="70" r="48" fill="url(#sunGlow)" />
            </svg>

            {/* 구름 2겹 (느리게 요요 이동) */}
            <style>{`
        @keyframes cloudA { 0%{ transform: translateX(0px) } 50%{ transform: translateX(18px) } 100%{ transform: translateX(0px) } }
        @keyframes cloudB { 0%{ transform: translateX(0px) } 50%{ transform: translateX(-22px) } 100%{ transform: translateX(0px) } }
      `}</style>

            {/* 첫 번째 구름 */}
            <svg
                className="absolute left-4 top-8 w-[64%] h-[48%] opacity-75"
                viewBox="0 0 500 200"
                aria-hidden
                style={{ animation: "cloudA 18s ease-in-out infinite" }}
            >
                <path
                    d="M20 130 Q80 80 150 100 Q200 110 260 90 Q320 70 380 100 Q440 120 500 110 L500 200 L20 200 Z"
                    fill="rgba(255,255,255,0.55)"
                />
            </svg>

            {/* 두 번째 구름 */}
            <svg
                className="absolute left-36 top-24 w-[52%] h-[42%] opacity-65"
                viewBox="0 0 500 200"
                aria-hidden
                style={{ animation: "cloudB 22s ease-in-out infinite" }}
            >
                <path
                    d="M0 140 Q70 110 140 125 Q210 135 290 115 Q360 105 440 125 L440 200 L0 200 Z"
                    fill="rgba(255,255,255,0.45)"
                />
            </svg>


            {/* 아주 옅은 수평선(하늘-공기 경계) */}
            <div
                className="absolute left-0 right-0"
                style={{
                    bottom: -1,
                    height: 18,
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
                }}
            />

            {/* 좌측 상단 라벨 */}
            <div className="absolute top-2 left-3 inline-flex items-center gap-2 text-white font-extrabold text-[22px] tracking-tight px-3 py-2 rounded-xl bg-white/14 border border-white/40 backdrop-blur-sm">
                <CloudSun className="w-5 h-5" />
                {label}
            </div>
        </div>
    );
}

/* ================================ Indoor SVG ================================ */
function IndoorBackdropSVG() {
    return (
        <motion.svg
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ duration: 0.5 }}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
        >
            <path
                d="M60 250 L400 60 L740 250 V850 H60 Z"
                fill="url(#indoorFill)"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect x="90" y={SHELF_Y_BASE} width="620" height="12" rx="6" fill="white" />
            <ellipse
                cx="400"
                cy={BASE_Y_BASE}
                rx="340"
                ry="36"
                fill="rgba(255,255,255,0.22)"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="3"
            />
            <defs>
                <linearGradient id="indoorFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                </linearGradient>
            </defs>
        </motion.svg>
    );
}

/* ================================ states ================================ */
function EmptyState() {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
            데이터가 없습니다.
        </div>
    );
}
function ErrorState({ message }: { message?: string }) {
    return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-4">
            불러오기 오류: {message ?? "알 수 없는 오류"}
        </div>
    );
}
function SkeletonGrid() {
    return (
        <div
            className="grid grid-cols-2"
            style={{ gap: GRID_GAP, height: GRID_H, gridAutoRows: "1fr" }}
        >
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/80 border border-white/60" />
            ))}
        </div>
    );
}

/* ================================ Main ================================ */
export default function PanelCard({
                                      data,
                                      rightBadge,
                                      variant = "indoor",
                                      loading = false,
                                      error,
                                      fillParent = false,
                                      outdoorTiles,
                                      onApplyWind,
                                  }: {
    data: PanelData;
    rightBadge?: React.ReactNode;
    variant?: Variant;
    loading?: boolean;
    error?: string;
    fillParent?: boolean;
    outdoorTiles?: TileMetric[];
    onApplyWind?: (p: { mode: "AI" | "AUTO" | "MANUAL"; level: 1 | 2 | 3 }) => void;
}) {
    const timestamp = new Date().toLocaleString();
    const wallGradient = variant === "indoor" ? TOKENS.wallIndoor : TOKENS.wallOutdoor;

    const contentRef = useRef<HTMLDivElement>(null);
    const leftColRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        if (!fillParent) return setScale(1);
        const root = contentRef.current;
        const leftCol = leftColRef.current;
        if (!root) return;

        const ro = new (window as any).ResizeObserver(() => {
            const pad = 8;
            const availH = Math.max(0, root.clientHeight - pad);
            const colW = Math.max(
                0,
                (leftCol?.clientWidth ?? root.clientWidth) - HOUSE_BOX_LEFT_PAD * 2
            );
            const colH = Math.max(0, availH - HOUSE_BOX_TOP_PAD);
            const sW = colW / HOUSE_BASE_W;
            const sH = colH / HOUSE_BASE_H;
            const s = Math.min(sW, sH);
            setScale(Number.isFinite(s) && s > 0 ? s : 1);
        });

        ro.observe(root);
        if (leftCol) ro.observe(leftCol);
        return () => ro.disconnect();
    }, [fillParent]);

    // 좌측 하우스 실제 픽셀 높이(우측 min-height 맞춤용)
    const leftPixelHeight = Math.round(HOUSE_BASE_H * scale);

    return (
        <Card
            className={`rounded-[28px] overflow-hidden border-0 shadow-xl w-full ${
                fillParent ? "h-full" : "max-h-[700px]"
            }`}
        >
            <CardContent className="p-0 h-full">
                <div className="relative w-full h-full min-h-0">
                    {/* 배경 */}
                    <div className="absolute inset-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="h-full w-full"
                            style={{
                                background: wallGradient,
                                borderRadius: TOKENS.radiusWall,
                            }}
                        />
                    </div>

                    {/* 콘텐츠 */}
                    <div
                        ref={contentRef}
                        className="relative px-5 pt-5 pb-6 text-white h-full flex flex-col min-h-0"
                        style={{ maxWidth: MAX_CONTENT_W, margin: "0 auto" }}
                    >
                        {/* grid: 좌측은 남은 공간, 우측은 고정 범위 clamp */}
                        <div
                            className="min-h-0 w-full grid gap-6
                         grid-cols-1 lg:grid-cols-[minmax(560px,1fr)_minmax(var(--rc-min),clamp(var(--rc-min),20vw,var(--rc-max)))]"
                            style={
                                {
                                    // CSS 변수로 우측 폭 범위 주입
                                    ["--rc-min" as any]: `${RIGHT_COL_MIN}px`,
                                    ["--rc-max" as any]: `${RIGHT_COL_MAX}px`,
                                } as React.CSSProperties
                            }
                        >
                            {/* ===== 좌: 실내 하우스 ===== */}
                            <div ref={leftColRef} className="relative">
                                <div
                                    className="absolute"
                                    style={{
                                        left: `${HOUSE_BOX_LEFT_PAD}px`,
                                        top: `${HOUSE_BOX_TOP_PAD + 16 + HOUSE_ANCHOR_LIFT}px`,
                                        width: HOUSE_BASE_W,
                                        height: HOUSE_BASE_H,
                                        transform: `scale(${scale})`,
                                        transformOrigin: "top left",
                                    }}
                                >
                                    {/* 지붕 중앙 타이틀 */}
                                    <div
                                        className="absolute flex flex-col items-center w-full text-center"
                                        style={{
                                            top: "135px",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <House className="w-5 h-5" />
                                            <div className="text-[22px] md:text-[24px] font-extrabold tracking-tight drop-shadow-sm">
                                                {data.title}
                                            </div>
                                        </div>
                                        <div className="mt-2 px-3 py-[6px] rounded-full text-[12px] bg-white/20 border border-white/40 backdrop-blur">
                                            {timestamp}
                                        </div>
                                    </div>

                                    {/* 실내 배경 */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <IndoorBackdropSVG />
                                    </div>

                                    {/* 실내 타일 */}
                                    <div
                                        className="absolute"
                                        style={{ top: GRID_TOP, left: GRID_LEFT, width: GRID_W }}
                                    >
                                        {error ? (
                                            <ErrorState message={error} />
                                        ) : loading ? (
                                            <SkeletonGrid />
                                        ) : !data?.items?.length ? (
                                            <EmptyState />
                                        ) : (
                                            <div
                                                className="grid grid-cols-2"
                                                style={{
                                                    gap: GRID_GAP,
                                                    height: GRID_H,
                                                    gridAutoRows: "1fr",
                                                }}
                                            >
                                                {data.items.map((m, i) => (
                                                    <MetricTile key={i} m={m as unknown as TileMetric} />
                                                ))}
                                            </div>
                                        )}
                                        {rightBadge && <div className="mt-3">{rightBadge}</div>}
                                    </div>
                                </div>
                            </div>

                            {/* ===== 우: 실외 영역 ===== */}
                            <div
                                className="relative flex flex-col overflow-hidden rounded-[24px]"
                                style={{
                                    minHeight: leftPixelHeight - 80,
                                    paddingTop: SKY_H + SKY_TO_GRID_GAP, // 하늘 높이를 컨테이너 패딩으로 확보
                                    isolation: "isolate", // z-index 계층 분리(효과 격리)
                                }}
                            >
                                {/* 하늘 */}
                                <SkyHeader height={SKY_H} label="실외" />

                                {/* 실외 타일 그리드 (실내 타일과 같은 픽셀 크기) */}
                                {(() => {
                                    const rawTileW = Math.round(TILE_W_BASE * scale);
                                    const rawTileH = Math.round(TILE_H_BASE * scale);
                                    const tileW = clampPx(rawTileW, 190, 290);
                                    const tileH = clampPx(rawTileH, 120, 190);

                                    const gridW = tileW * 2 + GRID_GAP;
                                    const gridH = tileH * 2 + GRID_GAP;

                                    const tiles =
                                        outdoorTiles ??
                                        [
                                            { label: "초미세먼지(PM2.5)", value: 18, unit: "μg/m³", icon: "pm25" },
                                            { label: "미세먼지(PM10)", value: 32, unit: "μg/m³", icon: "pm10" },
                                            { label: "온도", value: 12.8, unit: "℃", icon: "temp" },
                                            { label: "습도", value: 52, unit: "%", icon: "rh" },
                                        ];

                                    return (
                                        <div
                                            className="relative z-10 mx-auto"
                                            style={{
                                                width: gridW,
                                                height: gridH,
                                                display: "grid",
                                                gridTemplateColumns: `repeat(2, ${tileW}px)`,
                                                gridAutoRows: `${tileH}px`,
                                                gap: GRID_GAP,
                                            }}
                                        >
                                            {tiles.map((m, i) => (
                                                <div key={i} style={{ width: tileW, height: tileH }}>
                                                    <MetricTile m={m} />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* 풍량 카드 */}
                                <div className="mt-auto relative z-10 self-end w-full max-w-[560px]">
                                    <WindCardKW
                                        defaultMode="AUTO"
                                        defaultLevel={1}
                                        onApply={onApplyWind ?? (() => {})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 바닥 비네트 */}
                        <div
                            className="absolute bottom-4 left-[10%] w-[82%] h-[84px] rounded-[42px] pointer-events-none"
                            style={{
                                background:
                                    "radial-gradient(closest-side, rgba(255,255,255,0.22), rgba(255,255,255,0.10) 70%, rgba(255,255,255,0) 100%)",
                                filter: "blur(2px)",
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
