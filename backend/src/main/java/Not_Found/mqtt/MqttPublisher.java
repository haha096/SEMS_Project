package Not_Found.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.stereotype.Component;

@Component
public class MqttPublisher {

    private final String brokerUrl = "ssl://1f89c669ce6f40a8aa6952820a376a78.s1.eu.hivemq.cloud:8883";
    private final String clientId = "backend-publisher";
    private final String topic = "motor/control";

    private MqttClient client;

    public MqttPublisher() {
        try {
            client = new MqttClient(brokerUrl, clientId, null);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setUserName("404project");
            options.setPassword("Project1234".toCharArray());
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);

            client.connect(options);
            System.out.println("✅ MQTT Publisher 연결됨");
        } catch (MqttException e) {
            e.printStackTrace();
        }
    }

    public void publishMessage(String message) {
        try {
            if (client.isConnected()) {
                MqttMessage mqttMessage = new MqttMessage(message.getBytes());
                client.publish(topic, mqttMessage);
                System.out.println("✅ MQTT 메시지 전송됨 → " + message);
            } else {
                System.err.println("❌ MQTT 브로커에 연결되지 않음");
            }
        } catch (MqttException e) {
            e.printStackTrace();
        }
    }
}
