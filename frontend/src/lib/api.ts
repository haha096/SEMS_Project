import axios from "axios";

export const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

export const USER_API = {
    me: "/auth/me",
    tokenLogin: "/auth/token-login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    signup: "/auth/signup",
    checkDuplicate: "/auth/check-duplicate",
    findId: "/auth/find-id",
    findPassword: "/auth/find-password",
};

// ---- 🔧 HashRouter/BrowserRouter 모두 지원하는 헬퍼 ----
function currentPath(): string {
    // HashRouter면 "/#/monitoring?x=y" 형태 → hash 없이 path만 추출
    if (location.hash && location.hash.startsWith("#/")) {
        const hashPath = location.hash.slice(1); // "#/..." → "/..."
        const qIdx = hashPath.indexOf("?");
        return qIdx >= 0 ? hashPath.slice(0, qIdx) : hashPath;
    }
    // BrowserRouter
    return location.pathname;
}

function spaNavigate(path: string) {
    // HashRouter인 경우, path 앞에 "#"
    const isHash = !!(location.hash && location.hash.startsWith("#/"));
    const target = isHash ? `#${path}` : path;
    const here = isHash
        ? (location.hash.slice(1) || "/")
        : location.pathname;

    if (here === path) return;
    history.pushState({}, "", target);
    dispatchEvent(new PopStateEvent("popstate"));
}

// 공개 페이지 (401이어도 로그인으로 보내지 않음)
const PUBLIC_PATHS = [
    "/monitoring",
    "/auth/login",
    "/auth/signup",
    "/auth/find-id",
    "/auth/find-password",
];

let redirecting = false;

// ---- 🔧 flash 메시지 저장 유틸 ----
function setFlash(key: "lastDenied" | "lastAuth", payload: { code?: string; message: string }) {
    const id = Date.now().toString();
    sessionStorage.setItem(`${key}Id`, id);
    sessionStorage.setItem(`${key}Msg`, payload.message);
    if (payload.code) sessionStorage.setItem(`${key}Code`, payload.code);
}

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        const payload = err?.response?.data;
        const reqUrl: string | undefined = err?.config?.url;
        const here = currentPath();

        if (redirecting) return Promise.reject(err);

        // 401: 보호 페이지에서만 로그인으로
        if (status === 401) {
            const msg = payload?.message || "로그인이 필요합니다.";
            const isMeCheck = reqUrl?.includes(USER_API.me);
            const onPublic = PUBLIC_PATHS.some((p) => here.startsWith(p));
            if (isMeCheck || onPublic) {
                return Promise.reject(err);
            }
            setFlash("lastAuth", { message: msg });
            redirecting = true;
            spaNavigate("/auth/login?reason=unauth");
            setTimeout(() => (redirecting = false), 800);
            return Promise.reject(err);
        }

        // 403: 관리자 전용 등 권한 부족 → 모니터링으로 이동 + 이유 표시
        if (status === 403) {
            const msg = payload?.message || "접근 권한이 없습니다.";
            const code = payload?.code || "FORBIDDEN";
            setFlash("lastDenied", { code, message: msg });

            if (!here.startsWith("/monitoring")) {
                redirecting = true;
                // 쿼리스트링은 신호만 주는 용도(배너 표시는 sessionStorage로)
                spaNavigate("/monitoring?denied=1");
                setTimeout(() => (redirecting = false), 800);
            }
            return Promise.reject(err);
        }

        return Promise.reject(err);
    }
);
