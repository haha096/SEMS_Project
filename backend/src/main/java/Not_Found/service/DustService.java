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