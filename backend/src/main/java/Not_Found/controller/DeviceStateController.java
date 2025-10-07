package Not_Found.controller;

import Not_Found.service.DeviceStateService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/motor")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class DeviceStateController {

    private final DeviceStateService deviceStateService;
    public DeviceStateController(DeviceStateService deviceStateService) {
        this.deviceStateService = deviceStateService;
    }

    @GetMapping("/state")
    public Map<String, Object> getState() {
        return Map.of(
                "powerOn", deviceStateService.isPowerOn(),
                "mode", deviceStateService.getMode(),
                "level", deviceStateService.getLevel()
        );
    }
}
