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

    // 매일 정오의 센서 데이터 저장
    @Scheduled(cron = "0 0 12 * * *")
    public void saveMiddaySensorData() {
        environmentDataService.saveNoonData();
    }

    // 테스트용: 매 분 새 센서 데이터가 있으면 environment_data에 저장
    @Scheduled(cron = "0 * * * * *")
    public void saveSensorDataWithDeduplication() {
        System.out.println("[스케줄러 실행됨] " + LocalDateTime.now());

        // 현재 시각 (초·나노 제거)
        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
        System.out.println("현재시간: " + now);

        // 센서 테이블에서 가장 최신 한 건 조회
        sensorRepository.findTopByOrderByTimestampDesc().ifPresent(sensor -> {
            // 중복 저장 방지: 같은 timestamp가 이미 environment_data에 존재하면 스킵
            if (environmentDataRepository.existsByTimestamp(sensor.getTimestamp())) {
                System.out.println("이미 저장된 시간 데이터입니다. 저장 생략: " + sensor.getTimestamp());
                return;
            }

            EnvironmentEntity data = new EnvironmentEntity();
            data.setSensorDataId(sensor.getId());
            data.setTemperature(sensor.getTemperature());
            data.setHumidity(   sensor.getHumidity());
            data.setDust(       sensor.getPm2_5());
            data.setTimestamp(sensor.getTimestamp());

            environmentDataRepository.save(data);
            System.out.println("[환경데이터] 저장 성공: " + sensor.getTimestamp());
        });
    }
}