//package Not_Found.service;
//
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//import org.json.JSONArray;
//import org.json.JSONObject;
//
//import java.time.LocalDateTime;
//import java.time.format.DateTimeFormatter;
//
//@Service
//public class WeatherService {
//    private final String SERVICE_KEY = "aRR3w6mDjeHK2c/K0yCtN4sBv9cfvDUUeMGrTzd3yzSdnwZEy7JXg0EWT/EaYLstuzcUPmTMotKVOpP3R3mgqQ==";
//
//    public String getWeatherData(int nx, int ny) {
//        // 1. 날짜 및 시간 구하기 (기상청 기준은 매시간 40분 뒤 발표)
//        LocalDateTime now = LocalDateTime.now().minusMinutes(40);
//        String baseDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
//        String baseTime = now.format(DateTimeFormatter.ofPattern("HH00"));
//
//        // 2. URL 생성
//        String url = String.format(
//                "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst" +
//                        "?serviceKey=%s&numOfRows=10&pageNo=1&dataType=JSON&base_date=%s&base_time=%s&nx=%d&ny=%d",
//                SERVICE_KEY, baseDate, baseTime, nx, ny
//        );
//
//        // 3. API 호출
//        RestTemplate restTemplate = new RestTemplate();
//        String rawJson = restTemplate.getForObject(url, String.class);
//
//        System.out.println("응답 내용:\n" + rawJson);
//
//        // 4. JSON 파싱
//        JSONObject json = new JSONObject(rawJson);
//        JSONArray items = json.getJSONObject("response")
//                .getJSONObject("body")
//                .getJSONObject("items")
//                .getJSONArray("item");
//
//        String temperature = "";
//        String humidity = "";
//
//        for (int i = 0; i < items.length(); i++) {
//            JSONObject item = items.getJSONObject(i);
//            String category = item.getString("category");
//            String value = item.getString("obsrValue");
//
//            if (category.equals("T1H")) {
//                temperature = value;
//            } else if (category.equals("REH")) {
//                humidity = value;
//            }
//        }
//
//        // 5. 결과 반환 (필요 시 JSON으로 포맷 가능)
//        return String.format("온도: %s℃, 습도: %s%%", temperature, humidity);
//    }
//
//}


