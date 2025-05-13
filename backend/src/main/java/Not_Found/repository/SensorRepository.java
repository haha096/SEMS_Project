package Not_Found.repository;

import Not_Found.model.entity.SensorEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SensorRepository extends JpaRepository<SensorEntity, Long> {
    // 가장 최근 데이터 1건만 가져오는 메서드
    Optional<SensorEntity> findFirstByOrderByIdDesc();
    List<SensorEntity> findAll();  // 모든 데이터를 리스트로 반환
}
