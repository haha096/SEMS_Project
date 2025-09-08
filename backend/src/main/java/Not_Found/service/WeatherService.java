package Not_Found.service;

import Not_Found.dto.DustDto;
import Not_Found.key.WeatherForecastKey;
import Not_Found.model.entity.WeatherForecastEntity;
import Not_Found.repository.WeatherForecastRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.json.JSONArray;
import org.json.JSONObject;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class WeatherService {
    private final String SERVICE_KEY = "aRR3w6mDjeHK2c/K0yCtN4sBv9cfvDUUeMGrTzd3yzSdnwZEy7JXg0EWT/EaYLstuzcUPmTMotKVOpP3R3mgqQ==";

    private final WeatherForecastRepository forecastRepo;
    private final DustService dustService;

    public WeatherService(WeatherForecastRepository forecastRepo, DustService dustService) {
        this.forecastRepo = forecastRepo;
        this.dustService = dustService;
    }

    private Double toD(String s){
        if (s == null) return null;
        s = s.trim();
        if (s.isEmpty() || s.equals("-")) return null;  // ← 결측 처리
        try { return Double.valueOf(s); }
        catch (Exception e){ return null; }
    }

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
    @Transactional
    public void saveForecastSnapshot(int locId,
                                     LocalDateTime snapshotMinute,
                                     Double temp1h, Double temp6h, Double temp24h,
                                     Double hum1h,  Double hum6h,  Double hum24h) {

        // 분 단위로 깎은 값 -> 새 변수(ts)로 고정 (final처럼 사용)
        LocalDateTime ts = snapshotMinute.withSecond(0).withNano(0);

        var e = forecastRepo.findByKeyIdAndKeyCurrent(locId, ts).orElseGet(() -> {
            var ne = new WeatherForecastEntity();
            ne.setKey(new Not_Found.key.WeatherForecastKey(locId, ts));
            return ne;
        });

        // 온/습 저장
        e.setTemp1h(temp1h); e.setTemp6h(temp6h); e.setTemp24h(temp24h);
        e.setHum1h(hum1h);   e.setHum6h(hum6h);   e.setHum24h(hum24h);

        // ❗현재 미세먼지를 임시 예측으로 복사
        DustDto d = dustService.getDustData();   // 네가 이미 만든 서비스
        Double pm10 = toD(d.getPm10Value());
        Double pm25 = toD(d.getPm25Value());
        if (pm10 != null) {
            e.setPm10_1h(pm10); e.setPm10_6h(pm10); e.setPm10_24h(pm10);
        }
        if (pm25 != null) {
            e.setPm25_1h(pm25); e.setPm25_6h(pm25); e.setPm25_24h(pm25);
        }
        System.out.println("[DUST] pm10Value=" + d.getPm10Value() + ", pm25Value=" + d.getPm25Value());

        forecastRepo.save(e);
    }

}
