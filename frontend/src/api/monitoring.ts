// src/api/monitoring.ts
import { SPRING_API } from "@/lib/http";

// 문자열이면 JSON 시도
function parseMaybeString(raw: any) {
    try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
    catch { return raw; }
}

// {data:{...}} / [{...}] / {...} 호환
function unwrap(r: any): any {
    if (!r) return r;
    if (Array.isArray(r)) return r[0] ?? {};
    if (r.data && typeof r.data === "object") return r.data;
    return r;
}

/**
 * 키 이름(정규식)에 "맞는 키의 값"만 숫자로 추출.
 * - 객체 전체를 훑어 '첫 숫자'를 줍는 폴백은 제거(오탐 방지)
 * - 배열은 재귀 탐색 (프레임 배열 대응)
 */
function deepFindNumber(obj: any, keyRegex: RegExp): number | undefined {
    if (obj == null) return undefined;

    if (typeof obj === "number") return obj;
    if (typeof obj === "string") {
        const n = Number(obj);
        return Number.isFinite(n) ? n : undefined;
    }

    if (Array.isArray(obj)) {
        for (const it of obj) {
            const v = deepFindNumber(it, keyRegex);
            if (v != null) return v;
        }
        return undefined;
    }

    if (typeof obj === "object") {
        // 현재 레벨의 "키 이름"으로만 탐색 (오탐 차단)
        for (const [k, v] of Object.entries(obj)) {
            if (keyRegex.test(k)) {
                const n =
                    typeof v === "number" ? v :
                        typeof v === "string" ? Number(v) :
                            deepFindNumber(v as any, keyRegex);
                if (n != null && Number.isFinite(n)) return n;
            }
        }
    }
    return undefined;
}

// 변형 표기/한글까지 포괄
const RE_PM10 = /\b(pm10|pm_?10|pm-?10|pm\s*10|coarse|미세먼지)\b/i;
const RE_PM25 = /\b(pm2[._-\s]?5|pm25|pm_?25|fine|초미세먼지)\b/i;
const RE_TEMP = /\b(temp|temperature|t_deg|t_c|temperaturec)\b|온도/i;
const RE_RH   = /\b(rh|hum|humid|humidity|relative[_-]?humidity)\b|습도/i;

export async function fetchMonitoring() {
    const res = await SPRING_API.get("/sensor/latest", {
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
        transformResponse: [(raw) => parseMaybeString(raw)],
    });

    const rawObj = unwrap(res.data);
    console.log("[MON raw]", rawObj);

    // ❗ PM10 은 dust 폴백 금지 (PM2.5와 값이 같아지는 현상 방지)
    const pm10 =
        deepFindNumber(rawObj, RE_PM10) ?? 0;

    // PM2.5 는 표준 키가 없을 때 dust 를 마지막 폴백으로 허용
    let pm25 =
        deepFindNumber(rawObj, RE_PM25) ?? 0;

    if (!pm25) {
        // 'dust'가 사실 PM2.5 를 의미하는 센서일 때만 폴백 허용
        const dust = deepFindNumber(rawObj, /\bdust\b/i);
        if (Number.isFinite(dust) && !pm10) pm25 = Number(dust);
    }

    const temp =
        deepFindNumber(rawObj, RE_TEMP) ?? 0;

    const rh =
        deepFindNumber(rawObj, RE_RH) ?? 0;

    return {
        updatedAt: new Date().toISOString(),
        raw: { pm10, pm25, temp, rh },
    };
}

// 호환용
export { fetchMonitoring as fetchMonitoringData };
