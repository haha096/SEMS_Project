// src/pages/Health.tsx
import { useState } from "react";
import { SPRING_API, FLASK_API } from "@/lib/http";

export default function Health() {
    const [spring, setSpring] = useState<string>("-");
    const [flask, setFlask] = useState<string>("-");

    const ping = async () => {
        try { await SPRING_API.get("/actuator/health"); setSpring("OK"); }
        catch (e:any) { setSpring("ERR " + (e.status||"")); }

        try { await FLASK_API.get("/health"); setFlask("OK"); }
        catch (e:any) { setFlask("ERR " + (e.status||"")); }
    };

    return (
        <div style={{padding:16}}>
            <h1>Health Check</h1>
            <button onClick={ping}>백엔드 연결 테스트</button>
            <div style={{marginTop:12}}>
                <div>Spring: {spring}</div>
                <div>Flask: {flask}</div>
            </div>
        </div>
    );
}
