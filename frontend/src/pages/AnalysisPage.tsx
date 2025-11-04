// src/pages/AnalysisPage.tsx
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/layout/Header";
import AnalysisDashboard from "@/pages/GraphAnalysis"; // ← /analysis/raw에서 잘 뜨던 그 컴포넌트 그대로 사용

export default function AnalysisPage() {
    return (
        <div className="flex h-screen">
            <Sidebar /> {/* 기존 사이드바 재사용 */}  {/* :contentReference[oaicite:0]{index=0} */}

            <div className="flex flex-col flex-1">
                <Header left="분석" center="그래프분석" user="kw1@korea.kr" /> {/* 기존 헤더 재사용 */}  {/* :contentReference[oaicite:1]{index=1} */}

                {/* ✅ 여기서 '대시보드 영역'은 Monitoring/Control과 같은 규칙을 따르도록
            별도 max-w, px-*, py-* 같은 하드코딩 컨테이너를 두지 않는다. */}
                <main className="flex-1 overflow-auto">
                    <AnalysisDashboard /> {/* /analysis/raw에서 보던 그 그래프 UI를 그대로 삽입 */}
                </main>
            </div>
        </div>
    );
}
