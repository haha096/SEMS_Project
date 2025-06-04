package Not_Found.model.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "environment_data")
public class EnvironmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sensor_data_id")
    private Long sensorDataId;

    @Column(name = "temperature")
    private Float temperature;

    @Column(name = "humidity")
    private Float humidity;

    @Column(name = "dust")
    private Float dust;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "avg_temperature")
    private Float avgTemperature;

    @Column(name = "avg_humidity")
    private Float avgHumidity;

    @Column(name = "avg_dust")
    private Float avgDust;
    // 생성자, Getter, Setter 또는 @Getter @Setter 사용해도 됨
}
