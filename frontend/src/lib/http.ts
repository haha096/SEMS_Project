// src/lib/http.ts
import axios from "axios";

// ✅ 프록시 강제 사용 → CORS 차단 안 생김
export const SPRING_API = axios.create({
    baseURL: "/api",
    timeout: 10000,
});

export const FLASK_API = axios.create({
    baseURL: "/table",
    timeout: 10000,
});

const tag = (t: string) => (r: any) => {
    console.log(`[${t}]`, r.method?.toUpperCase(), (r.baseURL || "") + (r.url || ""));
    return r;
};
SPRING_API.interceptors.request.use(tag("SPRING"));
FLASK_API.interceptors.request.use(tag("FLASK"));
