package Not_Found.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class EnvironmentDataDTO {
    private LocalDateTime timestamp;
    private float temperature;
    private float humidity;
    private float dust;
}
