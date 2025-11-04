// src/lib/scoring.ts

// ━━━━━━━━━ 공통 유틸(튜플 친화 타입) ━━━━━━━━━
type Tuple2 = readonly [number, number];
type BpArray = ReadonlyArray<Tuple2>; // readonly [number, number][]

// 선형보간 (경계밖 clamp)
function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
    if (x0 === x1) return y0;
    const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
    return y0 + t * (y1 - y0);
}

// 다구간(piecewise) 점수화
function piecewiseScore(x: number, points: BpArray): number {
    if (points.length === 0) return 0;
    if (x <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        if (x <= x1) return lerp(x, x0, x1, y0, y1);
    }
    return points[points.length - 1][1];
}

// ━━━━━━━━━ 타입 ━━━━━━━━━
export type FacilityType = "school" | "hospital" | "office" | "home";
export type SeasonMode   = "summer" | "winter" | "neutral";

export type Scorers = {
    scorePM25(v: number): number;
    scorePM10(v: number): number;
    scoreTemp(v: number): number;
    scoreRH(v: number): number;
    scoreCICI(pm25s: number, pm10s: number, temps: number, rhs: number): number;
    weights: { pm25: number; pm10: number; temp: number; rh: number };
};

// ━━━━━━━━━ 점수 밴드/색상 ━━━━━━━━━
export type ScoreBand = "verybad" | "bad" | "normal" | "good";
export function bandOf(score: number): ScoreBand {
    if (score < 50) return "verybad";
    if (score < 80) return "bad";
    if (score < 90) return "normal";
    return "good";
}
export function colorOf(score: number): string {
    switch (bandOf(score)) {
        case "verybad": return "#ef4444";
        case "bad":     return "#fb923c";
        case "normal":  return "#facc15";
        case "good":    return "#10b981";
    }
}
export const SCORE_LEGEND = [
    { label: "매우 나쁨 (0~49)",  color: "#ef4444" },
    { label: "나쁨 (50~79)",      color: "#fb923c" },
    { label: "보통 (80~89)",      color: "#facc15" },
    { label: "좋음 (90~100)",     color: "#10b981" },
] as const;

// ━━━━━━━━━ 브레이크포인트 ━━━━━━━━━
// PM2.5
const PM25_BP = {
    WHO:   [[0,100],[5,95],[10,90],[15,80],[25,60],[35,40],[75,10],[150,0]] as const,
    KR:    [[0,100],[15,90],[35,80],[75,50],[150,20],[250,0]] as const,
    RELAX: [[0,100],[20,90],[40,80],[80,55],[160,25],[300,0]] as const,
};
// PM10
const PM10_BP = {
    WHO:   [[0,100],[15,95],[30,90],[45,80],[80,60],[100,40],[150,10],[300,0]] as const,
    KR:    [[0,100],[30,90],[80,80],[150,50],[300,10],[400,0]] as const,
    RELAX: [[0,100],[40,90],[100,80],[180,55],[320,25],[450,0]] as const,
};

