package Not_Found.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class EnvironmentDataDTO {

    /** 측정 시각 */
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    /** 실시간 온도 */
    @JsonProperty("temperature")
    private Double temperature;

    /** 실시간 습도 */
    @JsonProperty("humidity")
    private Double humidity;

    /** 실시간 미세먼지(PM2.5) */
    @JsonProperty("dust")
    private Double dust;
}
