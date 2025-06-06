package Not_Found.handler;


import Not_Found.model.dto.SensorData;
import Not_Found.service.SensorService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class SensorWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    @Autowired
    private SensorService sensorService;  // SensorService를 주입

//    @Autowired
//    private SensorController sensorController;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("✅ Sensor WebSocket 연결 성공: " + session.getId());
        System.out.println("📡 현재 연결 수: " + sessions.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
        sessions.remove(session);
    }

    public void broadcast(String message) {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    // 메시지를 SensorData 객체로 변환
                    ObjectMapper objectMapper = new ObjectMapper();
                    SensorData sensorData = objectMapper.readValue(message, SensorData.class);

                    // DB 저장 후, 엔티티에서 id/timestamp 가져오기
                    var savedEntity = sensorService.saveSensorData(sensorData);

                    // 저장된 엔티티의 id, timestamp를 DTO에 설정
                    sensorData.setId(savedEntity.getId());
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                    sensorData.setTimestamp(savedEntity.getTimestamp().format(formatter));

                    // 컨트롤러에 최신 데이터 갱신
                    //sensorController.updateSensorData(sensorData);

                    // 클라이언트에게 전송
                    System.out.println("📡 WebSocket에 메시지 브로드캐스트: " + objectMapper.writeValueAsString(sensorData));
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(sensorData)));
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

}
