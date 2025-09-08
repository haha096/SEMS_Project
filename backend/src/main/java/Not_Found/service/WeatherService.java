package Not_Found.service;

import Not_Found.key.WeatherForecastKey;
import Not_Found.model.entity.WeatherForecastEntity;
import Not_Found.repository.WeatherForecastRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.json.JSONArray;
import org.json.JSONObject;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class WeatherService {
    private final String SERVICE_KEY = "aRR3w6mDjeHK2c/K0yCtN4sBv9cfvDUUeMGrTzd3yzSdnwZEy7JXg0EWT/EaYLstuzcUPmTMotKVOpP3R3mgqQ==";

    public String getWeatherData(int nx, int ny) {
        // 1. 날짜 및 시간 구하기 (기상청 기준은 매시간 40분 뒤 발표)
        LocalDateTime now = LocalDateTime.now().minusMinutes(40);
        String baseDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String baseTime = now.format(DateTimeFormatter.ofPattern("HH00"));

        // 2. URL 생성
        String url = String.format(
                "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst" +
                        "?serviceKey=%s&numOfRows=10&pageNo=1&dataType=JSON&base_date=%s&base_time=%s&nx=%d&ny=%d",
                SERVICE_KEY, baseDate, baseTime, nx, ny
        );

        // 3. API 호출
        RestTemplate restTemplate = new RestTemplate();
        String rawJson = restTemplate.getForObject(url, String.class);

        System.out.println("응답 내용:\n" + rawJson);

        // 4. JSON 파싱
        JSONObject json = new JSONObject(rawJson);
        JSONArray items = json.getJSONObject("response")
                .getJSONObject("body")
                .getJSONObject("items")
                .getJSONArray("item");

        String temperature = "";
        String humidity = "";

        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            String category = item.getString("category");
            String value = item.getString("obsrValue");

            if (category.equals("T1H")) {
                temperature = value;
            } else if (category.equals("REH")) {
                humidity = value;
            }
        }

        // 5. 결과 반환 (필요 시 JSON으로 포맷 가능)
        return String.format("온도: %s℃, 습도: %s%%", temperature, humidity);
    }
    
    //실외데이터를 DB안에 넣기 위한 작업
    @Autowired
    private WeatherForecastRepository forecastRepo;

    public void saveForecastSnapshot(int locId,
                                     LocalDateTime snapshotMinute,
                                     Double temp1h, Double temp6h, Double temp24h,
                                     Double hum1h,  Double hum6h,  Double hum24h) {

        // 분 단위로 깎은 값 -> 새 변수(ts)로 고정 (final처럼 사용)
        LocalDateTime ts = snapshotMinute.withSecond(0).withNano(0);

        // 있으면 가져오고, 없으면 새로 만들기 (람다 X)
        WeatherForecastEntity e = forecastRepo
                .findByKeyIdAndKeyCurrent(locId, ts)
                .orElse(null);

        if (e == null) {
            e = new WeatherForecastEntity();
            e.setKey(new WeatherForecastKey(locId, ts));
        }

        e.setTemp1h(temp1h);
        e.setTemp6h(temp6h);
        e.setTemp24h(temp24h);
        e.setHum1h(hum1h);
        e.setHum6h(hum6h);
        e.setHum24h(hum24h);

        forecastRepo.save(e); // 있으면 UPDATE, 없으면 INSERT
    }

}
