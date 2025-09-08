package Not_Found.key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Embeddable
@Data @NoArgsConstructor @AllArgsConstructor
public class WeatherCurrentKey implements Serializable {
    @Column(name = "id")
    private Integer id;

    // 컬럼명이 current 이라서 백틱으로 매핑
    @Column(name = "`current`")
    private LocalDateTime current;
}
