package Not_Found.service;

import Not_Found.model.dto.UsageTimeDTO;
import Not_Found.model.entity.EnvironmentEntity;
import Not_Found.model.entity.SensorEntity;
import Not_Found.repository.EnvironmentDataRepository;
import Not_Found.repository.SensorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
//@RequiredArgsConstructor
public class EnvironmentDataService {

    private final SensorRepository sensorRepository;
    private final EnvironmentDataRepository environmentDataRepository;

    @Autowired
    public EnvironmentDataService(SensorRepository sensorRepository,EnvironmentDataRepository environmentDataRepository) {
        this.sensorRepository = sensorRepository;
        this.environmentDataRepository = environmentDataRepository;
    }

    // 1. 특정 시각 (예: 매일 정오)의 센서 데이터를 저장
    public void saveNoonData() {
        LocalDateTime targetTime = LocalDateTime.now()
                .withHour(12).withMinute(0).withSecond(0).withNano(0);

        LocalDateTime start = targetTime.minusSeconds(3);
        LocalDateTime end   = targetTime.plusSeconds(3);

        // SensorEntity에서 새로운 getter(getTemperature 등)를 사용
        sensorRepository.findTopByTimestampBetween(start, end).ifPresent(sensor -> {
            EnvironmentEntity data = new EnvironmentEntity();
            data.setSensorDataId(sensor.getId());
            data.setTemperature(sensor.getTemperature()); // Double 그대로 대입
            data.setHumidity(   sensor.getHumidity());    // Double 그대로 대입
            data.setDust(       sensor.getPm2_5());       // Double 그대로 대입
            data.setTimestamp(sensor.getTimestamp());

            environmentDataRepository.save(data);
            System.out.println("✅ 센서 데이터를 환경 테이블에 저장 완료!");
            System.out.println("⏰ 센서 조회 시도: " + start + " ~ " + end);
        });

        // 만약 해당 시간에 센서 데이터가 없을 경우 로깅
        Optional<SensorEntity> opt = sensorRepository.findTopByTimestampBetween(start, end);
        if (opt.isEmpty()) {
            System.out.println("❌ 해당 시간에 센서 데이터 없음!");
        }
    }

    // 2. 하루 평균 센서 데이터를 저장
    public void saveDailyAverage() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end   = start.plusDays(1);
        System.out.println("✅ [스케줄러] 평균 저장 시도됨");

        List<SensorEntity> sensors = sensorRepository.findByTimestampBetween(start, end);
        System.out.println("조회된 센서 수: " + sensors.size());
        if (sensors.isEmpty()) {
            System.out.println("⚠ 센서 데이터 없음. 저장 안함");
            return;
        }

        // 새 getter 이름으로 평균 계산
        double avgTemp = sensors.stream()
                .mapToDouble(SensorEntity::getTemperature)
                .average()
                .orElse(0.0);
        double avgHum  = sensors.stream()
                .mapToDouble(SensorEntity::getHumidity)
                .average()
                .orElse(0.0);
        double avgDust = sensors.stream()
                .mapToDouble(SensorEntity::getPm2_5)
                .average()
                .orElse(0.0);

        EnvironmentEntity data = new EnvironmentEntity();
        data.setAvgTemperature(avgTemp); // Double 그대로 대입
        data.setAvgHumidity(avgHum);     // Double 그대로 대입
        data.setAvgDust(avgDust);        // Double 그대로 대입
        data.setTimestamp(LocalDateTime.now().withSecond(0).withNano(0));

        environmentDataRepository.save(data);
        System.out.println("✅ 하루 평균 환경 데이터 저장 완료!");
    }

    public UsageTimeDTO getUsageTime() {
        try {
            List<Object[]> resultList = sensorRepository.getTimeDiff();

            if (resultList == null || resultList.isEmpty()) {
                System.err.println("getTimeDiff 결과가 null 이거나 비어있음");
                return new UsageTimeDTO(0, 0, 0);
            }

            Object[] result = resultList.get(0); // 첫 번째 결과만 사용
            if (result.length < 3) {
                System.err.println("getTimeDiff 결과 배열 크기가 부족함");
                return new UsageTimeDTO(0, 0, 0);
            }

            int seconds = ((Number) result[0]).intValue();
            int minutes = ((Number) result[1]).intValue();
            int hours = ((Number) result[2]).intValue();

            System.out.println("seconds=" + seconds + ", minutes=" + minutes + ", hours=" + hours);

            return new UsageTimeDTO(seconds, minutes, hours);
        } catch (Exception e) {
            e.printStackTrace();
            return new UsageTimeDTO(0, 0, 0);
        }
    }
}