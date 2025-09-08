package Not_Found.repository;

import Not_Found.model.entity.WeatherForecastEntity;
import Not_Found.key.WeatherForecastKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface WeatherForecastRepository extends JpaRepository<WeatherForecastEntity, WeatherForecastKey> {
    Optional<WeatherForecastEntity> findByKeyIdAndKeyCurrent(Integer id, LocalDateTime current);
}
