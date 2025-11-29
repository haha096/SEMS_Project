import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

function setFlashDenied(message: string, code: string) {
    sessionStorage.setItem("lastDeniedMsg", message);
    sessionStorage.setItem("lastDeniedCode", code);
    sessionStorage.setItem("lastDeniedId", Date.now().toString());
}

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return;

        // ✅ 비로그인 상태
        if (!user) {
            setFlashDenied("로그인이 필요합니다. 관리자 전용 페이지입니다.", "UNAUTHORIZED");
            navigate("/monitoring?denied=1", { replace: true, state: { from: location } });
            return;
        }

        // ✅ 일반 사용자
        if (!user.isAdmin) {
            setFlashDenied("관리자 로그인이 필요합니다.", "ADMIN_ONLY");
            navigate("/monitoring?denied=1", { replace: true, state: { from: location } });
            return;
        }
    }, [loading, user, navigate, location]);

    if (loading) return null;
    if (!user || !user.isAdmin) return null;

    return <>{children}</>;
};

export default RequireAdmin;
