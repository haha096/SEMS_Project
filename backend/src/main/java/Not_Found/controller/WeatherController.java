package Not_Found.controller;

import Not_Found.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/weather")
public class WeatherController {

    private final WeatherService weatherService;

    @Autowired
    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/outdoor")
    public ResponseEntity<String> getOutdoorWeather(
            @RequestParam(defaultValue = "58") int nx,
            @RequestParam(defaultValue = "125") int ny
    ) {
        try {
            String result = weatherService.getWeatherData(nx, ny);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("날씨 데이터를 가져오는 중 오류 발생: " + e.getMessage());
        }
    }

    //실외데이터 DB에 넣기
    @PostMapping("/forecast/test-insert")
    public String testInsert() {
        var now = java.time.LocalDateTime.now().withSecond(0).withNano(0);
        weatherService.saveForecastSnapshot(
                1, now, 26.9, 24.8, null, 60.0, 65.0, null
        );
        return "ok";
    }
}