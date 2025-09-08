package Not_Found.repository;


import Not_Found.model.entity.WeatherCurrentEntity;
import Not_Found.key.WeatherCurrentKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeatherCurrentRepository extends JpaRepository<WeatherCurrentEntity, WeatherCurrentKey> {
    WeatherCurrentEntity findTopByKeyIdOrderByKeyCurrentDesc(Integer id);
}
