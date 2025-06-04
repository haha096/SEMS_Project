package Not_Found.config;

import Not_Found.handler.ChatHandler;
import Not_Found.handler.SensorWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.socket.WebSocketHandler;

import java.security.Principal;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer, WebSocketConfigurer {

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
