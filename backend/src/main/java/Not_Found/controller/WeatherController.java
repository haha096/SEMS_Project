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
    @RequestMapping(value = "/forecast/test-insert", method = {RequestMethod.GET, RequestMethod.POST})
    public String testInsert() {
        var now = java.time.LocalDateTime.now()
                .withSecond(0).withNano(0);
        weatherService.saveForecastSnapshot(
                1, now, 26.9, 24.8, null, 60.0, 65.0, null
        );
        return "ok";
    }

    @GetMapping("/forecast/fetch")
    public String fetch(@RequestParam(defaultValue = "1") int locId,
                        @RequestParam(defaultValue = "58") int nx,
                        @RequestParam(defaultValue = "125") int ny) {
        weatherService.fetchAndSaveCurrent(locId, nx, ny);
        return "ok";
    }

    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Autowired Not_Found.repository.WeatherForecastRepository wfRepo;

    @GetMapping("/debug/db")
    public String whichDb() {
        return "DB=" + jdbc.queryForObject("SELECT DATABASE()", String.class);
    }

    @GetMapping("/forecast/peek")
    public Object peek() {
        return wfRepo.findAll(); // 최근 몇 개만 보고 싶으면 메서드 추가해서 쓰면 됨
    }

    @GetMapping("/forecast/insert-demo")
    public String insertDemo() {
        var now = java.time.LocalDateTime.now().withSecond(0).withNano(0);
        weatherService.saveForecastSnapshot(1, now, 26.9, 24.8, null, 60.0, 65.0, null);
        return "ok-demo";
    }

    // 2) 전체 건수 보기
    @GetMapping("/forecast/count")
    public long count() { return wfRepo.count(); }

    // 3) 저장된 내용 보기
    @GetMapping("/forecast/peek5")
    public Object peek5() { return wfRepo.findAll().stream().limit(5).toList(); }
}