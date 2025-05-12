package com.gsem.backend.dto;

public class DustDto {
    private String dataTime;
    private String pm10Value;
    private String pm10Grade;
    private String pm25Value;
    private String pm25Grade;

    // Getter, Setter (롬복 쓰면 @Data 로 처리 가능)
    public String getDataTime() { return dataTime; }
    public void setDataTime(String dataTime) { this.dataTime = dataTime; }

    public String getPm10Value() { return pm10Value; }
    public void setPm10Value(String pm10Value) { this.pm10Value = pm10Value; }

    public String getPm10Grade() { return pm10Grade; }
    public void setPm10Grade(String pm10Grade) { this.pm10Grade = pm10Grade; }

    public String getPm25Value() { return pm25Value; }
    public void setPm25Value(String pm25Value) { this.pm25Value = pm25Value; }

    public String getPm25Grade() { return pm25Grade; }
    public void setPm25Grade(String pm25Grade) { this.pm25Grade = pm25Grade; }
}
