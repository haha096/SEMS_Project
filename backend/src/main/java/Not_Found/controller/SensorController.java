package Not_Found.controller;

import Not_Found.model.dto.EnvironmentDataDTO;
import Not_Found.model.dto.SensorData;
import Not_Found.model.dto.UsageTimeDTO;
import Not_Found.service.EnvironmentDataService;
import Not_Found.service.SensorService;


import Not_Found.util.MyUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/sensor")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true") // CORS 허용
public class SensorController {

    private final SensorService sensorService;
    private final EnvironmentDataService environmentDataService;

    @Autowired
    public SensorController(SensorService sensorService,EnvironmentDataService environmentDataService) {
        this.sensorService = sensorService;
        this.environmentDataService = environmentDataService;
    }

    // 최신 센서 데이터 조회
    @GetMapping("/latest")  /* */
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
    public UsageTimeDTO getUsageTime() {//시간차
        return environmentDataService.getUsageTime();
    }

}
