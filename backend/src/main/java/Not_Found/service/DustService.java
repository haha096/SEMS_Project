//package Not_Found.service;
//
//import com.fasterxml.jackson.databind.JsonNode;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import Not_Found.dto.DustDto;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//import org.springframework.web.util.UriComponentsBuilder;
//
//@Service
//public class DustService {
//
//    private static final String SERVICE_KEY = "aRR3w6mDjeHK2c/K0yCtN4sBv9cfvDUUeMGrTzd3yzSdnwZEy7JXg0EWT/EaYLstuzcUPmTMotKVOpP3R3mgqQ==";
//    private static final String BASE_URL = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty";
//
//    public DustDto getDustData() {
//        RestTemplate restTemplate = new RestTemplate();
//
//        String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL)
//                .queryParam("serviceKey", SERVICE_KEY)
//                .queryParam("returnType", "json")
//                .queryParam("numOfRows", 1)
//                .queryParam("pageNo", 1)
//                .queryParam("stationName", "구로구")
//                .queryParam("dataTerm", "DAILY")
//                .queryParam("ver", "1.0")
//                .build(false)
//                .toUriString();
//
//        String json = restTemplate.getForObject(uri, String.class);
//        DustDto dto = new DustDto();
//
//        try {
//            ObjectMapper mapper = new ObjectMapper();
//            JsonNode root = mapper.readTree(json);
//            JsonNode item = root.path("response").path("body").path("items").get(0);
//
//            dto.setDataTime(item.path("dataTime").asText());
//            dto.setPm10Value(item.path("pm10Value").asText());
//            dto.setPm10Grade(item.path("pm10Grade").asText());
//            dto.setPm25Value(item.path("pm25Value").asText());
//            dto.setPm25Grade(item.path("pm25Grade").asText());
//
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//
//        return dto;
//    }
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

@Slf4j
@Service
@RequiredArgsConstructor
public class DustService {

    @Value("${openmeteo.aq.base:https://air-quality-api.open-meteo.com/v1/air-quality}")
    private String aqBase;

    @Value("${weather.connectTimeoutMs:3000}") private int connTimeoutMs;
    @Value("${weather.readTimeoutMs:3000}")    private int readTimeoutMs;

    private final ObjectMapper om = new ObjectMapper();

    private RestTemplate rt() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(connTimeoutMs);
        f.setReadTimeout(readTimeoutMs);
        return new RestTemplate(f);
    }

    public DustDto getCurrentDust(double lat, double lon) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(aqBase)
                    .queryParam("latitude", lat)
                    .queryParam("longitude", lon)
                    .queryParam("current", "pm10,pm2_5")
                    .build().toUri();

            log.info("[AQ] GET {}", uri);
            String raw = rt().getForObject(uri, String.class);

            JsonNode cur = om.readTree(raw).path("current");
            Double pm10  = asD(cur.path("pm10").asText(null));
            Double pm25  = asD(cur.path("pm2_5").asText(null));

            return new DustDto(pm10, pm25, "open-meteo");
        } catch (Exception e) {
            log.warn("[AQ parse] {}", e.toString());
            // 실패 시 null 리턴 대신 빈 DTO로 반환(프론트는 '--' 표기)
            return new DustDto(null, null, "open-meteo");
        }
    }

    private Double asD(String s) {
        if (s == null) return null;
        try { return Double.valueOf(s); } catch (Exception e) { return null; }
    }

    public record DustDto(Double pm10, Double pm25, String source) {}
}