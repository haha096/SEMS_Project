package com.gsem.backend.controller;

import com.gsem.backend.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

//@RestController
//public class WeatherController {
//    private final WeatherService weatherService;
//
//    public WeatherController(WeatherService weatherService) {
//        this.weatherService = weatherService;
//    }
//
//    @GetMapping("/weather/outdoor")
//    public ResponseEntity<String> getOutdoorWeather(
//            @RequestParam(defaultValue = "58") int nx,
//            @RequestParam(defaultValue = "125") int ny
//    ) {
//        String result = weatherService.getWeatherData(nx, ny);
//        return ResponseEntity.ok(result);
//    }
//}

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
