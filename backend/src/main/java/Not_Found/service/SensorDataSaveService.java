package Not_Found.service;

import Not_Found.model.entity.SensorEntity;
import Not_Found.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SensorDataSaveService {

    private final SensorRepository sensorRepository;

    public void handleIncomingSensorData(String payload) {
        try {
            JSONObject obj = new JSONObject(payload);

            SensorEntity sensor = new SensorEntity();
            sensor.setTemp(obj.getDouble("TEMP"));
            sensor.setHum(obj.getDouble("HUM"));
            sensor.setCurrent(obj.getDouble("CURRENT"));
            sensor.setMode(obj.getString("MODE"));
            sensor.setSpeed(obj.getInt("SPEED"));
            sensor.setPm1_0(obj.getDouble("PM1.0"));
            sensor.setPm2_5(obj.getDouble("PM2.5"));
            sensor.setPm10(obj.getDouble("PM10"));
            sensor.setPowerUsage(obj.has("POWERUSAGE") ? obj.getDouble("POWERUSAGE") : 0.0);
            // timestamp는 @PrePersist로 자동 설정됨

            sensorRepository.save(sensor); // ✅ DB에 저장
            System.out.println("✅ 센서 데이터 저장 완료!");

        } catch (Exception e) {
            System.err.println("❌ 센서 저장 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
