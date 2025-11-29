// src/components/control/WindCard.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fan, Plus, Minus } from "lucide-react";
import { setFanLevel, type FanLevel } from "@/services/deviceApi";

type UiMode = "AUTO" | "MANUAL";

// 프록시 사용 시 ""(상대경로)로 동작
const BASE =
    (import.meta as any).env?.VITE_SPRING_BASE ??
    (typeof window !== "undefined" ? "" : "http://localhost:8080");

export function WindCardKW({
                               defaultMode = "AUTO",
                               defaultLevel = 1,
                               onApply,
                               internalApi = true,
                           }: {
    defaultMode?: UiMode;
    defaultLevel?: 1 | 2 | 3;
    onApply?: (payload: { mode: UiMode; level: 1 | 2 | 3 }) => void | Promise<void>;
    internalApi?: boolean;
}) {
    const [uiMode, setUiMode] = React.useState<UiMode>(defaultMode);
    const [level, setLevel] = React.useState<1 | 2 | 3>(defaultLevel as any);
    const [busy, setBusy] = React.useState(false);

    const inc = () => setLevel((l) => (l < 3 ? ((l + 1) as 1 | 2 | 3) : l));
    const dec = () => setLevel((l) => (l > 1 ? ((l - 1) as 1 | 2 | 3) : l));

    // ✅ 모드 전환: 백엔드 구현에 정확히 맞춤
    const applyMode = async (next: UiMode) => {
        if (busy) return;
        setBusy(true);
        try {
            if (internalApi) {
                if (next === "AUTO") {
                    // GET /api/motor/auto
                    const r = await fetch(`${BASE}/api/motor/auto`, { method: "GET" });
                    const t = await r.text();
                    console.info("[WindCard] → GET /api/motor/auto", r.status, t);
                    if (!r.ok) throw new Error(t || "auto failed");
                } else {
                    // POST /api/motor/manual  (현재 선택 level로 수동 진입)
                    const r = await fetch(`${BASE}/api/motor/manual`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ level }),
                    });
                    const t = await r.text();
                    console.info("[WindCard] → POST /api/motor/manual", r.status, t);
                    if (!r.ok) throw new Error(t || "manual failed");
                }
            }
            setUiMode(next);
            if (onApply) await onApply({ mode: next, level });
        } catch (e) {
            console.error(e);
            alert(`모드 변경 실패 (${next})`);
        } finally {
            setBusy(false);
        }
    };

    // ✅ 풍량 적용(수동에서만) — 이미 /api/motor/manual {level}로 동작 중
    const applyLevel = async () => {
        if (busy) return;
        if (uiMode === "AUTO") {
            alert("자동 모드에서는 풍량 단계를 변경할 수 없습니다.");
            return;
        }
        setBusy(true);
        try {
            if (internalApi) {
                await setFanLevel(level as unknown as FanLevel);
            }
            if (onApply) await onApply({ mode: uiMode, level });
        } catch (e) {
            console.error(e);
            alert("풍량 적용에 실패했습니다.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Card className="rounded-2xl overflow-hidden shadow-md border-0">
            <CardContent className="p-0">
                <div className="bg-gradient-to-b from-[#22469B] to-[#2A59BF] p-4 md:p-5">
                    {/* 상단: 라벨 + 모드 토글 */}
                    <div className="flex items-center justify-between text-white/90 mb-3">
                        <div className="flex items-center gap-2 font-semibold">
                            <Fan className="w-4 h-4" />
                            풍량 설정
                        </div>
                        <div className="hidden md:flex gap-1">
                            {(["AUTO", "MANUAL"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => applyMode(m)}
                                    disabled={busy}
                                    className={
                                        "text-[11px] px-2 py-[3px] rounded-full border transition " +
                                        (uiMode === m
                                            ? "bg-white text-[#1E3A8A] border-white"
                                            : "bg-white/10 text-white/90 border-white/40 hover:bg-white/20")
                                    }
                                >
                                    {m === "AUTO" ? "자동" : "수동"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 본문: 레벨/막대/컨트롤 */}
                    <div className="flex items-end justify-between">
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-extrabold text-white leading-none">{level}</span>
                            <div className="flex items-end gap-1 h-[28px]">
                                {[12, 18, 24].map((h, i) => (
                                    <div
                                        key={i}
                                        className={"w-3 rounded-md " + (i < level ? "bg-white" : "bg-white/40")}
                                        style={{ height: h }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2 grid-cols-3">
                            <Button
                                size="sm"
                                className="h-9 rounded-lg bg-white text-[#1E3A8A]"
                                onClick={inc}
                                disabled={busy || uiMode === "AUTO" || level >= 3}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 rounded-lg bg-white/10 text-white border-white/60"
                                onClick={dec}
                                disabled={busy || uiMode === "AUTO" || level <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                className="h-9 rounded-lg bg-white text-[#1E3A8A]"
                                onClick={applyLevel}
                                disabled={busy || uiMode === "AUTO"}
                            >
                                {busy ? "적용 중..." : "적용"}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
