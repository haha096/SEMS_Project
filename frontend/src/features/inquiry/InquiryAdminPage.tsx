// src/features/inquiry/InquiryAdminPage.tsx
import { useEffect, useRef, useState } from 'react';
import { adminListThreads, adminGetThread, Msg, Thread } from './api';
import { createChatClient, subscribeAdmin, sendAdminToUser, StompClient } from './wsClient';

export default function InquiryAdminPage() {
    const [users, setUsers] = useState<string[]>([]);
    const [selId, setSelId] = useState<string | null>(null);
    const [thread, setThread] = useState<Thread | null>(null);
    const [text, setText] = useState('');
    const boxRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<StompClient | null>(null);

    useEffect(() => {
        adminListThreads().then(setUsers).catch(() => alert('유저 목록 불러오기 실패'));
    }, []);

    useEffect(() => {
        let unmounted = false;

        const load = async () => {
            if (!selId) return;
            try {
                const t = await adminGetThread(selId);
                if (!unmounted) setThread(t);
            } catch {
                if (!unmounted) alert('대화 불러오기 실패');
            }
        };
        load();
        const iv = setInterval(load, 5000);

        // ✅ STOMP 연결(한 번만) — 관리자 Principal = "admin"
        if (!clientRef.current) {
            const client = createChatClient('admin');
            client.onConnect = () => {
                subscribeAdmin(client, (frame) => {
                    try {
                        const dto = JSON.parse(frame.body);
                        const toUserId = dto.senderId; // 일반사용자가 보낸 것
                        if (toUserId && toUserId === selId) {
                            const m: Msg = {
                                id: `${dto.timestamp || Date.now()}-${Math.random()}`,
                                from: 'USER',
                                text: dto.content || '',
                                at: dto.timestamp || new Date().toISOString(),
                            };
                            setThread((t) => (t ? { ...t, messages: [...t.messages, m] } : t));
                        }
                    } catch {
                        /* ignore */
                    }
                });
            };
            client.activate();
            clientRef.current = client;
        }

        return () => {
            unmounted = true;
            clearInterval(iv);
        };
    }, [selId]);

    useEffect(() => {
        boxRef.current?.scrollTo({ top: 1e9 });
    }, [thread]);

    function onSend(e: React.FormEvent) {
        e.preventDefault();
        if (!selId || !thread || !clientRef.current || !clientRef.current.connected) return;
        const val = text.trim();
        if (!val) return;

        setText('');
        const dto = {
            senderId: 'admin',
            receiverId: selId,
            content: val,
            timestamp: new Date().toISOString(),
        };
        const temp: Msg = { id: `tmp-${Date.now()}`, from: 'ADMIN', text: val, at: dto.timestamp };
        setThread((t) => (t ? { ...t, messages: [...t.messages, temp] } : t));
        sendAdminToUser(clientRef.current, dto);
    }

    return (
        <div className="flex h-[80vh]">
            <div className="w-64 shrink-0 border-r p-3">
                <h2 className="mb-2 font-semibold">유저 목록</h2>
                <div className="space-y-2">
                    {users.map((id) => (
                        <button
                            key={id}
                            onClick={() => {
                                setSelId(id);
                                setThread(null);
                            }}
                            className={`block w-full rounded border px-3 py-2 text-left ${
                                selId === id ? 'bg-blue-50 border-blue-300' : ''
                            } text-gray-800`}
                            title={id}
                        >
                            {id}
                        </button>
                    ))}
                    {users.length === 0 && <div className="text-xs text-gray-500">유저 없음</div>}
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-4">
                <h1 className="mb-4 text-2xl font-bold">실시간 문의 관리</h1>
                <div ref={boxRef} className="flex-1 overflow-y-auto rounded-lg border bg-white p-4">
                    {!selId ? (
                        <p className="text-sm text-gray-500">좌측에서 사용자를 선택하세요.</p>
                    ) : !thread ? (
                        <p className="text-sm text-gray-500">불러오는 중…</p>
                    ) : thread.messages.length === 0 ? (
                        <p className="text-sm text-gray-500">메시지가 없습니다.</p>
                    ) : (
                        thread.messages.map((m) => (
                            <div key={m.id} className={`mb-2 flex ${m.from === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[70%] rounded-xl px-3 py-2 shadow ${
                                        m.from === 'ADMIN' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                                    }`}
                                >
                                    <div className="text-sm">
                                        {m.from === 'ADMIN' ? (
                                            <span className="font-semibold">admin: </span>
                                        ) : (
                                            <span className="font-semibold">{thread.userName || thread.userId}: </span>
                                        )}
                                        {m.text}
                                    </div>
                                    <div className="mt-1 text-[10px] opacity-70">{new Date(m.at).toLocaleString()}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={onSend} className="mt-3 flex gap-2">
                    <input
                        className="flex-1 rounded border px-3 py-2"
                        placeholder="메시지 입력…"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={!selId}
                    />
                    <button className="rounded-xl border px-4 py-2 font-semibold shadow" disabled={!selId}>
                        전송
                    </button>
                </form>
            </div>
        </div>
    );
}
