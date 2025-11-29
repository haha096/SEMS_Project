// src/features/inquiry/api.ts
// Spring REST 응답 형태
export type ChatMessage = {
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string; // ISO
};

// UI에서 쓰는 메시지 모델
export type Msg = { id: string; from: 'USER' | 'ADMIN'; text: string; at: string };
export type Thread = { userId: string; userName: string; messages: Msg[] };

// 유틸: ChatMessage[] -> Msg[]
function toMsgs(items: ChatMessage[] | any, selfId: string): Msg[] {
    if (!Array.isArray(items)) return [];
    return items.map((m, i) => ({
        id: `${m?.timestamp ?? i}-${i}`,
        from: m?.senderId === selfId ? 'USER' : 'ADMIN',
        text: m?.content ?? '',
        at: m?.timestamp ?? new Date().toISOString(),
    }));
}

/** 사용자: 내 스레드 불러오기 (SPRING: GET /api/chat/history/{userId}) */
export async function getMyThread(userId: string): Promise<Thread> {
    try {
        const r = await fetch(`/api/chat/history/${encodeURIComponent(userId)}`, { credentials: 'include' });
        if (!r.ok) throw new Error('load failed');
        const arr: ChatMessage[] = await r.json();
        return { userId, userName: userId, messages: toMsgs(arr, userId) };
    } catch (e) {
        console.warn('[chat] my thread load failed:', e);
        return { userId, userName: userId, messages: [] };
    }
}

/** 관리자: 채팅한 유저 목록 (SPRING: GET /api/chat/users)
 *  반환을 "문자열 배열"로 강제 정규화한다.
 */
export async function adminListThreads(): Promise<string[]> {
    try {
        const r = await fetch('/api/chat/users', { credentials: 'include' });
        if (!r.ok) throw new Error('list failed');
        const raw = await r.json();
        if (Array.isArray(raw)) {
            return raw
                .map((it: any) =>
                    typeof it === 'string'
                        ? it
                        : (it?.userId ?? it?.id ?? it?.username ?? it?.name ?? '')
                )
                .filter(Boolean);
        }
        return [];
    } catch (e) {
        console.warn('[chat] users load failed:', e);
        return [];
    }
}

/** 관리자: 특정 유저 스레드 불러오기 (SPRING: GET /api/chat/history/{userId}) */
export async function adminGetThread(userId: string): Promise<Thread> {
    try {
        const r = await fetch(`/api/chat/history/${encodeURIComponent(userId)}`, { credentials: 'include' });
        if (!r.ok) throw new Error('thread failed');
        const arr: ChatMessage[] = await r.json();
        return { userId, userName: userId, messages: toMsgs(arr, userId) };
    } catch (e) {
        console.warn('[chat] thread load failed:', e);
        return { userId, userName: userId, messages: [] };
    }
}

/** 전송은 다음 단계(웹소켓 또는 REST-브리지)에서 붙임 */
export async function sendUserMsg(_: string) {
    throw new Error('메시지 전송은 다음 단계에서 활성화됩니다.');
}
export async function adminSendMsg(_: string, __: string) {
    throw new Error('메시지 전송은 다음 단계에서 활성화됩니다.');
}
