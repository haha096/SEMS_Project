package Not_Found.scheduled;

import Not_Found.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@RequiredArgsConstructor
public class WeatherForecastScheduler {

    private final WeatherService weatherService;
    private static final AtomicBoolean running = new AtomicBoolean(false);
    private static final int LOC_ID = 1;

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void runForecastOnly() {
        if (!running.compareAndSet(false, true)) return;
        try {
            System.out.println("[FORECAST-SCHED] forecast start");
            weatherService.runIndoorForecastAndSave(LOC_ID, 1440);
            System.out.println("[FORECAST-SCHED] forecast done");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            running.set(false);
        }
    }
}
