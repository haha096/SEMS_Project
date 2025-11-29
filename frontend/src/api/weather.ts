// src/api/weather.ts
import { SPRING_API } from "@/lib/http";

/** 문자열이면 JSON 파싱 시도 */
function parseMaybeString(raw: any) {
    try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
    catch { return raw; }
}

/** {data:{...}} / [{...}] / {...} 형태 호환 */
function unwrap(r: any): any {
    if (!r) return r;
    if (Array.isArray(r)) return r[0] ?? {};
    if (r.data && typeof r.data === "object") return r.data;
    return r;
}

/**
 * 키 이름(정규식)과 일치하는 값만 숫자로 추출.
 * - 객체 전체를 무작정 훑어 ‘첫 숫자’를 줍는 폴백은 제거(오탐 방지)
 * - 배열은 재귀 탐색
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

/** 바람 방향(도) → 16방위 문자열 */
function degToDir(d: number): string {
    if (!Number.isFinite(d)) return "";
    const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    const idx = Math.round((d % 360) / 22.5) % 16;
    return dirs[idx];
}

/** open-meteo WMO weather code → 카테고리 문자열 (아이콘 용) */
function toCategoryFromOpenMeteo(codeLike: unknown): string {
    const c = Number(codeLike);
    if ([0, 1].includes(c)) return "Clear";           // 맑음
    if ([2, 3].includes(c)) return "Clouds";          // 구름
    if ([45, 48].includes(c)) return "Fog";           // 안개
    if ((c >= 51 && c <= 57) || (c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return "Rain";
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "Snow";
    if (c >= 95 && c <= 99) return "Thunder";
    return "Clouds"; // 기본값
}

/** 키 정규식(한글 포함) */
const RE_TEMP = /\b(temp|temperature|t_deg|t_c|temperaturec)\b|온도/i;
const RE_RH   = /\b(hum|humid|humidity|rh|relative[_-]?humidity)\b|습도/i;
const RE_WSPD = /\b(wind[_-]?speed|ws|windspeed)\b|풍속/i;
const RE_WDIR = /\b(wind[_-]?dir|winddirection|wd)\b|풍향/i;
const RE_CODE = /\b(weather|code|wmo[_-]?code)\b/i;
const RE_DIST = /\b(district|region|area|city)\b|행정동|법정동|동/i;

/**
 * 실외 날씨 조회
 * - 기본 좌표(nx, ny)는 58, 125 (서울권 예시)
 * - Sidebar 등에서 좌표 변환이 아직 없으면 인자 없이 호출하면 됨
 */
export async function fetchWeather(nx: number = 58, ny: number = 125) {
    const res = await SPRING_API.get("/weather/outdoor", {
        params: { nx, ny },
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
        transformResponse: [(raw) => parseMaybeString(raw)],
    });

    const raw = unwrap(res.data);
    console.log("[WEATHER raw]", raw);

    // 숫자 추출
    const temp      = deepFindNumber(raw, RE_TEMP) ?? 0;
    const humidity  = deepFindNumber(raw, RE_RH) ?? 0;
    const windSpeed = deepFindNumber(raw, RE_WSPD) ?? 0;

    // 풍향: 숫자(도) → 16방위, 이미 "NW"/"SE" 같이 문자열이면 그대로 사용
    let windDir = "";
    const wdirNum = deepFindNumber(raw, RE_WDIR);
    if (typeof raw?.windDir === "string") {
        windDir = raw.windDir;
    } else if (Number.isFinite(wdirNum)) {
        windDir = degToDir(Number(wdirNum));
    }

    // 행정구/지역명 (있으면 표시용으로 사용)
    const district =
        (typeof raw?.district === "string" && raw.district) ||
        (typeof raw?.region === "string"   && raw.region)   ||
        (typeof raw?.area === "string"     && raw.area)     ||
        (typeof raw?.city === "string"     && raw.city)     ||
        "";

    // 아이콘 카테고리
    const weatherCat =
        (typeof raw?.weather === "string" && raw.weather) // 이미 카테고리면 그대로
        || toCategoryFromOpenMeteo(
            deepFindNumber(raw, RE_CODE) ?? raw.code ?? raw.wmoCode ?? 3
        );

    return {
        district,
        temp,
        humidity,
        windSpeed,
        windDir,
        weather: weatherCat,
    };
}

// 호환용 별칭
export { fetchWeather as fetchWeatherData };
