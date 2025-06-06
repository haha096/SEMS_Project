package Not_Found.service;

import Not_Found.model.dto.SensorData;
import Not_Found.model.entity.SensorEntity;
import Not_Found.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class SensorDataSaveService {

    private final SensorRepository sensorRepository;

    /**
     * HiveMQ로부터 전달된 JSON 문자열(payload)을 파싱해서
     * SensorEntity에 매핑한 뒤 DB에 저장하고,
     * 저장된 데이터를 SensorData DTO로 반환합니다.
     */
    public SensorData handleIncomingSensorData(String payload) {
        try {
            JSONObject obj = new JSONObject(payload);
            SensorEntity sensor = new SensorEntity();

            // 1) room 정보 설정
            if (obj.has("topic")) {
                String topic = obj.getString("topic"); // ex: "sensordata/room1"
                String[] parts = topic.split("/");
                if (parts.length >= 2) {
                    sensor.setRoom(parts[1]);          // ex: "room1"
                } else {
                    sensor.setRoom("room1");
                }
            } else {
                sensor.setRoom("room1");
            }

            // 2) 센서 값 매핑
            sensor.setPm1(       obj.getDouble("PM1") );
            sensor.setPm2_5(     obj.getDouble("PM2_5") );
            sensor.setPm10(      obj.getDouble("PM10") );
            sensor.setCurrent(   obj.getDouble("CURRENT") );
            sensor.setVolt(      obj.getDouble("VOLT") );
            sensor.setTemperature(obj.getDouble("TEMP") );
            sensor.setHumidity(  obj.getDouble("HUM") );

            // 3) 모드, 속도, 전원 상태 매핑
            sensor.setMode(       obj.getString("MODE") );
            sensor.setSpeed(      obj.getInt("SPEED") );
            sensor.setPowerStatus(obj.getString("POWER") );

            // 저장(한 번만)
            SensorEntity saved = sensorRepository.save(sensor);

            // 저장된 엔티티를 SensorData DTO로 변환해서 반환
            SensorData dto = new SensorData();
            dto.setId(saved.getId());
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            dto.setTimestamp(saved.getTimestamp().format(formatter));
            dto.setRoom(saved.getRoom());
            dto.setPm1(saved.getPm1());
            dto.setPm2_5(saved.getPm2_5());
            dto.setPm10(saved.getPm10());
            dto.setCurrent(saved.getCurrent());
            dto.setVolt(saved.getVolt());
            dto.setTemperature(saved.getTemperature());
            dto.setHumidity(saved.getHumidity());
            dto.setMode(saved.getMode());
            dto.setSpeed(saved.getSpeed());
            dto.setPowerStatus(saved.getPowerStatus());

            System.out.println("✅ 센서 데이터 저장 완료 → ID: " + saved.getId());
            return dto;
        } catch (Exception e) {
            System.err.println("❌ 센서 저장 실패: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}