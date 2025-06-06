package Not_Found.repository;

import Not_Found.model.entity.SensorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SensorRepository extends JpaRepository<SensorEntity, Long> {
    // 가장 최근 데이터 1건만 가져오는 메서드
    Optional<SensorEntity> findFirstByOrderByIdDesc();
    List<SensorEntity> findAll();  // 모든 데이터를 리스트로 반환

    // 특정 시각의 센서 데이터 1건 조회
    Optional<SensorEntity> findFirstByTimestamp(LocalDateTime timestamp);

    // 특정 날짜 범위에 해당하는 센서 데이터 리스트 조회 (하루 평균용)
    List<SensorEntity> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    Optional<SensorEntity> findTopByOrderByTimestampDesc();
    Optional<SensorEntity> findTopByTimestampBetween(LocalDateTime start, LocalDateTime end);
    // 예: room1, room2 등 방 이름을 기준으로 최신 데이터 가져오기
    Optional<SensorEntity> findFirstByRoomOrderByTimestampDesc(String room);

    @Query(value = """
    SELECT 
        TIMESTAMPDIFF(SECOND, MIN(timestamp), MAX(timestamp)) AS seconds_diff,
        TIMESTAMPDIFF(MINUTE, MIN(timestamp), MAX(timestamp)) AS minutes_diff,
        TIMESTAMPDIFF(HOUR, MIN(timestamp), MAX(timestamp)) AS hours_diff
    FROM sensor_data
    WHERE current <> 0
    """, nativeQuery = true)
    List<Object[]> getTimeDiff();
}
