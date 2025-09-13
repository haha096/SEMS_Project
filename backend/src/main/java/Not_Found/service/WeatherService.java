package Not_Found.service;

import Not_Found.dto.DustDto;
import Not_Found.key.WeatherForecastKey;
import Not_Found.model.entity.WeatherCurrentEntity;
import Not_Found.model.entity.WeatherForecastEntity;
import Not_Found.repository.WeatherCurrentRepository;
import Not_Found.repository.WeatherForecastRepository;
import Not_Found.repository.EnvironmentDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class WeatherService {
    private final String SERVICE_KEY = "aRR3w6mDjeHK2c/K0yCtN4sBv9cfvDUUeMGrTzd3yzSdnwZEy7JXg0EWT/EaYLstuzcUPmTMotKVOpP3R3mgqQ==";


    private final WeatherForecastRepository forecastRepo;
    private final WeatherCurrentRepository currentRepo;
    private final DustService dustService;
    private final EnvironmentDataRepository environmentDataRepository;

    public WeatherService(WeatherForecastRepository forecastRepo,
                          WeatherCurrentRepository currentRepo,
                          DustService dustService,
                          EnvironmentDataRepository environmentDataRepository) {
        this.forecastRepo = forecastRepo;
        this.currentRepo = currentRepo;
        this.dustService = dustService;
        this.environmentDataRepository = environmentDataRepository;
    }

    private Double toD(String s) {
        if (s == null) return null;
        s = s.trim();
        if (s.isEmpty() || s.equals("-")) return null;  // ← 결측 처리
        try {
            return Double.valueOf(s);
        } catch (Exception e) {
            return null;
        }
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
                                     Double hum1h, Double hum6h, Double hum24h) {

        // 분 단위로 깎은 값 -> 새 변수(ts)로 고정 (final처럼 사용)
        LocalDateTime ts = snapshotMinute.withSecond(0).withNano(0);

        var e = forecastRepo.findByKeyIdAndKeyCurrent(locId, ts).orElseGet(() -> {
            var ne = new WeatherForecastEntity();
            ne.setKey(new Not_Found.key.WeatherForecastKey(locId, ts));
            return ne;
        });

        // 온/습 저장
        e.setTemp1h(temp1h);
        e.setTemp6h(temp6h);
        e.setTemp24h(temp24h);
        e.setHum1h(hum1h);
        e.setHum6h(hum6h);
        e.setHum24h(hum24h);

        // ❗현재 미세먼지를 임시 예측으로 복사
        DustDto d = dustService.getDustData();   // 네가 이미 만든 서비스
        Double pm10 = toD(d.getPm10Value());
        Double pm25 = toD(d.getPm25Value());
        if (pm10 != null) {
            e.setPm10_1h(pm10);
            e.setPm10_6h(pm10);
            e.setPm10_24h(pm10);
        }
        if (pm25 != null) {
            e.setPm25_1h(pm25);
            e.setPm25_6h(pm25);
            e.setPm25_24h(pm25);
        }
        System.out.println("[DUST] pm10Value=" + d.getPm10Value() + ", pm25Value=" + d.getPm25Value());

        forecastRepo.save(e);
    }


    @Transactional
    public void fetchAndSaveCurrent(int locId, int nx, int ny) {
        LocalDateTime base = LocalDateTime.now().minusMinutes(40);
        String baseDate = base.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String baseTime = base.format(DateTimeFormatter.ofPattern("HH00"));

        // 1) URI 빌드
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst")
                .queryParam("serviceKey", SERVICE_KEY)
                .queryParam("numOfRows", 100)
                .queryParam("pageNo", 1)
                .queryParam("dataType", "JSON")
                .queryParam("base_date", baseDate)
                .queryParam("base_time", baseTime)
                .queryParam("nx", nx)
                .queryParam("ny", ny)
                .encode()     // SERVICE_KEY가 '원본'이면 .encode().build(); 이미 인코딩된 키면 .build(true)
                .build()
                .toUri();

        // 2) 호출 시 uri 사용!  (기존의 String url 변수는 완전히 삭제)
        String raw = new RestTemplate().getForObject(uri, String.class);

        // 3) 이하 JSON 파싱/DB 저장은 그대로
        JSONObject json = new JSONObject(raw);
        JSONArray items = json.getJSONObject("response")
                .getJSONObject("body")
                .getJSONObject("items")
                .getJSONArray("item");

        String t1h = null, reh = null;
        for (int i = 0; i < items.length(); i++) {
            JSONObject it = items.getJSONObject(i);
            String cat = it.getString("category");
            String val = it.get("obsrValue").toString();
            if ("T1H".equals(cat)) t1h = val;
            if ("REH".equals(cat)) reh = val;
        }

        DustDto d = dustService.getDustData();
        Double pm10 = toD(d.getPm10Value());
        Double pm25 = toD(d.getPm25Value());

        LocalDateTime ts = LocalDateTime.now().withSecond(0).withNano(0);

        var e = currentRepo.findByLocIdAndObservedAt(locId, ts)
                .orElseGet(() -> WeatherCurrentEntity.builder()
                        .locId(locId).observedAt(ts).build());

        e.setTemp(toD(t1h));
        e.setHum(toD(reh));
        e.setPm10(pm10);
        e.setPm25(pm25);

        currentRepo.save(e);
    }

    @Transactional(readOnly = true)
    public List<Map<String,Object>> buildSeriesForForecast(int locId, int days){
        var since = LocalDateTime.now().minusDays(days).withSecond(0).withNano(0);
        var rows = currentRepo.findByLocIdAndObservedAtAfterOrderByObservedAtAsc(locId, since);
        var list = new java.util.ArrayList<Map<String,Object>>();
        for (var r : rows) {
            var m = new java.util.HashMap<String,Object>();
            m.put("ts", r.getObservedAt().toString()); // ISO8601 문자열 (예: 2025-09-13T15:01:00)
            m.put("out_temp", r.getTemp());
            m.put("out_hum",  r.getHum());
            list.add(m);
        }
        return list;
    }

    //실외데이터와 실내데이터를 가지고 예측데이터 생성
    private static LocalDateTime bucket10(LocalDateTime t) {
        int m = (t.getMinute() / 10) * 10;
        return t.withSecond(0).withNano(0).withMinute(m);
    }

    // 실내+실외 시리즈 합치기 (FastAPI에 보낼 입력 생성)
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.List<java.util.Map<String,Object>> buildIndoorOutdoorSeries(int locId, int days){
        var since = java.time.LocalDateTime.now().minusDays(days).withSecond(0).withNano(0);

        // 실외: weather_current
        var outRows = currentRepo.findByLocIdAndObservedAtAfterOrderByObservedAtAsc(locId, since);

        // 실내: environment_data (기간 조회)
        var start = since;
        var end   = java.time.LocalDateTime.now().withSecond(0).withNano(0);
        var inRows = environmentDataRepository.findAllByTimestampBetween(start, end);

        var map = new java.util.TreeMap<java.time.LocalDateTime, java.util.Map<String,Object>>();

        // 실외 넣기
        for (var r : outRows) {
            var ts = bucket10(r.getObservedAt());
            var m = map.computeIfAbsent(ts, k -> new java.util.HashMap<>());
            m.put("ts", ts.toString());
            m.put("out_temp", r.getTemp());
            m.put("out_hum",  r.getHum());
        }

        // 실내 넣기 (avg_* 우선, 없으면 raw 사용)
        for (var e : inRows) {
            var ts = bucket10(e.getTimestamp());
            var m = map.computeIfAbsent(ts, k -> new java.util.HashMap<>());
            m.put("ts", ts.toString());
            Double inTemp = (e.getAvgTemperature() != null) ? e.getAvgTemperature() : e.getTemperature();
            Double inHum  = (e.getAvgHumidity()    != null) ? e.getAvgHumidity()    : e.getHumidity();
            m.put("in_temp", inTemp);
            m.put("in_hum",  inHum);
            // (dust도 쓰고 싶으면 여기서 m.put("in_dust", ...) 등으로 추가 가능)
        }

        return new java.util.ArrayList<>(map.values()); // ts 오름차순
    }

}
