package Not_Found.config;

import Not_Found.handler.ChatHandler;
import Not_Found.handler.SensorWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatHandler chatHandler;
    private final SensorWebSocketHandler sensorWebSocketHandler; // ✨ 추가

    public WebSocketConfig(ChatHandler chatHandler, SensorWebSocketHandler sensorWebSocketHandler) {
        this.chatHandler = chatHandler;
        this.sensorWebSocketHandler = sensorWebSocketHandler; // ✨ 추가
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatHandler, "/ws/chat")
                .setAllowedOrigins("*"); // CORS 허용
//        registry.addHandler(sensorWebSocketHandler, "/")
//                .setAllowedOrigins("*"); // ✨ 새로 추가하는 센서용 WebSocket
        registry.addHandler(sensorWebSocketHandler, "/ws/sensor")
                .setAllowedOrigins("*"); // ✨ 새로 추가하는 센서용 WebSocket
    }
}
