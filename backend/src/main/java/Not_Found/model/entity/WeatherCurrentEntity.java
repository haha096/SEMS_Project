package Not_Found.model.entity;

import Not_Found.key.WeatherCurrentKey;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "weather_current")
@Data @NoArgsConstructor
public class WeatherCurrentEntity {

    @EmbeddedId
    private WeatherCurrentKey key;

    private Double temp;
    private Double hum;
    private Double pm10;
    private Double pm25;
}
