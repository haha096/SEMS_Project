import { SPRING_API, FLASK_API } from "@/lib/http";

function parse(raw: any) {
    try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
    catch { return []; }
}

export async function fetchAnalysis({ from, to }: { from: string; to?: string }) {
    const [trows, hrows, pm25rows, pm10rows] = await Promise.all([
        FLASK_API.get("", { params: { type: "temperature", start: from, end: to }, transformResponse: [(r)=>parse(r)] }),
        FLASK_API.get("", { params: { type: "humidity", start: from, end: to }, transformResponse: [(r)=>parse(r)] }),
        FLASK_API.get("", { params: { type: "dust", start: from, end: to }, transformResponse: [(r)=>parse(r)] }),
        SPRING_API.get("/environment", { params: { start: from, end: to }, transformResponse: [(r)=>parse(r)] }),
    ]);

    // timestamp 병합
    const map = new Map();
    const merge = (rows:any[], src:string, key:string) => {
        for(const r of rows){
            const t = new Date(r.timestamp?.replace(" ","T")).getTime();
            if(!Number.isFinite(t)) continue;
            const base = map.get(t) || { t, ts: new Date(t).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}) };
            base[key] = Number(r[src]) || base[key];
            map.set(t, base);
        }
    };

    merge(trows.data, "avg_temperature", "temp");
    merge(hrows.data, "avg_humidity", "rh");
    merge(pm25rows.data, "avg_dust", "pm25");
    merge(pm10rows.data, "dust", "pm10");

    return Array.from(map.values()).sort((a,b)=>a.t-b.t);
}

export { fetchAnalysis as fetchAnalysisData };