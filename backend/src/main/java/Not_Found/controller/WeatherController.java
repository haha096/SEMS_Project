// src/main/java/Not_Found/controller/WeatherController.java
package Not_Found.controller;

import Not_Found.service.WeatherService;
import Not_Found.service.WeatherService.WeatherDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/weather", "/weather"}) // ← /api 프리픽스 추가(겸용)
public class WeatherController {

    private final WeatherService weatherService;

    @Autowired
    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/outdoor")
    public ResponseEntity<?> getOutdoorWeather(
            @RequestParam(defaultValue = "58") int nx,
            @RequestParam(defaultValue = "125") int ny
    ) {
        try {
            WeatherDto dto = weatherService.getCurrentWeather(nx, ny);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body("{\"message\":\"날씨 데이터를 가져오는 중 오류 발생\",\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
