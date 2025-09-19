package Not_Found.service;

import Not_Found.dto.DustDto;
import Not_Found.model.entity.WeatherForecastEntity;
import Not_Found.repository.EnvironmentDataRepository;
import Not_Found.repository.WeatherCurrentRepository;
import Not_Found.repository.WeatherForecastRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ForecastService {

    private final WeatherForecastRepository forecastRepo;
    private final WeatherCurrentRepository currentRepo;
    private final EnvironmentDataRepository environmentDataRepository;
    private final DustService dustService;
    private final RestTemplate restTemplate;

    private List<Map<String,Object>> callFastApi(
            List<Map<String,Object>> series, int horizon, String target) {
        try {
            var headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            var body = Map.of(
                    "freq", "10min",
                    "horizon_minutes", horizon,
                    "target", target,
                    "series", series
            );
            var url = "http://localhost:8001/forecast/gbdt";
            ResponseEntity<List> resp =
                    restTemplate.postForEntity(url, new HttpEntity<>(body, headers), List.class);
            @SuppressWarnings("unchecked")
            List<Map<String,Object>> out = (resp.getBody()==null)? List.of() : resp.getBody();
            return out;
        } catch (org.springframework.web.client.ResourceAccessException e) {
            System.out.println("[FORECAST] ⚠️ 파이썬 예측 서버(8001)에 연결할 수 없음. 이번 분 생략. " + e.getMessage());
            return null; // 서버 다운: null로 신호
        } catch (org.springframework.web.client.RestClientException e) {
            System.out.println("[FORECAST] ⚠️ 파이썬 호출 실패. 이번 분 생략. " + e.getMessage());
            return null;
        }
    }



    private Double toD(String s) {
        if (s == null) return null;
        s = s.trim();
        if (s.isEmpty() || s.equals("-")) return null;
        try { return Double.valueOf(s); } catch (Exception e) { return null; }
    }

    /** 분 단위 저장: snapshotMinute를 그대로 사용(초/나노만 0으로) */
    @Transactional
    public void saveForecastSnapshot(
            int locId, LocalDateTime snapshotMinute,
            Double temp1h, Double temp6h, Double temp24h,
            Double hum1h,  Double hum6h,  Double hum24h) {

        LocalDateTime ts = snapshotMinute.withSecond(0).withNano(0);

        var e = forecastRepo.findByKeyIdAndKeyCurrent(locId, ts).orElseGet(() -> {
            var ne = new WeatherForecastEntity();
            ne.setKey(new Not_Found.key.WeatherForecastKey(locId, ts));
            return ne;
        });

        e.setTemp1h(temp1h); e.setTemp6h(temp6h); e.setTemp24h(temp24h);
        e.setHum1h(hum1h);   e.setHum6h(hum6h);   e.setHum24h(hum24h);

        // 현재 미세먼지(간이): 동일값 복제(1h/6h/24h)
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

    private Double pickNearestYhat(List<Map<String,Object>> preds, LocalDateTime target) {
        if (preds == null || preds.isEmpty()) return null;
        var fmt = DateTimeFormatter.ISO_DATE_TIME;

        Double bestVal = null;
        long bestDiff = Long.MAX_VALUE;

        for (var p : preds) {
            Object tsObj = p.get("ts");
            Object yObj  = p.get("yhat");
            if (tsObj == null || yObj == null) continue;
            LocalDateTime ts;
            try { ts = LocalDateTime.parse(tsObj.toString(), fmt); }
            catch (Exception ignore) { continue; }

            long diff = Math.abs(Duration.between(target, ts).toMinutes());
            if (diff < bestDiff) {
                bestDiff = diff;
                try { bestVal = Double.valueOf(yObj.toString()); } catch (Exception ignore) {}
            }
        }
        return bestVal;
    }

    /** 실내+실외 시리즈 합치기 (FastAPI 입력용). 실내는 environment_data, 실외는 weather_current */
    @Transactional(readOnly = true)
    public List<Map<String,Object>> buildIndoorOutdoorSeries(int locId, int days){
        var since = LocalDateTime.now().minusDays(days).withSecond(0).withNano(0);

        var outRows = currentRepo.findByLocIdAndObservedAtAfterOrderByObservedAtAsc(locId, since);

        var start = since;
        var end   = LocalDateTime.now().withSecond(0).withNano(0);
        var inRows = environmentDataRepository.findAllByTimestampBetween(start, end);

        // 10분 버킷으로 정렬/병합 (모델 입력은 10분 간격)
        var map = new java.util.TreeMap<LocalDateTime, Map<String,Object>>();
        java.util.function.Function<LocalDateTime, LocalDateTime> bucket10 = t ->
                t.withSecond(0).withNano(0).withMinute((t.getMinute()/10)*10);

        for (var r : outRows) {
            var ts = bucket10.apply(r.getObservedAt());
            var m = map.computeIfAbsent(ts, k -> new HashMap<>());
            m.put("ts", ts.toString());
            m.put("out_temp", r.getTemp());
            m.put("out_hum",  r.getHum());
        }

        for (var e : inRows) {
            var ts = bucket10.apply(e.getTimestamp());
            var m = map.computeIfAbsent(ts, k -> new HashMap<>());
            m.put("ts", ts.toString());
            Double inTemp = (e.getAvgTemperature()!=null)?e.getAvgTemperature():e.getTemperature();
            Double inHum  = (e.getAvgHumidity()!=null)   ?e.getAvgHumidity()   :e.getHumidity();
            m.put("in_temp", inTemp);
            m.put("in_hum",  inHum);
        }
        return new ArrayList<>(map.values());
    }

    /** FastAPI 호출해 예측 리스트만 가져오기(미리보기) */
    public List<Map<String,Object>> callIndoorForecast(int locId, int horizonMinutes) {
        var series = buildIndoorOutdoorSeries(locId, 3);

        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        var body = Map.of(
                "freq","10min",
                "horizon_minutes", horizonMinutes,
                "target","in_temp",
                "series", series
        );
        try {
            @SuppressWarnings("unchecked")
            var preds = (List<Map<String,Object>>) restTemplate.postForObject(
                    "http://localhost:8001/forecast/gbdt",
                    new HttpEntity<>(body, headers),
                    List.class
            );
            return (preds == null) ? List.of() : preds;
        } catch (org.springframework.web.client.ResourceAccessException e) {
            System.out.println("[FORECAST] ⚠️ 파이썬 예측 서버(8001) 연결 실패(미리보기): " + e.getMessage());
            return List.of();
        } catch (org.springframework.web.client.RestClientException e) {
            System.out.println("[FORECAST] ⚠️ 파이썬 호출 실패(미리보기): " + e.getMessage());
            return List.of();
        }
    }

    /** FastAPI에 온도/습도 요청 → 1h/6h/24h 뽑아 DB에 ‘매 분’ 저장 */
    @Transactional
    public void runIndoorForecastAndSave(int locId, int horizonMinutes) {
        // 1) 입력 시계열 준비 (최근 7일로 확대: 과거 실내값이라도 잡히게)
        var series = buildIndoorOutdoorSeries(locId, 7);
        if (series.isEmpty()) { System.out.println("[FORECAST] 입력 시리즈 비어있음"); return; }

        boolean hasIndoor = series.stream().anyMatch(m ->
                m.get("in_temp") != null || m.get("in_hum") != null);
        if (!hasIndoor) { System.out.println("[FORECAST] 실내 데이터 없음 → 생략"); return; }

        var predsTemp = callFastApi(series, horizonMinutes, "in_temp");
        var predsHum  = callFastApi(series, horizonMinutes, "in_hum");

        // 파이썬 서버가 죽어 있으면 둘 다 null → 깔끔히 리턴 (DB에 NULL행 방지)
        if (predsTemp == null && predsHum == null) return;

        var base = currentRepo.findTopByLocIdOrderByObservedAtDesc(locId)
                .map(e -> e.getObservedAt().withSecond(0).withNano(0))
                .orElse(LocalDateTime.now().withSecond(0).withNano(0));

        Double t1h=null,t6h=null,t24h=null,h1h=null,h6h=null,h24h=null;
        if (predsTemp != null) {
            t1h  = pickNearestYhat(predsTemp, base.plusHours(1));
            t6h  = pickNearestYhat(predsTemp, base.plusHours(6));
            t24h = pickNearestYhat(predsTemp, base.plusHours(24));
        }
        if (predsHum != null) {
            h1h  = pickNearestYhat(predsHum,  base.plusHours(1));
            h6h  = pickNearestYhat(predsHum,  base.plusHours(6));
            h24h = pickNearestYhat(predsHum,  base.plusHours(24));
        }

        boolean allNull = t1h==null&&t6h==null&&t24h==null&&h1h==null&&h6h==null&&h24h==null;
        if (allNull) { System.out.println("[FORECAST] 모두 null — 저장 생략 (base="+base+")"); return; }

        saveForecastSnapshot(locId, base, t1h, t6h, t24h, h1h, h6h, h24h);
        System.out.println("[FORECAST] base="+base+" t1h="+t1h+" t6h="+t6h+" t24h="+t24h+
                " h1h="+h1h+" h6h="+h6h+" h24h="+h24h);
    }
}