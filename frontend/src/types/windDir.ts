// 풍향 코드 → 한글 변환 (8방위 단순화 버전)
export function windDirToKorean(code: string): string {
    const mapping: Record<string, string> = {
        N: "북풍",
        NNE: "북동풍", NE: "북동풍", ENE: "북동풍",
        E: "동풍",
        ESE: "남동풍", SE: "남동풍", SSE: "남동풍",
        S: "남풍",
        SSW: "남서풍", SW: "남서풍", WSW: "남서풍",
        W: "서풍",
        WNW: "북서풍", NW: "북서풍", NNW: "북서풍",
    };

    return mapping[code] || code;
}
