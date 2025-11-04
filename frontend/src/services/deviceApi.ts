// src/services/deviceApi.ts
// ControlPage/WindCard에서 참조하던 서비스 계층 복구본
// - setPower(on) : 전원 on/off
// - setFanLevel(level) : 수동 풍량 적용
// - (선택) getMotorState() : 필요 시 현재 상태 조회

export type FanLevel = 1 | 2 | 3;

// 프록시 사용 시 빈 문자열로 동작 (Vite dev에서 /api → 8080 프록시)
const BASE =
    (import.meta as any).env?.VITE_SPRING_BASE ??
    (typeof window !== "undefined" ? "" : "http://localhost:8080");

/** 전원 on/off */
export async function setPower(on: boolean): Promise<void> {
    const r = await fetch(`${BASE}/api/motor/power`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on }),
    });
    const t = await r.text();
    console.info("[deviceApi] → POST /api/motor/power", r.status, t);
    if (!r.ok) throw new Error(t || "setPower failed");
}

/** 수동 풍량(level 1~3) 적용 */
export async function setFanLevel(level: FanLevel): Promise<void> {
    const r = await fetch(`${BASE}/api/motor/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
    });
    const t = await r.text();
    console.info("[deviceApi] → POST /api/motor/manual", r.status, t);
    if (!r.ok) throw new Error(t || "setFanLevel failed");
}

/** (선택) 현재 상태 조회가 필요하면 사용 */
export async function getMotorState(): Promise<{
    mode?: "AUTO" | "MANUAL" | string;
    powerOn?: boolean;
    level?: number;
}> {
    const r = await fetch(`${BASE}/api/motor/auto`, { method: "GET" });
    const txt = await r.text();
    let data: any;
    try { data = JSON.parse(txt); } catch { data = {}; }
    console.info("[deviceApi] → GET /api/motor/auto", r.status, txt);
    // 백엔드가 빈 본문을 주는 경우가 있어도 오류 아님(200이면 OK)
    return typeof data === "object" && data ? data : {};
}
