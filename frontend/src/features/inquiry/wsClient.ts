// src/features/inquiry/wsClient.ts
import { Client, IMessage } from "@stomp/stompjs";

export type StompClient = Client;

// ✅ 직접 Spring으로 ws:// 연결 (프록시 X)
const WS_ORIGIN = import.meta.env.VITE_SPRING_WS_ORIGIN || "ws://localhost:8080";

export function createChatClient(userId: string): StompClient {
    const url = `${WS_ORIGIN}/ws?userId=${encodeURIComponent(userId)}`;

    const client = new Client({
        // 네이티브 WebSocket 팩토리 사용 (SockJS 제거)
        webSocketFactory: () => new WebSocket(url),
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: (msg) => {
            if (import.meta.env.DEV) console.debug("[STOMP]", msg);
        },
    });

    return client;
}

export function subscribeAdmin(client: StompClient, onMsg: (msg: IMessage) => void) {
    return client.subscribe("/topic/messages/admin", onMsg);
}

export function subscribeUserInbox(client: StompClient, onMsg: (msg: IMessage) => void) {
    return client.subscribe("/user/queue/messages", onMsg);
}

export function sendUserToAdmin(client: StompClient, dto: any) {
    client.publish({ destination: "/app/user-to-admin", body: JSON.stringify(dto) });
}

export function sendAdminToUser(client: StompClient, dto: any) {
    client.publish({ destination: "/app/admin-to-user", body: JSON.stringify(dto) });
}
