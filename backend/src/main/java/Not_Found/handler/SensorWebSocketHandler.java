package Not_Found.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

//바뀐 부분
@Component
public class SensorWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("✅ Sensor WebSocket 연결 성공: " + session.getId());
        System.out.println("📡 현재 연결 수: " + sessions.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    /**
     * DB 저장 없이, 이미 저장된 DTO(JSON) 문자열을 모든 세션에만 전송한다.
     */
    public void broadcastWithoutSave(String message) {
        System.out.println("📡 전송 세션 수=" + sessions.size() + ", payload=" + message);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    System.out.println("📡 WebSocket에 메시지 전송: " + message);
                    session.sendMessage(new TextMessage(message));
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}