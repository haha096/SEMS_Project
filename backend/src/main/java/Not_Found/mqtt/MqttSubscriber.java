package Not_Found.mqtt;

import Not_Found.service.SensorDataSaveService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MqttSubscriber {

    // HiveMQ Cloud 주소 (TLS)
    private final String brokerUrl = "ssl://1f89c669ce6f40a8aa6952820a376a78.s1.eu.hivemq.cloud:8883";
    private final String clientId = "backend-subscriber";
    private final SensorDataSaveService sensorDataService;

    @PostConstruct
    public void start() {
        try {
            MqttClient client = new MqttClient(brokerUrl, clientId, null);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);

            // 🔐 여기 본인 HiveMQ Cloud 사용자 정보 입력
            options.setUserName("404project");
            options.setPassword("Project1234".toCharArray());

            client.connect(options);

            client.subscribe("sensor/topic", (topic, message) -> {
                String payload = new String(message.getPayload());
                System.out.println("수신됨 → " + new String(message.getPayload()));

                //센서값이 잘 DB에 안 와서 추가한 DB저장용
                sensorDataService.handleIncomingSensorData(payload);

            });

            System.out.println("MQTT 구독 시작됨 (sensor/topic)");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
