import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, USER_API } from "@/lib/api";

type SessionUser = { userId: string; nickname: string; email: string; isAdmin: boolean };

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

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(USER_API.session); // 200: { userId, nickname, email, isAdmin }
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const login = useCallback(async (id: string, password: string) => {
        await api.post(USER_API.login, { id, password }); // ★ 백엔드는 id+password로 검증
        await refresh();
    }, [refresh]);

    const logout = useCallback(async () => {
        try { await api.post(USER_API.logout); } catch {}
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
