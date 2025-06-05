package Not_Found.controller;


import Not_Found.model.dto.EnvironmentDataDTO;
import Not_Found.model.entity.EnvironmentEntity;
import Not_Found.repository.EnvironmentDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/environment")
@RequiredArgsConstructor
public class EnvironmentDataController {

    private final EnvironmentDataRepository repository;

    // ✅ 전체 조회 or 기간 필터 조회
    @GetMapping
    public ResponseEntity<List<EnvironmentDataDTO>> getEnvironmentData(
            @RequestParam(required = false)
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate start,

            @RequestParam(required = false)
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end
    ) {
        LocalDateTime startTime = (start != null) ? start.atStartOfDay() : LocalDate.now().minusDays(1).atStartOfDay();
        LocalDateTime endTime = (end != null) ? end.plusDays(1).atStartOfDay() : LocalDate.now().atStartOfDay();

        List<EnvironmentEntity> entities = repository.findAllByTimestampBetween(startTime, endTime);

        List<EnvironmentDataDTO> result = entities.stream()
                .map(e -> new EnvironmentDataDTO(
                        e.getTimestamp(),
                        e.getTemperature(),
                        e.getHumidity(),
                        e.getDust()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
