import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { User, LockKeyhole, LogIn } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext"; // ★ 추가

export default function LoginPage() {
    const [id, setId] = useState("");
    const [pw, setPw] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);   // ★ 추가
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from || "/monitoring";
    const { login } = useAuth();                           // ★ 추가

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !pw) return alert("아이디와 비밀번호를 입력해 주세요.");
        try {
            setLoading(true);
            setErr(null);
            await login(id, pw);                               // ★ 세션 로그인 호출 (쿠키 생성)
            // remember 체크는 세션 방식에선 서버/세션정책에 따름. 필요 시 별도 엔드포인트/지속시간 정책과 연동
            navigate(from, { replace: true });
        } catch (e: any) {
            setErr(e?.response?.data?.message || "로그인에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#EEF3FB] flex items-center justify-center p-6">
            <Card className="w-full md:max-w-[720px] lg:max-w-[960px] shadow-2xl border-slate-200/80 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Left brand panel */}
                    <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#3F8DF0] to-[#6AA9FF] text-white p-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm grid place-items-center text-lg font-bold">S</div>
                            <span className="text-2xl font-extrabold tracking-tight">SEMS</span>
                        </div>
                        <h2 className="text-3xl font-bold leading-tight">스마트 환경 관리 플랫폼</h2>
                        <p className="mt-3 text-white/90">실내 공기질을 모니터링하고 제어하세요. 한 눈에 보는 데이터, 빠른 분석.</p>
                    </div>

                    {/* Right form panel */}
                    <CardContent className="p-7 md:p-10">
                        <div className="mb-8 text-center lg:text-left">
                            <div className="lg:hidden inline-flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-2xl bg-[#3F8DF0] text-white grid place-items-center text-lg font-bold">S</div>
                                <span className="text-2xl font-extrabold tracking-tight">SEMS</span>
                            </div>
                            <h1 className="text-2xl font-semibold text-slate-900">로그인</h1>
                            <p className="text-sm text-slate-500 mt-1">계정으로 계속 진행하세요</p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-slate-800">아이디</label>
                                <div className="relative mt-2">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="your-id"
                                        className="pl-10 h-12 text-[15px]"
                                        value={id}
                                        onChange={(e) => setId(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-800">비밀번호</label>
                                <div className="relative mt-2">
                                    <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-12 text-[15px]"
                                        value={pw}
                                        onChange={(e) => setPw(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                                    로그인 상태 유지
                                </label>

                                <div className="text-sm flex items-center gap-4">
                                    <Link to="/auth/find-id" className="text-slate-600 hover:text-slate-900 underline underline-offset-4">아이디 찾기</Link>
                                    <span className="text-slate-300">|</span>
                                    <Link to="/auth/find-password" className="text-slate-600 hover:text-slate-900 underline underline-offset-4">비밀번호 찾기</Link>
                                </div>
                            </div>

                            {err && <p className="text-sm text-red-600">{err}</p>}

                            <Button type="submit" disabled={loading} className="w-full h-12 text-[15px] gap-2">
                                <LogIn className="h-5 w-5" />
                                {loading ? "로그인 중..." : "로그인"}
                            </Button>

                            <p className="text-center text-sm text-slate-600">
                                계정이 없으신가요?{" "}
                                <Link to="/auth/signup" className="text-[#3F8DF0] hover:opacity-80 font-medium">회원가입</Link>
                            </p>
                        </form>

                        <div className="mt-10 text-[11px] text-slate-400 text-center lg:text-left">
                            © {new Date().getFullYear()} SEMS. All rights reserved.
                        </div>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
