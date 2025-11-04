// src/pages/auth/SignupPage.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, USER_API } from "@/lib/api";   // ✅ 상수 가져오기

function pickMessage(payload: any): string {
    if (!payload) return "알 수 없는 응답입니다.";
    if (typeof payload === "string") return payload;
    if (typeof payload === "number" || typeof payload === "boolean") return String(payload);
    if (payload.message) return String(payload.message);
    if (payload.error) return String(payload.error);
    if (payload.detail) return String(payload.detail);
    try {
        const entries = Object.entries(payload).map(([k, v]) => `${k}: ${v as any}`);
        if (entries.length) return entries.join("\n");
    } catch {}
    try { return JSON.stringify(payload); } catch { return String(payload); }
}

export default function SignupPage() {
    const [id, setId] = useState("");
    const [name, setName] = useState("");        // → nickname
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [email, setEmail] = useState("");      // 선택값이라면 빈 문자열 허용
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function checkDuplicate() {
        try {
            const { data } = await api.post(USER_API.checkDuplicate, {   // ✅ 경로 수정
                id,
                email: email || undefined,
                nickname: name,
            });
            console.log("dup-check:", data);
            return true;
        } catch (err: any) {
            const msg = pickMessage(err?.response?.data) || "중복 확인 실패";
            alert(msg);
            return false;
        }
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agree)               return alert("약관에 동의해 주세요.");
        if (!id || !name || !pw)  return alert("필수 정보를 모두 입력해 주세요.");
        if (pw !== pw2)           return alert("비밀번호가 일치하지 않습니다.");

        try {
            setLoading(true);

            // 1) 중복 확인
            const ok = await checkDuplicate();
            if (!ok) { setLoading(false); return; }

            // 2) 실제 가입 요청
            const body = {
                id,
                password: pw,
                email: email || undefined,
                nickname: name,
            };

            const res = await api.post(USER_API.signup, body);            // ✅ 경로 수정
            alert(pickMessage(res?.data) || "회원가입이 완료되었습니다. 로그인해 주세요.");
            navigate("/auth/login", { replace: true });

        } catch (err: any) {
            const status = err?.response?.status;
            const raw    = err?.response?.data;
            const msg =
                pickMessage(raw) ||
                pickMessage(err?.message) ||
                "회원가입 중 오류가 발생했습니다.";
            console.error("[signup error]", { status, raw, err });
            const extra =
                (raw?.cause || raw?.trace || raw?.error) &&
                `\n\n(원인 단서)\n${(raw.cause || raw.trace || raw.error).toString().slice(0, 300)}…`;
            alert(`${msg}${extra || ""}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        /* 기존 UI 그대로 */
        <div className="fixed inset-0 bg-[#EEF3FB] flex items-center justify-center p-6">
            <Card className="w-full md:max-w-[720px] lg:max-w-[960px] shadow-2xl border-slate-200/80 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#3F8DF0] to-[#6AA9FF] text-white p-10">
                        <div className="text-3xl font-bold leading-tight">회원가입</div>
                        <p className="mt-3 text-white/90">SEMS의 모든 기능을 사용해 보세요.</p>
                    </div>

                    <CardContent className="p-7 md:p-10">
                        <div className="mb-8">
                            <h1 className="text-2xl font-semibold text-slate-900">회원가입</h1>
                            <p className="text-sm text-slate-500 mt-1">필수 정보를 입력해 주세요.</p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            {/* ... 기존 입력 UI 그대로 ... */}
                            <div>
                                <label className="text-sm font-medium text-slate-800">아이디 *</label>
                                <Input className="h-11 mt-2" placeholder="your-id" value={id} onChange={(e) => setId(e.target.value)} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-800">이름 *</label>
                                <Input className="h-11 mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-800">비밀번호 *</label>
                                    <Input type="password" className="h-11 mt-2" placeholder="8자 이상" value={pw} onChange={(e) => setPw(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-800">비밀번호 확인 *</label>
                                    <Input type="password" className="h-11 mt-2" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-800">이메일 (선택)</label>
                                <Input className="h-11 mt-2" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
                                이용약관 및 개인정보 처리방침에 동의합니다.
                            </label>

                            <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
                                <UserPlus className="h-4 w-4" />
                                {loading ? "가입 중..." : "가입하기"}
                            </Button>

                            <p className="text-center text-sm text-slate-600">
                                이미 계정이 있으신가요?{" "}
                                <Link to="/auth/login" className="text-[#3F8DF0] hover:opacity-80 font-medium">로그인</Link>
                            </p>
                        </form>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
