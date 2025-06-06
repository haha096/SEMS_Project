package Not_Found.service;

import Not_Found.model.dto.SensorData;
import Not_Found.model.dto.UsageTimeDTO;
import Not_Found.model.entity.SensorEntity;
import Not_Found.repository.SensorRepository;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SensorService {
    private final SensorRepository sensorRepository;

    // 생성자 주입 방식
    public SensorService(SensorRepository sensorRepository) {
        this.sensorRepository = sensorRepository;
    }

    /** DB에 Sensor 데이터를 저장 */
    @Transactional
    public SensorEntity saveSensorData(SensorData dto) {
        // DTO → Entity 변환
        SensorEntity entity = new SensorEntity();
        entity.setCurrent(dto.getCurrent());
        entity.setVolt(dto.getVolt());
        entity.setTemp(dto.getTemp());
        entity.setHum(dto.getHum());
        entity.setMode(dto.getMode());
        entity.setSpeed(dto.getSpeed());
        entity.setPower(dto.getPower());
        entity.setPm1_0(dto.getPm1_0());
        entity.setPm2_5(dto.getPm2_5());
        entity.setPm10(dto.getPm10());
        entity.setPowerUsage(dto.getPowerUsage());

        // Repository를 통해 데이터 저장
        return sensorRepository.save(entity);
    }

    /** DB에서 최신 센서 데이터 조회 */
    @Transactional(readOnly = true)
    public SensorData getLatestSensorData() {
        // 최신 데이터 조회
        return sensorRepository.findFirstByOrderByIdDesc()
                .map(entity -> {
                    // Entity → DTO 변환
                    SensorData dto = new SensorData();
                    dto.setId(entity.getId());
                    // timestamp 변환
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                    dto.setTimestamp(entity.getTimestamp().format(formatter));  // LocalDateTime을 String으로 포맷
                    dto.setCurrent(entity.getCurrent());
                    dto.setVolt(entity.getVolt());
                    dto.setTemp(entity.getTemp());
                    dto.setHum(entity.getHum());
                    dto.setMode(entity.getMode());
                    dto.setSpeed(entity.getSpeed());
                    dto.setPower(entity.getPower());
                    dto.setPm1_0(entity.getPm1_0());
                    dto.setPm2_5(entity.getPm2_5());
                    dto.setPm10(entity.getPm10());
                    dto.setPowerUsage(entity.getPowerUsage());
                    return dto;
                })
                .orElseGet(SensorData::new);  // 데이터 없으면 빈 DTO 반환
    }

    /** DB에서 모든 센서 데이터 조회 */
    @Transactional(readOnly = true)
    public List<SensorData> getAllSensorData() {
        // 전체 데이터 조회
        List<SensorEntity> entities = sensorRepository.findAll();
        return entities.stream().map(entity -> {
            // Entity → DTO 변환
            SensorData dto = new SensorData();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            dto.setTimestamp(entity.getTimestamp().format(formatter));  // LocalDateTime을 String으로 포맷
            dto.setId(entity.getId());
            dto.setCurrent(entity.getCurrent());
            dto.setVolt(entity.getVolt());
            dto.setTemp(entity.getTemp());
            dto.setHum(entity.getHum());
            dto.setMode(entity.getMode());
            dto.setSpeed(entity.getSpeed());
            dto.setPower(entity.getPower());
            dto.setPm1_0(entity.getPm1_0());
            dto.setPm2_5(entity.getPm2_5());
            dto.setPm10(entity.getPm10());
            dto.setPowerUsage(entity.getPowerUsage());
            return dto;
        }).collect(Collectors.toList());  // 데이터 없으면 빈 List<SensorData>로 변환
    }


}
