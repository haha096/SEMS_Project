package Not_Found.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
@Entity
@Table(name = "sensor_data")
public class SensorEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 측정 시각 (초와 나노초는 제외) */
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    public void prePersist() {
        // 저장 직전에 timestamp가 null이면 현재 시각으로 세팅
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now()
                    .withSecond(0)
                    .withNano(0);
        }
    }

    /** 방 이름 (예: "room1") */
    @Column(name = "room", nullable = false, length = 50)
    private String room;

    /** 미세먼지 PM1.0 */
    @Column(name = "pm1", nullable = false)
    private Double pm1;

    /** 미세먼지 PM2.5 */
    @Column(name = "pm2_5", nullable = false)
    private Double pm2_5;

    /** 미세먼지 PM10 */
    @Column(name = "pm10", nullable = false)
    private Double pm10;

    /** 전류 (암페어) */
    @Column(name = "current", nullable = false)
    private Double current;

    /** 전압 (볼트) */
    @Column(name = "volt", nullable = false)
    private Double volt;

    /** 온도 (섭씨) */
    @Column(name = "temperature", nullable = false)
    private Double temperature;

    /** 습도 (%) */
    @Column(name = "humidity", nullable = false)
    private Double humidity;

    /** 모드 ("AUTO" 또는 "MANUAL") */
    @Column(name = "mode", nullable = false, length = 10)
    private String mode;

    /** 수동 모드일 때 1~3, 자동 모드일 때 0 */
    @Column(name = "speed", nullable = false)
    private Integer speed;

    /** 전원 상태 ("ON" 또는 "OFF") */
    @Column(name = "power_status", nullable = false, length = 5)
    private String powerStatus;
}
