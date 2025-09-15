package Not_Found.repository;


import Not_Found.model.entity.WeatherCurrentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeatherCurrentRepository extends JpaRepository<WeatherCurrentEntity, Long> {
    Optional<WeatherCurrentEntity> findByLocIdAndObservedAt(Integer locId, LocalDateTime observedAt);
    Optional<WeatherCurrentEntity> findTopByLocIdOrderByObservedAtDesc(int locId);
    List<WeatherCurrentEntity> findByLocIdAndObservedAtAfterOrderByObservedAtAsc(Integer locId, LocalDateTime since);
}
