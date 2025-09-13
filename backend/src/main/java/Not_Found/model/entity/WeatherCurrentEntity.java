package Not_Found.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "weather_current",
        uniqueConstraints = @UniqueConstraint(name="uq_loc_time", columnNames={"loc_id","observed_at"})
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class WeatherCurrentEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="loc_id", nullable=false)
    private Integer locId;

    @Column(name="observed_at", nullable=false)
    private LocalDateTime observedAt;

    private Double temp;
    private Double hum;
    private Double pm10;
    private Double pm25;
}
