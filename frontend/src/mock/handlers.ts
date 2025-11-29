// src/mock/handlers.ts
import { http, HttpResponse } from "msw";

type EnvDTO = {
    timestamp: string;
    temperature: number;
    humidity: number;
    dust: number; // PM2.5
};

// 현실감 있는 값 (원하면 상수로 바꿔도 됨)
let t = 24.0, h = 45.0, pm = 8.0;
const rw = (v: number, step: number, min: number, max: number) =>
    Number(Math.max(min, Math.min(max, v + (Math.random() - 0.5) * step * 2)).toFixed(1));
setInterval(() => {
    const s = Date.now() / 1000;
    t = rw(24 + Math.sin(s / 120) * 1.5, 0.3, 18, 30);
    h = rw(45 + Math.sin(s / 160) * 5, 1.0, 25, 75);
    pm = rw(pm, 2.0, 2, 120);
    if (Math.random() < 0.02) pm = Math.min(180, pm + 40);
}, 3000);

// 실제 프론트 fetch 경로와 "정확히 동일"
const PATH = "/api/environment/latest";

function payload(): EnvDTO {
    return {
        timestamp: new Date().toISOString(),
        temperature: t,
        humidity: h,
        dust: pm,
    };
}

// *** 절대경로/상대경로 둘 다 등록해서 미스매치 여지 제거 ***
export const handlers = [
    http.get(PATH, ({ request }) => {
        console.log("[MSW] hit:", request.url);
        return HttpResponse.json(payload());
    }),
    http.get(`http://localhost:5173${PATH}`, ({ request }) => {
        console.log("[MSW] hit(abs):", request.url);
        return HttpResponse.json(payload());
    }),
];
