package Not_Found.controller;

import Not_Found.mqtt.MqttPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/control")
public class MotorController {

    private final MqttPublisher mqttPublisher;

    @Autowired
    public MotorController(MqttPublisher mqttPublisher) {
        this.mqttPublisher = mqttPublisher;
    }

    @PostMapping("/mode")
    public String setMode(@RequestBody ModeRequest request) {
        String mode = request.getMode();
        if (!mode.equals("MODE:AUTO") && !mode.equals("MODE:MANUAL")) {
            return "❌ 유효하지 않은 모드 값입니다.";
        }
        mqttPublisher.publishMessage(mode);
        return "✅ 모드 전송됨 → " + mode;
    }

    @PostMapping("/speed")
    public String setSpeed(@RequestBody SpeedRequest request) {
        String speed = request.getSpeed();
        if (!speed.matches("SPEED:[0-3]")) {
            return "❌ 유효하지 않은 속도 값입니다.";
        }
        mqttPublisher.publishMessage(speed);
        return "✅ 속도 전송됨 → " + speed;
    }

    static class ModeRequest {
        private String mode;

        public String getMode() {
            return mode;
        }

        public void setMode(String mode) {
            this.mode = mode;
        }
    }

    static class SpeedRequest {
        private String speed;

        public String getSpeed() {
            return speed;
        }

        public void setSpeed(String speed) {
            this.speed = speed;
        }
    }
}
