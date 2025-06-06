// src/main/java/com/example/controller/MotorControlController.java
package Not_Found.controller;


import Not_Found.service.MotorControlService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/motor")
public class MotorControlController {

    private final MotorControlService motorControlService;

    public MotorControlController(MotorControlService motorControlService) {
        this.motorControlService = motorControlService;
    }

    /**
     * 1) 자동 모드(AUTO)로 설정
     *    GET /api/motor/auto
     */
    @GetMapping("/auto")
    public ResponseEntity<String> setAutoMode() {
        // MODE:AUTO 메시지를 control/room1/mode 토픽으로 발행
        motorControlService.sendMode("AUTO");
        return ResponseEntity.ok("AUTO 모드 명령 전송 완료");
    }

    /**
     * 2) 수동 모드(MANUAL) + 속도(level) 설정
     *    POST /api/motor/manual
     *    Body 예시 JSON: { "level": 2 }
     *    → MODE:MANUAL + SPEED:{level} 메시지 각각 발행
     */
    @PostMapping("/manual")
    public ResponseEntity<String> setManualMode(@RequestBody ManualRequest req) {
        int level = req.getLevel();
        if (level < 1 || level > 3) {
            return ResponseEntity.badRequest().body("level은 1~3 사이여야 합니다.");
        }

        // ① 모드 토픽(control/room1/mode)에 MODE:MANUAL 발행
        motorControlService.sendMode("MANUAL");
        // ② 속도 토픽(control/room1/speed)에 SPEED:{level} 발행
        motorControlService.sendSpeed(level);

        return ResponseEntity.ok("MANUAL 모드 및 속도(" + level + ") 명령 전송 완료");
    }

    /**
     * 3) 전원(POWER) 제어
     *    POST /api/motor/power
     *    Body 예시 JSON: { "on": true }
     *    → POWER:ON 또는 POWER:OFF 메시지 발행
     */
    @PostMapping("/power")
    public ResponseEntity<String> setPower(@RequestBody PowerRequest req) {
        boolean on = req.isOn();
        motorControlService.sendPower(on);
        String status = on ? "ON" : "OFF";
        return ResponseEntity.ok("전원 " + status + " 명령 전송 완료");
    }

    // ─────────────────────────────────────────────────────────────────
    // DTO 클래스들 (요청 바디 매핑용)
    // ─────────────────────────────────────────────────────────────────

    public static class ManualRequest {
        private int level;
        public int getLevel() { return level; }
        public void setLevel(int level) { this.level = level; }
    }

    public static class PowerRequest {
        private boolean on;
        public boolean isOn() { return on; }
        public void setOn(boolean on) { this.on = on; }
    }
}
