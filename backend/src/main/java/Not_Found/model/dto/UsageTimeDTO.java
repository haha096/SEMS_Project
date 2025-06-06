package Not_Found.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UsageTimeDTO {
    // 사용 시간 정보 추가
    private int seconds;
    private int minutes;
    private int hours;
}
