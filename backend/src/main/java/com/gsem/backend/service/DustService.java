package com.gsem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gsem.backend.dto.DustDto;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class DustService {

    private static final String SERVICE_KEY = "aRR3w6mDjeHK2c/K0yCtN4sBv9cfvDUUeMGrTzd3yzSdnwZEy7JXg0EWT/EaYLstuzcUPmTMotKVOpP3R3mgqQ==";
    private static final String BASE_URL = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty";

    public DustDto getDustData() {
        RestTemplate restTemplate = new RestTemplate();

        String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                .queryParam("serviceKey", SERVICE_KEY)
                .queryParam("returnType", "json")
                .queryParam("numOfRows", 1)
                .queryParam("pageNo", 1)
                .queryParam("stationName", "구로구")
                .queryParam("dataTerm", "DAILY")
                .queryParam("ver", "1.0")
                .build(false)
                .toUriString();

        String json = restTemplate.getForObject(uri, String.class);
        DustDto dto = new DustDto();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            JsonNode item = root.path("response").path("body").path("items").get(0);

            dto.setDataTime(item.path("dataTime").asText());
            dto.setPm10Value(item.path("pm10Value").asText());
            dto.setPm10Grade(item.path("pm10Grade").asText());
            dto.setPm25Value(item.path("pm25Value").asText());
            dto.setPm25Grade(item.path("pm25Grade").asText());

        } catch (Exception e) {
            e.printStackTrace();
        }

        return dto;
    }
}