// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import MonitoringPage from "./pages/MonitoringPage";
import ControlPage from "./pages/ControlPage";
import AnalysisPage from "@/pages/AnalysisPage";
import AnalysisDashboard from "@/pages/GraphAnalysis"; // raw 확인용
import LoginPage from "@/pages/auth/LoginPage";
import FindIdPage from "@/pages/auth/FindIdPage";
import FindPasswordPage from "@/pages/auth/FindPasswordPage";
import SignupPage from "@/pages/auth/SignupPage";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/monitoring" replace />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/control" element={<ControlPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/analysis/raw" element={<AnalysisDashboard />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/find-id" element={<FindIdPage />} />
            <Route path="/auth/find-password" element={<FindPasswordPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
        </Routes>
    );
}
