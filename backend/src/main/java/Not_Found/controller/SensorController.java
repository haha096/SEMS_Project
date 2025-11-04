// src/main/java/Not_Found/controller/SensorController.java
package Not_Found.controller;

import Not_Found.model.dto.SensorData;
import Not_Found.model.dto.UsageTimeDTO;
import Not_Found.service.EnvironmentDataService;
import Not_Found.service.SensorService;
import Not_Found.util.MyUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/sensor", "/sensor"}) // ← /api 프리픽스 추가(겸용)
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:5173"},
        allowCredentials = "true"
) // CORS 허용 (프록시 쓰면 사실 필요 없지만 기존 유지)
public class SensorController {

    private final SensorService sensorService;
    private final EnvironmentDataService environmentDataService;

    @Autowired
    public SensorController(SensorService sensorService, EnvironmentDataService environmentDataService) {
        this.sensorService = sensorService;
        this.environmentDataService = environmentDataService;
    }

    // 최신 센서 데이터 조회
    @GetMapping("/latest")
    public SensorData getLatestSensorData() {
        return sensorService.getLatestSensorData();
    }

    // 전체 센서 데이터 조회
    @GetMapping
    public List<SensorData> getAllSensorData() {
        try {
            List<SensorData> data = sensorService.getAllSensorData();
            System.out.println(MyUtil.BLUE + "센서 데이터 수: " + data.size() + MyUtil.END);
            return data;
        } catch (Exception e) {
            System.err.println("센서 데이터 조회 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/energy/usage-time")
    public UsageTimeDTO getUsageTime() {
        return environmentDataService.getUsageTime();
    }
}
