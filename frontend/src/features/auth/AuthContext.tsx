import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import { api, USER_API } from "@/lib/api";

type SessionUser = {
    userId: string;
    nickname: string;
    email: string;
    isAdmin: boolean;
};

type Ctx = {
    user: SessionUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (id: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);

    /** ✅ /api/auth/me 요청 → ACCESS 쿠키 기반으로 사용자 확인 */
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(USER_API.me);
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    /** mount 시 최초 인증상태 갱신 */
    useEffect(() => {
        refresh();
    }, [refresh]);

    /** ✅ 로그인 → /api/auth/token-login */
    const login = useCallback(
        async (id: string, password: string) => {
            await api.post(USER_API.tokenLogin, { id, password }); // ACCESS + REFRESH 쿠키 내려옴
            await refresh();                                       // 사용자 새로고침
        },
        [refresh]
    );

    /** ✅ 로그아웃 */
    const logout = useCallback(async () => {
        try {
            await api.post(USER_API.logout);
        } catch {}
        setUser(null);
    }, []);

    const value: Ctx = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refresh,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
