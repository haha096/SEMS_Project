package Not_Found.scheduled;

import Not_Found.service.WeatherService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class WeatherFetchScheduler {

    private final WeatherService weatherService;
    private static final AtomicBoolean running = new AtomicBoolean(false);

    // 위치 고정값 (원하면 yml로 빼도 됨)
    private static final int LOC_ID = 1;
    private static final int NX = 58;
    private static final int NY = 125;

    public WeatherFetchScheduler(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    // 매 분 0초에 실행 (Asia/Seoul 기준)
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void fetchEveryMinute() {
        // 겹치기 방지
        if (!running.compareAndSet(false, true)) return;
        try {
            LocalDateTime now = LocalDateTime.now();
            System.out.println("[WEATHER] fetch start at " + now);
            weatherService.fetchAndSaveCurrent(LOC_ID, NX, NY);
            System.out.println("[WEATHER] fetch done at " + LocalDateTime.now());
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            running.set(false);
        }
    }
}
