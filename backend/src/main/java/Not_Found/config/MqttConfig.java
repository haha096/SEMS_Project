package Not_Found.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import Not_Found.model.dto.SensorData;
import Not_Found.handler.SensorWebSocketHandler;
import Not_Found.service.SensorDataSaveService;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

import javax.net.ssl.SSLContext;

@Configuration
public class MqttConfig {

    @Autowired
    private SensorDataSaveService sensorDataSaveService;

    @Autowired
    private SensorWebSocketHandler sensorWebSocketHandler;

    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    @Value("${mqtt.client.id}")
    private String clientId;

    @Value("${mqtt.username:}")
    private String username;

    @Value("${mqtt.password:}")
    private String password;

    @Value("${mqtt.topic}")
    private String topic;

    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{ brokerUrl });
        options.setUserName(username);
        options.setPassword(password.toCharArray());
        options.setCleanSession(false);
        options.setKeepAliveInterval(20);
        options.setAutomaticReconnect(true);
        try {
            SSLContext sslContext = SSLContext.getDefault();
            options.setSocketFactory(sslContext.getSocketFactory());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to configure SSL for MQTT", e);
        }
        factory.setConnectionOptions(options);
        return factory;
    }

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageProducer inboundAdapter(MqttPahoClientFactory factory) {
        String subscriberClientId = clientId;
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(subscriberClientId, factory, topic);

        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new org.springframework.integration.mqtt.support.DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setAutoStartup(true);
        adapter.setRecoveryInterval(5000);
        adapter.setOutputChannel(mqttInputChannel());
        return adapter;
    }

    // ───────────────────────────────────────────────────────────────────
    // ① MQTT 메시지 수신 → ② 저장 서비스 호출 → ③ DTO(JSON)만 WebSocket에 전송
    // ───────────────────────────────────────────────────────────────────
    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler handler() {
        return message -> {
            String payload   = (String) message.getPayload();
            String fullTopic = (String) message.getHeaders().get("mqtt_receivedTopic");
            System.out.println("▶️ MQTT 메시지 수신 (토픽: " + fullTopic + ") : " + payload);

            // 토픽이 "sensordata/{room}" 형태라면 room 부분만 떼어내기
            String room = null;
            if (fullTopic != null && fullTopic.startsWith("sensordata/")) {
                room = fullTopic.substring("sensordata/".length());
            }

            // payload에 여러 JSON이 붙어 있다면 분리 (예: "{}{}" 형태)
            String[] jsonMessages = payload.split("(?<=\\})\\s*(?=\\{)");
            ObjectMapper objectMapper = new ObjectMapper();

            for (String json : jsonMessages) {
                try {
                    // (1) JSON + room을 서비스에 넘겨서 한 번만 저장 → SensorData DTO 반환
                    SensorData savedDto = sensorDataSaveService.handleIncomingSensorData(json);
                    if (savedDto == null) {
                        // 저장 실패 시 건너뛰기
                        continue;
                    }

                    // (2) 저장된 DTO를 JSON 문자열로 변환
                    String sensorJson = objectMapper.writeValueAsString(savedDto);

                    // (3) WebSocketHandler에 “전송만” 위임
                    sensorWebSocketHandler.broadcastWithoutSave(sensorJson);

                    System.out.println("✅ 센서 데이터 저장 후 WebSocket 브로드캐스트 → room=" + room);
                } catch (Exception e) {
                    System.err.println("❌ 개별 JSON 처리 실패: " + json);
                    e.printStackTrace();
                }
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // (추가) ③ 퍼블리셔를 위한 아웃바운드 채널 & 핸들러
    // ─────────────────────────────────────────────────────────────────
    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutbound(MqttPahoClientFactory factory) {
        // clientId는 적당히 유니크한 값으로 설정하세요
        MqttPahoMessageHandler handler = new MqttPahoMessageHandler("backendPublisher", factory);
        handler.setAsync(true);
        // 기본 토픽을 설정해도 되고, 동적으로 header("mqtt_topic")을 붙여서 보낼 수도 있습니다.
        // 예를 들어 기본 토픽을 하나만 쓴다면 아래처럼 해도 됩니다.
        // handler.setDefaultTopic(topic);   // application.properties에 정의된 mqtt.topic을 주입받아도 되고
        return handler;
    }





}