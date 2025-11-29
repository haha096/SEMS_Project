// src/features/inquiry/InquiryUserPage.tsx
import { useEffect, useRef, useState } from 'react';
import { getMyThread, Msg } from './api';
import { useAuth } from '@/features/auth/AuthContext';
import { createChatClient, subscribeUserInbox, sendUserToAdmin, StompClient } from './wsClient';

function getSelfId(user: any): string {
    return user?.userId || user?.id || user?.username || user?.name || 'unknown';
}

export default function InquiryUserPage() {
    const { user } = useAuth();
    const selfId = getSelfId(user);

    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const boxRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<StompClient | null>(null);

    useEffect(() => {
        if (selfId === 'unknown') {
            setLoading(false);
            return;
        }

        let mounted = true;
        const load = async () => {
            try {
                const t = await getMyThread(selfId);
                if (mounted) setMsgs(t.messages);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        const iv = setInterval(load, 5000);

        // ✅ STOMP 연결(본인 ID 쿼리로 부여)
        const client = createChatClient(selfId);
        client.onConnect = () => {
            subscribeUserInbox(client, (frame) => {
                try {
                    const dto = JSON.parse(frame.body);
                    const m: Msg = {
                        id: `${dto.timestamp || Date.now()}-${Math.random()}`,
                        from: dto.senderId === selfId ? 'USER' : 'ADMIN',
                        text: dto.content || '',
                        at: dto.timestamp || new Date().toISOString(),
                    };
                    setMsgs((prev) => [...prev, m]);
                } catch {
                    /* ignore */
                }
            });
        };
        client.activate();
        clientRef.current = client;

        return () => {
            mounted = false;
            clearInterval(iv);
            client.deactivate();
            clientRef.current = null;
        };
    }, [selfId]);

    useEffect(() => {
        boxRef.current?.scrollTo({ top: 1e9 });
    }, [msgs]);

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const val = text.trim();
        if (!val || !clientRef.current || !clientRef.current.connected) return;

        setText('');
        const dto = {
            senderId: selfId,
            receiverId: 'admin',
            content: val,
            timestamp: new Date().toISOString(),
        };
        setMsgs((prev) => [...prev, { id: `tmp-${Date.now()}`, from: 'USER', text: val, at: dto.timestamp }]);
        sendUserToAdmin(clientRef.current, dto);
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">실시간 문의</h1>
            <div ref={boxRef} className="h-[60vh] overflow-y-auto rounded-lg border bg-white p-4">
                {loading ? (
                    <p className="text-sm text-gray-500">불러오는 중…</p>
                ) : msgs.length === 0 ? (
                    <p className="text-sm text-gray-400">아직 메시지가 없습니다.</p>
                ) : (
                    msgs.map((m) => (
                        <div key={m.id} className={`mb-2 flex ${m.from === 'USER' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[70%] rounded-xl px-3 py-2 shadow ${
                                    m.from === 'USER' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                                }`}
                            >
                                <div className="text-sm">{m.text}</div>
                                <div className="mt-1 text-[10px] opacity-70">{new Date(m.at).toLocaleString()}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={onSubmit} className="mt-3 flex gap-2">
                <input
                    className="flex-1 rounded border px-3 py-2"
                    placeholder="메시지를 입력하세요…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button className="rounded-xl border px-4 py-2 font-semibold shadow">전송</button>
            </form>
        </div>
    );
}
