// src/pages/auth/FindIdPage.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { api, USER_API } from "@/lib/api";   // ✅ 상수 사용

function msg(x: any) {
    if (!x) return "알 수 없는 응답입니다.";
    if (typeof x === "string") return x;
    if (x.message) return String(x.message);
    try { return JSON.stringify(x); } catch { return String(x); }
}

export default function FindIdPage() {
    const [tab, setTab] = useState<"email" | "phone">("email");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ 현재 백엔드에 존재하는 것은 /api/auth/find-id (name+email)만
        if (tab === "phone") {
            alert("현재는 이메일로만 아이디 찾기가 지원됩니다.");
            return;
        }

        try {
            setLoading(true);

            // ✅ 하드코딩 금지 — 정의된 상수 사용
            const url = USER_API.findId; // "/api/auth/find-id"
            const body = { name, email };

            const { data } = await api.post(url, body);
            const uid = data?.userId ?? data?.id;

            alert(uid ? `아이디: ${uid}` : msg(data));
        } catch (err: any) {
            alert(msg(err?.response?.data) || "아이디 찾기 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#EEF3FB] flex items-center justify-center p-6">
            <Card className="w-full md:max-w-[720px] lg:max-w-[960px] shadow-2xl border-slate-200/80 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#3F8DF0] to-[#6AA9FF] text-white p-10">
                        <div className="text-3xl font-bold leading-tight">아이디 찾기</div>
                        <p className="mt-3 text-white/90">이메일 또는 휴대폰으로 빠르게 찾을 수 있어요.</p>
                    </div>
                    <CardContent className="p-7 md:p-10">
                        <div className="mb-8">
                            <h1 className="text-2xl font-semibold text-slate-900">아이디 찾기</h1>
                            <p className="text-sm text-slate-500 mt-1">등록정보로 본인 확인 후 안내합니다.</p>
                        </div>
                        <div className="mb-4 flex gap-2">
                            <Button variant={tab === "email" ? "default" : "secondary"} onClick={() => setTab("email")}>
                                이메일로 찾기
                            </Button>
                            <Button variant={tab === "phone" ? "default" : "secondary"} onClick={() => setTab("phone")}>
                                휴대폰으로 찾기
                            </Button>
                        </div>
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-slate-800">이름</label>
                                <Input className="h-11 mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>

                            {tab === "email" ? (
                                <div>
                                    <label className="text-sm font-medium text-slate-800">이메일</label>
                                    <div className="relative mt-2">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-10 h-11"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium text-slate-800">휴대폰 번호</label>
                                    <div className="relative mt-2">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-10 h-11"
                                            placeholder="010-0000-0000"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            // 휴대폰 찾기는 현재 비활성(백엔드 미구현)
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">※ 현재는 이메일로만 아이디 찾기가 가능합니다.</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
                                <Search className="h-4 w-4" /> {loading ? "조회 중..." : "아이디 찾기"}
                            </Button>

                            <div className="flex items-center justify-between text-sm text-slate-600">
                                <Link to="/auth/login" className="hover:text-slate-900 underline underline-offset-4">로그인</Link>
                                <div className="flex items-center gap-3">
                                    <Link to="/auth/find-password" className="hover:text-slate-900 underline underline-offset-4">비밀번호 찾기</Link>
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
