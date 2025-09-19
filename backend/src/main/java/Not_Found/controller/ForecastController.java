package Not_Found.controller;

import Not_Found.repository.WeatherForecastRepository;
import Not_Found.service.ForecastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final ForecastService forecastService;
    private final WeatherForecastRepository wfRepo;

    /** 실내/실외 합친 입력 시계열 확인(디버그용) */
    @GetMapping(value="/series/indoor-outdoor", produces="application/json")
    public List<Map<String,Object>> seriesIO(
            @RequestParam(defaultValue="1") int locId,
            @RequestParam(defaultValue="1") int days
    ) {
        return forecastService.buildIndoorOutdoorSeries(locId, days);
    }

    /** FastAPI 예측만 확인(저장 X) */
    @GetMapping("/preview")
    public List<Map<String,Object>> preview(
            @RequestParam(defaultValue="1") int locId,
            @RequestParam(defaultValue="60") int horizon
    ) {
        return forecastService.callIndoorForecast(locId, horizon);
    }

    /** 예측 실행 & DB 저장 (1h/6h/24h) */
    @GetMapping("/run-indoor")
    public String runIndoor(@RequestParam(defaultValue="1") int locId,
                            @RequestParam(defaultValue="1440") int horizon) {
        forecastService.runIndoorForecastAndSave(locId, horizon);
        return "ok";
    }

    // 디버그용
    @GetMapping("/peek5")
    public Object peek5() { return wfRepo.findAll().stream().limit(5).toList(); }

    @GetMapping("/count")
    public long count() { return wfRepo.count(); }
}
