// src/main/java/com/example/service/MotorControlService.java
package Not_Found.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

@Service
public class MotorControlService {

    private final MessageChannel mqttOutboundChannel;
    private final String powerTopic;   // "control/room1/power"
    private final String modeTopic;    // "control/room1/mode"
    private final String speedTopic;   // "control/room1/speed"

    public MotorControlService(
            @Qualifier("mqttOutboundChannel") MessageChannel mqttOutboundChannel,
            @Value("${mqtt.topic.control.room1.power}") String powerTopic,
            @Value("${mqtt.topic.control.room1.mode}")  String modeTopic,
            @Value("${mqtt.topic.control.room1.speed}") String speedTopic
    ) {
        this.mqttOutboundChannel = mqttOutboundChannel;
        this.powerTopic = powerTopic;
        this.modeTopic = modeTopic;
        this.speedTopic = speedTopic;
    }

    /**
     * 전원(POWER) 제어
     *  - on==true  → "POWER:ON"
     *  - on==false → "POWER:OFF"
     */

    public void sendPower(boolean on) {
        // RPi 쪽 스크립트가 "ON"/"OFF"만 확인하도록 로직이 되어 있으므로,
        // 여기서는 “ON” 또는 “OFF”만 퍼블리시합니다.
        String payload = on ? "ON" : "OFF";
        Message<String> msg = MessageBuilder
                .withPayload(payload)
                .setHeader("mqtt_topic", powerTopic)
                .setHeader("mqtt_qos", 1)
                .build();
        mqttOutboundChannel.send(msg);
    }

    /**
     * 모드(MODE) 제어
     *  - mode 값: "AUTO" 또는 "MANUAL"
     */
    public void sendMode(String mode) {
        // 기존: String payload = "MODE:" + mode;
        // 수정: RPi가 기대하는 순수 값만 보냄
        String payload = mode.toUpperCase();  // "MANUAL" 또는 "AUTO"
        Message<String> msg = MessageBuilder.withPayload(payload)
                .setHeader("mqtt_topic", modeTopic)    // control/room1/mode
                .setHeader("mqtt_qos", 1)
                .build();
        mqttOutboundChannel.send(msg);
    }

    /**
     * 속도(SPEED) 제어
     *  - level: 1 ~ 3
     */
    public void sendSpeed(int level) {
        // 기존: String payload = "SPEED:" + level;
        // 수정: RPi가 기대하는 순수 값인 "1","2","3" 만 보냄
        String payload = String.valueOf(level);  // 예: "2"
        Message<String> msg = MessageBuilder.withPayload(payload)
                .setHeader("mqtt_topic", speedTopic)   // control/room1/speed
                .setHeader("mqtt_qos", 1)
                .build();
        mqttOutboundChannel.send(msg);
    }
}

