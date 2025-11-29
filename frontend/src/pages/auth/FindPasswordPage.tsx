// src/pages/auth/FindPasswordPage.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { api, USER_API } from "@/lib/api";   // ✅ USER_API 사용

function msg(x: any) {
    if (!x) return "알 수 없는 응답입니다.";
    if (typeof x === "string") return x;
    if (x.message) return String(x.message);
    try { return JSON.stringify(x); } catch { return String(x); }
}

export default function FindPasswordPage() {
    const [tab, setTab] = useState<"email" | "phone">("email");
    const [id, setId] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return alert("아이디를 입력해 주세요.");

        try {
            setLoading(true);

            if (tab === "email") {
                if (!email) return alert("이메일을 입력해 주세요.");
                const { data } = await api.post(USER_API.passwordReset, { id, email }); // ✅ 경로 수정
                alert(msg(data) || "재설정 안내를 이메일로 전송했습니다.");
            } else {
                // 백엔드에 SMS 엔드포인트가 아직 없으므로 안내만
                alert("현재는 이메일로만 비밀번호 재설정이 가능합니다.");
            }

        } catch (err: any) {
            alert(msg(err?.response?.data) || "요청 중 오류가 발생했습니다.");
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
                        <div className="text-3xl font-bold leading-tight">비밀번호 찾기</div>
                        <p className="mt-3 text-white/90">아이디 확인 후 이메일로 재설정 링크를 보내드립니다.</p>
                    </div>
                    <CardContent className="p-7 md:p-10">
                        <div className="mb-8">
                            <h1 className="text-2xl font-semibold text-slate-900">비밀번호 찾기</h1>
                            <p className="text-sm text-slate-500 mt-1">아이디와 연락처로 본인 확인을 진행합니다.</p>
                        </div>
                        <div className="mb-4 flex gap-2">
                            <Button variant={tab === "email" ? "default" : "secondary"} onClick={() => setTab("email")}>이메일로 받기</Button>
                            <Button variant={tab === "phone" ? "default" : "secondary"} onClick={() => setTab("phone")} disabled>
                                휴대폰으로 받기(준비중)
                            </Button>
                        </div>
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-slate-800">아이디</label>
                                <div className="relative mt-2">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input className="pl-10 h-11" placeholder="your-id" value={id} onChange={(e) => setId(e.target.value)} required />
                                </div>
                            </div>

                            {tab === "email" && (
                                <div>
                                    <label className="text-sm font-medium text-slate-800">이메일</label>
                                    <div className="relative mt-2">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input className="pl-10 h-11" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                            )}

                            {/* phone 탭은 비활성화/안내 상태 */}

                            <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
                                <Send className="h-4 w-4" /> {loading ? "전송 중..." : "재설정 안내 보내기"}
                            </Button>

                            <div className="flex items-center justify-between text-sm text-slate-600">
                                <Link to="/auth/login" className="hover:text-slate-900 underline underline-offset-4">로그인</Link>
                                <div className="flex items-center gap-3">
                                    <Link to="/auth/find-id" className="hover:text-slate-900 underline underline-offset-4">아이디 찾기</Link>
                                    <span className="text-slate-300">|</span>
                                    <Link to="/auth/signup" className="text-[#3F8DF0] hover:opacity-80">회원가입</Link>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
