// src/lib/api.ts
import axios from "axios";

export const api = axios.create({
    baseURL: "/",
    withCredentials: true,
});

export const USER_API = {
    // 세션/로그인/로그아웃
    session: "/api/auth/session",
    login: "/api/auth/login",
    logout: "/api/auth/logout",

    // ✅ 회원가입 관련
    checkDuplicate: "/api/auth/check-duplicate",
    signup: "/api/auth/signup",

    // ✅ 계정 찾기/비번 재설정(백엔드 구현 경로 기준)
    findId: "/api/auth/find-id",
    passwordReset: "/api/auth/password-reset",

    // (휴대폰 SMS용 엔드포인트가 백엔드에 없다면 만들지 말 것)
    // passwordResetSms: "/api/auth/password-reset/sms",
};
