package Not_Found.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
@Entity // table을 create해주기도한다 없으면.
@Table(name="sensor_data") //users table생성
public class SensorEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // 새로운 필드 추가: timestamp
    @Column(name = "timestamp")
    private LocalDateTime timestamp;
    // 엔티티 생성 시 timestamp 컬럼 생성
    @PrePersist
    public void prePersist() {
        this.timestamp = LocalDateTime.now().withSecond(0);
        //* 초(second)와 나노초(nanosecond)는 제외하고 '시:분'까지만 저장되도록 처리한다.
    }

    public double getPm25() {
        return this.pm2_5;
    }


    private double current;
    private double temp;
    private double hum;
    private String mode;
    private int speed;
    private double pm1_0;
    private double pm2_5;
    private double pm10;
    private double powerUsage;
}
