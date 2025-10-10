package Not_Found.service;

import Not_Found.handler.SensorWebSocketHandler;
import Not_Found.model.dto.SensorData;
import Not_Found.model.entity.SensorEntity;
import Not_Found.repository.SensorRepository;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

//바뀐 부분
@Service
public class SensorService {
    private final SensorRepository sensorRepository;
    private final SensorWebSocketHandler sensorWebSocketHandler;

    public SensorService(SensorRepository sensorRepository,
                         SensorWebSocketHandler sensorWebSocketHandler) {
        this.sensorRepository = sensorRepository;
        this.sensorWebSocketHandler = sensorWebSocketHandler;
    }

    /** DB에 Sensor 데이터를 저장 */
    @Transactional
    public SensorEntity saveSensorData(SensorData dto) {
        // DTO → Entity 변환
        SensorEntity entity = new SensorEntity();
        entity.setRoom(dto.getRoom());
        entity.setPm1(dto.getPm1());
        entity.setPm2_5(dto.getPm2_5());
        entity.setPm10(dto.getPm10());
        entity.setCurrent(dto.getCurrent());
        entity.setVolt(dto.getVolt());
        entity.setTemperature(dto.getTemperature());
        entity.setHumidity(dto.getHumidity());
        entity.setMode(dto.getMode());
        entity.setSpeed(dto.getSpeed());
        entity.setPowerStatus(dto.getPowerStatus());
        // timestamp는 @PrePersist로 자동 설정됨

        SensorEntity saved = sensorRepository.save(entity);

        // ✅ 저장 직후 Flutter로 실시간 푸시 (한 번만!)
        String json = new JSONObject()
                .put("TEMP",   saved.getTemperature())
                .put("HUM",    saved.getHumidity())
                .put("PM1",    saved.getPm1())
                .put("PM10",   saved.getPm10())
                .put("PM2.5",  saved.getPm2_5())
                .put("CURRENT",saved.getCurrent())
                .put("VOLT",   saved.getVolt())
                .put("MODE",   saved.getMode())
                .put("SPEED",  saved.getSpeed())
                .put("POWER",  saved.getPowerStatus())
                .toString();

        sensorWebSocketHandler.broadcastWithoutSave(json);

        return saved;
    }

    /** DB에서 최신 센서 데이터 조회 */
    @Transactional(readOnly = true)
    public SensorData getLatestSensorData() {
        return sensorRepository.findFirstByOrderByIdDesc()
                .map(entity -> {
                    SensorData dto = new SensorData();
                    dto.setId(entity.getId());

                    // timestamp 포맷: "yyyy-MM-dd HH:mm"
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                    dto.setTimestamp(entity.getTimestamp().format(formatter));

                    dto.setRoom(entity.getRoom());
                    dto.setPm1(entity.getPm1());
                    dto.setPm2_5(entity.getPm2_5());
                    dto.setPm10(entity.getPm10());
                    dto.setCurrent(entity.getCurrent());
                    dto.setVolt(entity.getVolt());
                    dto.setTemperature(entity.getTemperature());
                    dto.setHumidity(entity.getHumidity());
                    dto.setMode(entity.getMode());
                    dto.setSpeed(entity.getSpeed());
                    dto.setPowerStatus(entity.getPowerStatus());
                    return dto;
                })
                .orElseGet(SensorData::new);
    }

    /** DB에서 모든 센서 데이터 조회 */
    @Transactional(readOnly = true)
    public List<SensorData> getAllSensorData() {
        List<SensorEntity> entities = sensorRepository.findAll();
        return entities.stream().map(entity -> {
            SensorData dto = new SensorData();
            dto.setId(entity.getId());

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            dto.setTimestamp(entity.getTimestamp().format(formatter));

            dto.setRoom(entity.getRoom());
            dto.setPm1(entity.getPm1());
            dto.setPm2_5(entity.getPm2_5());
            dto.setPm10(entity.getPm10());
            dto.setCurrent(entity.getCurrent());
            dto.setVolt(entity.getVolt());
            dto.setTemperature(entity.getTemperature());
            dto.setHumidity(entity.getHumidity());
            dto.setMode(entity.getMode());
            dto.setSpeed(entity.getSpeed());
            dto.setPowerStatus(entity.getPowerStatus());
            return dto;
        }).collect(Collectors.toList());
    }
}