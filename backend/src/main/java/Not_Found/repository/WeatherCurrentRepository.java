package Not_Found.repository;


import Not_Found.model.entity.WeatherCurrentEntity;
import Not_Found.key.WeatherCurrentKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface WeatherCurrentRepository
        extends JpaRepository<WeatherCurrentEntity, WeatherCurrentKey> {

    Optional<WeatherCurrentEntity> findByKeyIdAndKeyCurrent(Integer id, LocalDateTime current);
}
