// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import MonitoringPage from "./pages/MonitoringPage";
import ControlPage from "./pages/ControlPage";
import AnalysisPage from "@/pages/AnalysisPage";
import AnalysisDashboard from "@/pages/GraphAnalysis";
import LoginPage from "@/pages/auth/LoginPage";
import FindIdPage from "@/pages/auth/FindIdPage";
import FindPasswordPage from "@/pages/auth/FindPasswordPage";
import SignupPage from "@/pages/auth/SignupPage";
import RequireAdmin from "@/features/auth/RequireAdmin"; // ★ 추가
import RequireUserOrAdmin from "@/features/auth/RequireUserOrAdmin"; // ★ 신규
import InquiryEntry from "@/features/inquiry/InquiryEntry";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/monitoring" replace />} />

            {/* 공개: 모니터링(비로그인/일반/관리자 모두 접근) */}
            <Route path="/monitoring" element={<MonitoringPage />} />


            {/* 사용자/관리자 전용: 관리자 문의하기 (임시 페이지) */}
            <Route
                path="/inquiry"
                element={
                    <RequireUserOrAdmin>
                        <InquiryEntry />
                    </RequireUserOrAdmin>
                }
            />

            {/* 관리자 전용: 제어/분석 */}
            <Route
                path="/control"
                element={
                    <RequireAdmin>
                        <ControlPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/analysis"
                element={
                    <RequireAdmin>
                        <AnalysisPage />
                    </RequireAdmin>
                }
            />
            <Route
                path="/analysis/raw"
                element={
                    <RequireAdmin>
                        <AnalysisDashboard />
                    </RequireAdmin>
                }
            />

            {/* 인증 관련 */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/find-id" element={<FindIdPage />} />
            <Route path="/auth/find-password" element={<FindPasswordPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
        </Routes>
    );
}