// 온도/습도 쾌적도 (시설/계절별)
type Comfort = { TEMP: BpArray; RH: BpArray };
const COMFORT: Record<FacilityType, Record<SeasonMode, Comfort>> = {
    school: {
        neutral: {
            TEMP: [[16,40],[20,85],[21.5,95],[22.5,100],[24,90],[26,70],[30,20]] as const,
            RH:   [[20,20],[30,60],[40,90],[50,100],[60,90],[70,70],[80,30]] as const,
        },
        summer: {
            TEMP: [[20,30],[23,80],[24.5,95],[26,100],[27,85],[29,60],[32,20]] as const,
            RH:   [[30,50],[40,85],[50,100],[60,90],[70,65],[80,30]] as const,
        },
        winter: {
            TEMP: [[12,20],[18,70],[20,90],[21.5,100],[22.5,95],[24,80],[26,50]] as const,
            RH:   [[20,30],[30,60],[40,95],[45,100],[55,95],[60,80],[70,50]] as const,
        },
    },
    hospital: {
        neutral: {
            TEMP: [[18,40],[21,90],[22,100],[23,95],[24,85],[26,60],[29,30]] as const,
            RH:   [[30,40],[40,85],[45,95],[50,100],[55,95],[60,85],[70,60]] as const,
        },
        summer: {
            TEMP: [[20,40],[23,90],[24,100],[25,95],[26,85],[28,60],[30,30]] as const,
            RH:   [[35,50],[45,90],[50,100],[55,95],[60,85],[70,60]] as const,
        },
        winter: {
            TEMP: [[16,30],[20.5,90],[21.5,100],[22.5,95],[23.5,85],[25,60],[27,30]] as const,
            RH:   [[30,40],[40,90],[45,100],[50,95],[55,85],[60,70]] as const,
        },
    },
    office: {
        neutral: {
            TEMP: [[16,30],[19,70],[21,90],[22,100],[24,90],[26,70],[30,30]] as const,
            RH:   [[20,20],[30,60],[40,90],[50,100],[60,90],[70,70],[80,30]] as const,
        },
        summer: {
            TEMP: [[20,30],[23,80],[24.5,95],[26,100],[27,85],[29,60],[32,20]] as const,
            RH:   [[30,50],[40,85],[50,100],[60,90],[70,65],[80,30]] as const,
        },
        winter: {
            TEMP: [[12,20],[18,70],[20,90],[22,100],[23,90],[25,70],[27,40]] as const,
            RH:   [[20,30],[30,60],[40,95],[50,100],[60,85],[70,55]] as const,
        },
    },
    home: {
        neutral: {
            TEMP: [[14,20],[19,75],[21,90],[23,100],[25,90],[27,70],[31,30]] as const,
            RH:   [[20,20],[30,60],[40,90],[50,100],[60,90],[70,70],[80,30]] as const,
        },
        summer: {
            TEMP: [[20,30],[24,90],[25,100],[26,95],[27,85],[29,60],[32,25]] as const,
            RH:   [[30,50],[40,85],[50,100],[60,90],[70,65],[80,30]] as const,
        },
        winter: {
            TEMP: [[10,10],[17,70],[19,90],[21,100],[22,95],[24,80],[26,50]] as const,
            RH:   [[20,30],[35,70],[45,95],[50,100],[55,95],[60,80],[70,50]] as const,
        },
    },
};

// 종합지수 가중치
const WEIGHTS_MAP: Record<FacilityType, { pm25: number; pm10: number; temp: number; rh: number }> = {
    hospital: { pm25: 0.50, pm10: 0.30, temp: 0.15, rh: 0.05 },
    school:   { pm25: 0.45, pm10: 0.30, temp: 0.15, rh: 0.10 },
    office:   { pm25: 0.40, pm10: 0.30, temp: 0.20, rh: 0.10 },
    home:     { pm25: 0.30, pm10: 0.20, temp: 0.30, rh: 0.20 },
};

// PM 프로파일 (각 항목도 as const 덕분에 BpArray로 추론됨)
const PM_PROFILE: Record<FacilityType, { PM25: BpArray; PM10: BpArray }> = {
    hospital: { PM25: PM25_BP.WHO,   PM10: PM10_BP.WHO   },
    school:   { PM25: PM25_BP.WHO,   PM10: PM10_BP.WHO   },
    office:   { PM25: PM25_BP.KR,    PM10: PM10_BP.KR    },
    home:     { PM25: PM25_BP.RELAX, PM10: PM10_BP.RELAX },
};

// ━━━━━━━━━ 외부 API ━━━━━━━━━
export function buildScorers(facility: FacilityType, season: SeasonMode): Scorers {
    const pm = PM_PROFILE[facility];
    const cf = COMFORT[facility][season];
    const weights = WEIGHTS_MAP[facility];

    const scorePM25 = (v: number) => Math.round(piecewiseScore(v, pm.PM25));
    const scorePM10 = (v: number) => Math.round(piecewiseScore(v, pm.PM10));
    const scoreTemp = (c: number)  => Math.round(piecewiseScore(c, cf.TEMP));
    const scoreRH   = (rh: number) => Math.round(piecewiseScore(rh, cf.RH));
    const scoreCICI = (pm25s: number, pm10s: number, temps: number, rhs: number) =>
        Math.round(weights.pm25*pm25s + weights.pm10*pm10s + weights.temp*temps + weights.rh*rhs);

    return { scorePM25, scorePM10, scoreTemp, scoreRH, scoreCICI, weights };
}
