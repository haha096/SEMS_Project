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

    @Column(name = "sensor_data_id", nullable = false)
    private Long sensorDataId;

    /** 센서에서 받은 실시간 온도 */
    @Column(name = "temperature", nullable = false)
    private Double temperature;

    /** 센서에서 받은 실시간 습도 */
    @Column(name = "humidity", nullable = false)
    private Double humidity;

    /** 센서에서 받은 실시간 미세먼지(PM2.5) */
    @Column(name = "dust", nullable = false)
    private Double dust;

    /** 측정 시각 */
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    /** 하루 평균용 온도 */
    @Column(name = "avg_temperature")
    private Double avgTemperature;

    /** 하루 평균용 습도 */
    @Column(name = "avg_humidity")
    private Double avgHumidity;

    /** 하루 평균용 미세먼지(PM2.5) */
    @Column(name = "avg_dust")
    private Double avgDust;
}
