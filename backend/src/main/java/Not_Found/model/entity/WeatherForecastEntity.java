package Not_Found.model.entity;

import Not_Found.key.WeatherForecastKey;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "weather_forecast")
@Data @NoArgsConstructor
public class WeatherForecastEntity {

    @EmbeddedId
    private WeatherForecastKey key;

    @Column(name="temp_1h")  private Double temp1h;
    @Column(name="temp_6h")  private Double temp6h;
    @Column(name="temp_24h") private Double temp24h;

    @Column(name="hum_1h")   private Double hum1h;
    @Column(name="hum_6h")   private Double hum6h;
    @Column(name="hum_24h")  private Double hum24h;

    // (있으면 쓰고, 없으면 안 써도 됨)
    @Column(name="pm10_1h")  private Double pm10_1h;
    @Column(name="pm10_6h")  private Double pm10_6h;
    @Column(name="pm10_24h") private Double pm10_24h;
    @Column(name="pm25_1h")  private Double pm25_1h;
    @Column(name="pm25_6h")  private Double pm25_6h;
    @Column(name="pm25_24h") private Double pm25_24h;
}
