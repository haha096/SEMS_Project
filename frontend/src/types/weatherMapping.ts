// src/types/weatherMapping.ts
export function codeToLabel(code?: string | number) {
    const c = Number(code);
    if (Number.isNaN(c)) return "—";
    if (c === 0) return "맑음";
    if (c === 1) return "대체로 맑음";
    if (c === 2) return "부분적 흐림";
    if (c === 3) return "흐림";
    if ([45, 48].includes(c)) return "안개";
    if ([51, 53, 55].includes(c)) return "이슬비";
    if ([56, 57].includes(c)) return "착빙 이슬비";
    if ([61, 63, 65].includes(c)) return "비";
    if ([66, 67].includes(c)) return "착빙 비";
    if ([71, 73, 75].includes(c)) return "눈";
    if (c === 77) return "싸락눈";
    if ([80, 81, 82].includes(c)) return "소나기";
    if ([85, 86].includes(c)) return "소낙눈";
    if (c === 95) return "뇌우";
    if ([96, 99].includes(c)) return "뇌우/우박";
    return "—";
}

export function codeToEmoji(code?: string | number) {
    const c = Number(code);
    if (Number.isNaN(c)) return "—";
    if (c === 0) return "☀️";
    if (c === 1) return "🌤️";
    if (c === 2) return "⛅";
    if (c === 3) return "☁️";
    if ([61, 63, 65, 80, 81, 82].includes(c)) return "🌧️";
    if ([71, 73, 75, 85, 86].includes(c)) return "🌨️";
    if ([95, 96, 99].includes(c)) return "⛈️";
    if ([45, 48].includes(c)) return "🌫️";
    return "🌡️";
}