package Not_Found.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherService {

    @Value("${provider.ultra.enabled:false}")     private boolean ultraOn;
    @Value("${provider.asos.enabled:true}")       private boolean asosOn;
    @Value("${provider.openmeteo.enabled:true}")  private boolean omOn;

    @Value("${kma.ultra.base:}")       private String ultraBase;
    @Value("${kma.ultra.serviceKey:}") private String ultraKey;

    @Value("${kma.asos.base:}")        private String asosBase;
    @Value("${kma.asos.authKey:}")     private String asosKey;

    @Value("${openmeteo.base:https://api.open-meteo.com/v1/forecast}") private String omBase;

    @Value("${weather.connectTimeoutMs:3000}") private int connTimeoutMs;
    @Value("${weather.readTimeoutMs:3000}")    private int readTimeoutMs;

    private final ObjectMapper om = new ObjectMapper();

    private RestTemplate rt() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(connTimeoutMs);
        f.setReadTimeout(readTimeoutMs);
        return new RestTemplate(f);
    }

    /** 메인 진입: nx, ny 기준으로 현재 날씨를 공통 스키마로 반환 */
    public WeatherDto getCurrentWeather(int nx, int ny) {
        // 서초구 기준 임시 매핑 (필요 시 확장)
        // STN 108 = 서울 (가장 근접 관측소 예시)
        String district = "서초구";
        int stn = 108;
        double lat = 37.48, lon = 127.03; // 서초구 대략 좌표

        // 1순위: 초단기실황 (복구 시 자동 사용)
        if (ultraOn) {
            try {
                String raw = callUltra(nx, ny);
                WeatherDto dto = parseUltra(raw, district);
                if (dto != null) { dto.source = "ultra"; return dto; }
            } catch (Exception e) {
                log.warn("[ULTRA] {}", e.toString());
            }
        }

        // 2순위: ASOS 관측소 실황
        if (asosOn) {
            try {
                String raw = callAsos(stn);
                WeatherDto dto = parseAsos(raw, district);
                if (dto != null) { dto.source = "asos"; return dto; }
            } catch (Exception e) {
                log.warn("[ASOS] {}", e.toString());
            }
        }

        // 3순위: Open-Meteo(키 불필요)
        if (omOn) {
            try {
                String raw = callOpenMeteo(lat, lon);
                WeatherDto dto = parseOpenMeteo(raw, district);
                if (dto != null) { dto.source = "open-meteo"; return dto; }
            } catch (Exception e) {
                log.warn("[OpenMeteo] {}", e.toString());
            }
        }

        throw new IllegalStateException("모든 공급자 호출 실패");
    }

    // ---------- 공급자 호출 ----------
    private String callUltra(int nx, int ny) {
        Base base = computeBaseDateTime();
        URI uri = UriComponentsBuilder.fromHttpUrl(ultraBase)
                .queryParam("serviceKey", ultraKey)
                .queryParam("nx", nx).queryParam("ny", ny)
                .queryParam("base_date", base.date)
                .queryParam("base_time", base.time)
                .queryParam("dataType", "JSON")
                .queryParam("pageNo", 1).queryParam("numOfRows", 1000)
                .build(true).toUri();
        log.info("[ULTRA] GET {}", uri);
        return rt().getForObject(uri, String.class);
    }

    private String callAsos(int stn) {
        // kma_sfctm2.php: tm=YYYYMMDDhhmm, stn=관측소번호
        String tm = nowKST().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
        URI uri = UriComponentsBuilder.fromHttpUrl(asosBase)
                .queryParam("tm", tm)
                .queryParam("stn", stn)
                .queryParam("help", 0) // 0=데이터, 1=도움말
                .queryParam("authKey", asosKey)
                .build(true).toUri();
        log.info("[ASOS] GET {}", uri);
        return rt().getForObject(uri, String.class);
    }

    private String callOpenMeteo(double lat, double lon) {
        URI uri = UriComponentsBuilder.fromHttpUrl(omBase)
                .queryParam("latitude", lat)
                .queryParam("longitude", lon)
                .queryParam("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code")
                .build().toUri();
        log.info("[OpenMeteo] GET {}", uri);
        return rt().getForObject(uri, String.class);
    }

    // ---------- 파서/정규화 ----------
    /** 초단기실황 JSON → 공통 DTO (T1H, REH, WSD, VEC, PTY/ SKY 활용) */
    private WeatherDto parseUltra(String raw, String district) {
        try {
            JsonNode root = om.readTree(raw);
            JsonNode items = root.at("/response/body/items/item");
            if (items.isMissingNode()) return null;

            Double t = null, h = null, w = null, vec = null;
            String weather = "";
            for (JsonNode it : items) {
                String cate = it.path("category").asText("");
                String val = it.path("obsrValue").asText("");
                switch (cate) {
                    case "T1H" -> t = safeNum(val);
                    case "REH" -> h = safeNum(val);
                    case "WSD" -> w = safeNum(val);
                    case "VEC" -> vec = safeNum(val);
                    case "PTY" -> {
                        Double num = safeNum(val);
                        if (num != null) {
                            int p = num.intValue();
                            weather = switch (p) {
                                case 1, 2, 5, 6 -> "rain";
                                case 3, 7 -> "snow";
                                default -> weather;
                            };
                        }
                    }
                    case "SKY" -> {
                        Double num = safeNum(val);
                        if (num != null && weather.isBlank()) {
                            int s = num.intValue();
                            weather = switch (s) {
                                case 1 -> "clear";
                                case 3 -> "cloudy";
                                case 4 -> "overcast";
                                default -> "";
                            };
                        }
                    }
                }
            }
            return new WeatherDto(nowIso(), district, n(t), n(h), n(w), degToStr(vec), weather, "ultra");
        } catch (Exception e) {
            log.warn("[ULTRA parse] {}", e.toString());
            return null;
        }
    }

    /** ASOS 원문은 텍스트/CSV류. 최소한 온도/습도/풍속만 근사 파싱 시도(실패 시 null 허용). */
    private WeatherDto parseAsos(String raw, String district) {
        try {
            // kma_sfctm2.php 기본 포맷 예) " ... TA=기온, HM=습도, WS=풍속 ..." 형태가 포함될 수 있음.
            // 간단한 정규식으로 숫자만 뽑기 (실서비스에선 공식 스펙으로 교체 권장)
            Double t = findNum(raw, "TA=([\\-0-9.]+)");
            Double h = findNum(raw, "HM=([\\-0-9.]+)");
            Double w = findNum(raw, "WS=([\\-0-9.]+)");
            Double vec = findNum(raw, "WD=([\\-0-9.]+)"); // 풍향(도)
            String wx = ""; // ASOS는 현상코드가 따로 있을 수 있음(단순화)

            return new WeatherDto(nowIso(), district, n(t), n(h), n(w), degToStr(vec), wx, "asos");
        } catch (Exception e) {
            log.warn("[ASOS parse] {}", e.toString());
            return null;
        }
    }

    /** Open-Meteo current JSON → 공통 DTO */
    private WeatherDto parseOpenMeteo(String raw, String district) {
        try {
            JsonNode root = om.readTree(raw).path("current");
            if (root.isMissingNode()) return null;
            Double t = safeNum(root.path("temperature_2m").asText());
            Double h = safeNum(root.path("relative_humidity_2m").asText());
            Double w = safeNum(root.path("wind_speed_10m").asText());
            Double vec = safeNum(root.path("wind_direction_10m").asText());
            String wx = String.valueOf(root.path("weather_code").asInt());
            return new WeatherDto(nowIso(), district, n(t), n(h), n(w), degToStr(vec), wx, "open-meteo");
        } catch (Exception e) {
            log.warn("[OM parse] {}", e.toString());
            return null;
        }
    }

    // ---------- 유틸 ----------
    private record Base(String date, String time) {}
    private Base computeBaseDateTime() {
        LocalDateTime now = nowKST();
        LocalDateTime base = now.getMinute() < 45 ? now.minusHours(1) : now;
        String date = base.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String time = base.withMinute(30).withSecond(0).withNano(0)
                .format(DateTimeFormatter.ofPattern("HHmm"));
        return new Base(date, time);
    }
    private LocalDateTime nowKST() { return LocalDateTime.now(ZoneId.of("Asia/Seoul")); }
    private String nowIso() { return LocalDateTime.now(ZoneId.of("Asia/Seoul")).toString(); }
    private Double safeNum(String s) { try { return Double.valueOf(s); } catch (Exception e) { return null; } }
    private double n(Double v) { return v == null ? 0.0 : v; }

    private String degToStr(Double deg) {
        if (deg == null) return "";
        double d = (deg % 360 + 360) % 360;
        String[] dirs = {"N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"};
        int idx = (int)Math.round(d/22.5) % 16;
        return dirs[idx];
    }
    private Double findNum(String text, String regex) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(regex).matcher(text);
        if (m.find()) return safeNum(m.group(1));
        return null;
    }

    // 공통 스키마 DTO
    public static class WeatherDto {
        public String updatedAt;
        public String district;
        public double temp;
        public double humidity;
        public double windSpeed;
        public String windDir;
        public String weather;
        public String source; // ultra / asos / open-meteo

        public WeatherDto(String updatedAt, String district, double temp, double humidity,
                          double windSpeed, String windDir, String weather, String source) {
            this.updatedAt = updatedAt;
            this.district = district;
            this.temp = temp;
            this.humidity = humidity;
            this.windSpeed = windSpeed;
            this.windDir = windDir;
            this.weather = weather;
            this.source = source;
        }
    }
}

