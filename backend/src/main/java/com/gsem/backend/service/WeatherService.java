package com.gsem.backend.service;

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

}
