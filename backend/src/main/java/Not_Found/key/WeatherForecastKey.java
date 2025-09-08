package Not_Found.key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Embeddable
@Data @NoArgsConstructor @AllArgsConstructor
public class WeatherForecastKey implements Serializable {
    @Column(name = "id")
    private Integer id;

    @Column(name = "`current`")
    private LocalDateTime current;   // 스냅샷 시각
}
