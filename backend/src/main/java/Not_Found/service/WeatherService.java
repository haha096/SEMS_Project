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
import org.springframework.http.*;

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
        try {
            DustDto d = dustService.getDustData();
            Double pm10 = toD(d.getPm10Value());
            Double pm25 = toD(d.getPm25Value());
            if (pm10 != null) { e.setPm10_1h(pm10); e.setPm10_6h(pm10); e.setPm10_24h(pm10); }
            if (pm25 != null) { e.setPm25_1h(pm25); e.setPm25_6h(pm25); e.setPm25_24h(pm25); }
        } catch (Exception ex) {
            System.out.println("[DUST] 호출 실패 - 예보 저장은 계속 진행: " + ex.getMessage());
        }

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

    private static LocalDateTime bucket1(LocalDateTime t) {
        return t.withSecond(0).withNano(0);
    }

    // 예측 리스트에서 target 시각과 가장 가까운 yhat을 뽑아오기
    private Double pickNearestYhat(java.util.List<java.util.Map<String,Object>> preds,
                                   LocalDateTime target) {
        if (preds == null || preds.isEmpty()) return null;
        var fmt = java.time.format.DateTimeFormatter.ISO_DATE_TIME;

        Double bestVal = null;
        long bestDiff = Long.MAX_VALUE;

        for (var p : preds) {
            Object tsObj = p.get("ts");
            Object yObj  = p.get("yhat");
            if (tsObj == null || yObj == null) continue;

            LocalDateTime ts;
            try { ts = LocalDateTime.parse(tsObj.toString(), fmt); }
            catch (Exception ignore) { continue; }

            long diff = Math.abs(java.time.Duration.between(target, ts).toMinutes());
            if (diff < bestDiff) {
                bestDiff = diff;
                try { bestVal = Double.valueOf(yObj.toString()); } catch (Exception ignore) {}
            }
        }
        return bestVal;
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
        }

        return new java.util.ArrayList<>(map.values()); // ts 오름차순
    }

    /** 실내(in_temp/in_hum) 예측을 FastAPI에 요청해서 weather_forecast에 저장 */
    @org.springframework.transaction.annotation.Transactional
    public void runIndoorForecastAndSave(int locId, int horizonMinutes) {
        // 1) 예측 입력 시계열(실외+실내) 만들기 (최근 1~3일 정도가 무난)
        var series = buildIndoorOutdoorSeries(locId, 3);
        if (series.isEmpty()) {
            System.out.println("[FORECAST] 입력 시리즈가 비어있음");
            return;
        }

        // 2) FastAPI 호출 준비
        var rt = new org.springframework.web.client.RestTemplate();
        var headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

        String url = "http://localhost:8001/forecast/gbdt";

        // 2-1) 온도(in_temp) 예측
        var bodyTemp = new java.util.HashMap<String,Object>();
        bodyTemp.put("freq", "10min");
        bodyTemp.put("horizon_minutes", horizonMinutes);   // 60=1h, 360=6h, 1440=24h
        bodyTemp.put("target", "in_temp");
        bodyTemp.put("series", series);
        var reqTemp = new org.springframework.http.HttpEntity<>(bodyTemp, headers);
        var respTemp = rt.postForEntity(url, reqTemp, java.util.List.class);
        @SuppressWarnings("unchecked")
        var predsTemp = (java.util.List<java.util.Map<String,Object>>) respTemp.getBody();

        // 2-2) 습도(in_hum) 예측
        var bodyHum = new java.util.HashMap<String,Object>();
        bodyHum.put("freq", "10min");
        bodyHum.put("horizon_minutes", horizonMinutes);
        bodyHum.put("target", "in_hum");
        bodyHum.put("series", series);
        var reqHum = new org.springframework.http.HttpEntity<>(bodyHum, headers);
        var respHum = rt.postForEntity(url, reqHum, java.util.List.class);
        @SuppressWarnings("unchecked")
        var predsHum = (java.util.List<java.util.Map<String,Object>>) respHum.getBody();

        // 3) 현재 10분 버킷 기준으로 +1h/+6h/+24h 값을 뽑기
        var latestOpt = currentRepo.findTopByLocIdOrderByObservedAtDesc(locId);
        var base = latestOpt
                .map(e -> bucket1(e.getObservedAt()))
                .orElse(bucket1(java.time.LocalDateTime.now()));
        var t1h  = pickNearestYhat(predsTemp, base.plusHours(1));
        var t6h  = pickNearestYhat(predsTemp, base.plusHours(6));
        var t24h = pickNearestYhat(predsTemp, base.plusHours(24));
        var h1h  = pickNearestYhat(predsHum,  base.plusHours(1));
        var h6h  = pickNearestYhat(predsHum,  base.plusHours(6));
        var h24h = pickNearestYhat(predsHum,  base.plusHours(24));

        // 4) weather_forecast에 저장 (미세먼지는 기존 로직대로 서비스 내에서 채워짐)
        saveForecastSnapshot(locId, base, t1h, t6h, t24h, h1h, h6h, h24h);

        System.out.println("[FORECAST] base=" + base +
                " t1h=" + t1h + " t6h=" + t6h + " t24h=" + t24h +
                " h1h=" + h1h + " h6h=" + h6h + " h24h=" + h24h);

        if (t1h==null && t6h==null && t24h==null && h1h==null && h6h==null && h24h==null) {
            System.out.println("[FORECAST] 모두 null → 저장 스킵");
            return;
        }
    }

    // FastAPI에 예측을 요청해서 "미래 실내값 리스트"만 돌려주는 미리보기용 (DB 저장 안 함)
    public java.util.List<java.util.Map<String,Object>> callIndoorForecast(int locId, int horizonMinutes) {
        // 1) 실내+실외 시계열
        var series = buildIndoorOutdoorSeries(locId, 3); // 최근 3일; 필요시 조정
        // * FastAPI 쪽에 naive fallback이 있으므로 series 길이가 짧아도 그대로 보냄

        // 2) 요청 바디
        var body = new java.util.HashMap<String,Object>();
        body.put("freq", "10min");
        body.put("horizon_minutes", horizonMinutes);
        body.put("target", "in_temp"); // 실내 온도 예측; 습도면 "in_hum"
        body.put("series", series);

        // 3) HTTP 호출
        var headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        var entity = new org.springframework.http.HttpEntity<>(body, headers);

        var rt = new org.springframework.web.client.RestTemplate();
        @SuppressWarnings("unchecked")
        var preds = (java.util.List<java.util.Map<String,Object>>) rt.postForObject(
                "http://localhost:8001/forecast/gbdt",
                entity,
                java.util.List.class
        );
        return (preds == null) ? java.util.List.of() : preds;
    }

}
