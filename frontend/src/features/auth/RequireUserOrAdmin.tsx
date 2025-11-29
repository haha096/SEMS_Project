import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

/** RequireAdmin과 동일한 flash 유틸을 재사용하거나, 아래를 공통 util로 빼도 됩니다. */
function setFlashDenied(message: string, code: string) {
    sessionStorage.setItem("lastDeniedMsg", message);
    sessionStorage.setItem("lastDeniedCode", code);
    sessionStorage.setItem("lastDeniedId", Date.now().toString());
}

/** USER 또는 ADMIN만 접근 허용 */
const RequireUserOrAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth(); // AuthContext 제공 값 사용 :contentReference[oaicite:2]{index=2}
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return;

        // 비로그인 차단
        if (!user) {
            setFlashDenied("로그인이 필요합니다.", "UNAUTHORIZED");
            navigate("/monitoring?denied=1", { replace: true, state: { from: location } });
            return;
        }

        // USER/ADMIN만 허용 → 그 외 역할이 있는 경우 대비
        const can = user.isAdmin || true; // 현재 모델에선 일반 사용자는 user가 존재하면 됨
        if (!can) {
            setFlashDenied("접근 권한이 없습니다.", "FORBIDDEN");
            navigate("/monitoring?denied=1", { replace: true, state: { from: location } });
        }
    }, [loading, user, navigate, location]);

    if (loading) return null;
    if (!user) return null;

    return <>{children}</>;
};

export default RequireUserOrAdmin;
