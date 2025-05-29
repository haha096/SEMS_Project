package Not_Found.scheduled;

import Not_Found.model.entity.EnvironmentEntity;
import Not_Found.repository.EnvironmentDataRepository;
import Not_Found.repository.SensorRepository;
import Not_Found.service.EnvironmentDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class EnvironmentDataScheduler {

    private final EnvironmentDataService environmentDataService;
    private final SensorRepository sensorRepository;
    private final EnvironmentDataRepository environmentDataRepository;

    // ⏰ 매일 정오의 센서 데이터 저장
    @Scheduled(cron = "0 0 12 * * *")
    public void saveMiddaySensorData() {
        environmentDataService.saveNoonData();
    }

    // 📊 매일 23:59 하루 평균 데이터 저장
    
    //진짜 시마다 값을 가져오는 스케줄러
    //@Scheduled(cron = "0 59 23 * * *")
    
    //테스트용으로 만든 분마다 데이터값을 가져오는 스케줄러
    @Scheduled(cron = "0 * * * * *")
    public void saveDailyAverage() {
        System.out.println("🟢 [스케줄러 실행됨] " + LocalDateTime.now());

        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
        LocalDateTime start = now.minusSeconds(20); // 기존 ±3초 → ±10초로 넓힘
        LocalDateTime end = now.plusSeconds(20);

        System.out.println("📌 현재시간: " + now);

        sensorRepository.findTopByOrderByTimestampDesc().ifPresent(sensor -> {
            EnvironmentEntity data = new EnvironmentEntity();
            data.setSensorDataId(sensor.getId());
            data.setTemperature((float) sensor.getTemp());
            data.setHumidity((float) sensor.getHum());
            data.setDust((float) sensor.getPm25());
            data.setTimestamp(sensor.getTimestamp());

            environmentDataRepository.save(data);
            System.out.println("✅ [환경데이터] 저장 성공: " + sensor.getTimestamp());
        });
    }
}

