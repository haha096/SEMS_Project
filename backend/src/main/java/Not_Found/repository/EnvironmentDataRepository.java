package Not_Found.repository;


import Not_Found.model.entity.EnvironmentEntity;
import Not_Found.model.entity.SensorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnvironmentDataRepository extends JpaRepository<EnvironmentEntity, Long> {
    List<EnvironmentEntity> findAllByTimestampBetween(LocalDateTime start, LocalDateTime end);
    boolean existsByTimestamp(LocalDateTime timestamp);
}