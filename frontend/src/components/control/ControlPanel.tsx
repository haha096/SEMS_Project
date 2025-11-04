// src/components/control/ControlPanel.tsx
import { Power } from "lucide-react";
import * as React from "react";

export type UIMode = "auto" | "manual" | "ai";

type Command =
    | { type: "mode"; value: "AUTO" | "MANUAL" | "AI" }
    | { type: "power"; value: boolean };

export function ControlPanelKW({
                                   mode,
                                   setMode,
                                   powerOn,
                                   setPowerOn,
                                   timestamp,
                                   onCommand,
                               }: {
    mode: UIMode;
    setMode: (m: UIMode) => void;
    powerOn: boolean;
    setPowerOn: (b: boolean) => void | Promise<void>;
    timestamp?: string;
    onCommand?: (cmd: Command) => void;
}) {
    const Pill = ({
                      label,
                      active,
                      onClick,
                  }: {
        label: string;
        active: boolean;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className={
                "h-9 px-4 rounded-full border text-sm font-semibold transition " +
                (active
                    ? "bg-blue-700 text-white border-blue-700"
                    : "bg-white/80 text-blue-700 border-blue-300 hover:bg-white")
            }
        >
            {label}
        </button>
    );

    // ✅ 공기지능은 이벤트만 올린다(실제 토글/Flask 호출은 ControlPage가 담당)
    const handleAI = () => {
        onCommand?.({ type: "mode", value: "AI" });
    };

    const handleAuto = () => {
        setMode("auto");
        onCommand?.({ type: "mode", value: "AUTO" });
    };

    const handleManual = () => {
        setMode("manual");
        onCommand?.({ type: "mode", value: "MANUAL" });
    };

    const handlePower = () => {
        const next = !powerOn;
        setPowerOn(next);
        onCommand?.({ type: "power", value: next });
    };

    return (
        <div className="flex items-center justify-end gap-3">
            <div className="px-4 h-9 grid place-items-center rounded-full bg-white/70 border text-blue-900 shadow-sm">
                {timestamp ?? ""}
            </div>
            <Pill label="공기지능" active={mode === "ai"} onClick={handleAI} />
            <Pill label="자동" active={mode === "auto"} onClick={handleAuto} />
            <Pill label="수동" active={mode === "manual"} onClick={handleManual} />
            <button
                onClick={handlePower}
                className={
                    "w-12 h-12 grid place-items-center rounded-full border-2 shadow transition " +
                    (powerOn
                        ? "bg-blue-800 text-white border-blue-900"
                        : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50")
                }
                aria-label={powerOn ? "전원 끄기" : "전원 켜기"}
            >
                <Power className="w-5 h-5" />
            </button>
        </div>
    );
}

export default ControlPanelKW;
