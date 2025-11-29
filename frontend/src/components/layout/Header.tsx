// src/components/Header.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

export default function Header({
                                   left = "공기 가전 제어",
                                   center = "환기청정기 제어",
                               }: {
    left?: string;
    center?: string;
}) {
    const navigate = useNavigate();
    const { user, loading, isAuthenticated, logout } = useAuth(); // ★ logout 추가

    const handleLogout = async () => {
        try {
            await logout(); // 세션 삭제 (AuthContext에서 session.invalidate() 호출)
            // 페이지 이동 없이 상태만 초기화됨
        } catch (err) {
            console.error("로그아웃 실패:", err);
        }
    };

    return (
        <div className="w-full bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
            {/* 좌측 텍스트 */}
            <div className="text-sm font-medium text-slate-700">{left}</div>

            {/* 중앙 타이틀 */}
            <div className="text-lg font-semibold">{center}</div>

            {/* 우측 로그인/로그아웃 영역 */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-slate-400">로그인:</span>

                {/* 이메일 표시 영역 */}
                <div className="flex items-center gap-1 border px-3 py-1 rounded-full bg-slate-50 min-w-[160px] justify-center">
                    {loading ? (
                        <span className="text-slate-400">확인 중…</span>
                    ) : isAuthenticated && user ? (
                        <span className="font-medium truncate">{user.email}</span>
                    ) : (
                        <button
                            onClick={() => navigate("/auth/login")}
                            className="text-blue-600 hover:underline"
                        >
                            로그인
                        </button>
                    )}
                </div>

                {/* 로그인 상태일 때만 로그아웃 버튼 */}
                {isAuthenticated && !loading && (
                    <button
                        onClick={handleLogout}
                        className="px-3 py-1 rounded-md border hover:bg-slate-50 transition text-slate-700"
                    >
                        로그아웃
                    </button>
                )}
            </div>
        </div>
    );
}
