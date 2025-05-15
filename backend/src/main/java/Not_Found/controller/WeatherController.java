package Not_Found.controller;

import Not_Found.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}
