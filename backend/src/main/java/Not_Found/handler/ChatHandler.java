package Not_Found.handler;

import org.json.JSONObject;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Component
public class ChatHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> userSessions = new HashMap<>();
    private final Map<String, String> userRoles    = new HashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = getParam(session, "userId").trim();
        String role   = getParam(session, "role").trim();
        userSessions.put(userId, session);
        userRoles.put(userId, role);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JSONObject json     = new JSONObject(message.getPayload());
        String sender       = json.getString("sender");
        String receiver     = json.getString("receiver");
        String content      = json.getString("content");
        String senderRole   = userRoles.getOrDefault(sender, "unknown");
        String formattedMsg;

        if (content.startsWith("data:image")) {
            if ("student".equals(senderRole)) {
                formattedMsg = "[" + sender + " 학생] " + content;
            } else if ("admin".equals(senderRole)) {
                formattedMsg = "[관리자] " + content;
            } else {
                formattedMsg = "[알 수 없음] " + content;
            }



            // 이미지 브로드캐스트
            if ("student".equals(senderRole)) {
                // 학생 → 모든 관리자
                for (Map.Entry<String, String> e : userRoles.entrySet()) {
                    if ("admin".equals(e.getValue())) {
                        WebSocketSession adminSes = userSessions.get(e.getKey());
                        if (adminSes != null && adminSes.isOpen()) {
                            try {
                                adminSes.sendMessage(new TextMessage(formattedMsg));
                            } catch (IOException ex) {
                                ex.printStackTrace(); // 필요에 따라 로깅
                            }
                        }
                    }
                }
            } else if ("admin".equals(senderRole)) {
                // 관리자 → 특정 학생
                WebSocketSession studentSes = userSessions.get(receiver);
                if (studentSes != null && studentSes.isOpen()) {
                    try {
                        studentSes.sendMessage(new TextMessage(formattedMsg));
                    } catch (IOException ex) {
                        ex.printStackTrace();
                    }
                }
            }
        }
        else if ("student".equals(senderRole)) {
            formattedMsg = "[" + sender + " 학생] " + content;
            // 학생 텍스트 → 모든 관리자
            for (Map.Entry<String, String> e : userRoles.entrySet()) {
                if ("admin".equals(e.getValue())) {
                    WebSocketSession adminSes = userSessions.get(e.getKey());
                    if (adminSes != null && adminSes.isOpen()) {
                        try {
                            adminSes.sendMessage(new TextMessage(formattedMsg));
                        } catch (IOException ex) {
                            ex.printStackTrace();
                        }
                    }
                }
            }
        }
        else if ("admin".equals(senderRole)) {
            formattedMsg = "[관리자] " + content;
            // 관리자 텍스트 → 특정 학생
            WebSocketSession studentSes = userSessions.get(receiver);
            if (studentSes != null && studentSes.isOpen()) {
                try {
                    studentSes.sendMessage(new TextMessage(formattedMsg));
                } catch (IOException ex) {
                    ex.printStackTrace();
                }
            }
        }
        else {
            formattedMsg = "[알 수 없음] " + content;
        }

        // 발신자 echo
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(formattedMsg));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String disconnected = userSessions.entrySet().stream()
                .filter(e -> e.getValue().equals(session))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);

        if (disconnected != null) {
            userSessions.remove(disconnected);
            userRoles.remove(disconnected);
        }
    }

    private String getParam(WebSocketSession session, String key) {
        try {
            return session.getUri().getQuery().lines()
                    .flatMap(q -> Arrays.stream(q.split("&")))
                    .map(pair -> pair.split("="))
                    .filter(p -> p.length == 2 && p[0].equals(key))
                    .map(p -> p[1])
                    .findFirst()
                    .orElse("unknown");
        } catch (Exception e) {
            return "unknown";
        }
    }
}
