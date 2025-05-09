// src/main/java/com/gsem/backend/model/SensorData.java
package com.gsem.backend.model;

public class SensorData {
    private int pm10;
    private int pm25;
    private float temperature;
    private float humidity;

    public SensorData() {}

    public SensorData(int pm10, int pm25, float temperature, float humidity) {
        this.pm10 = pm10;
        this.pm25 = pm25;
        this.temperature = temperature;
        this.humidity = humidity;
    }

    // Getter & Setter
    public int getPm10() { return pm10; }
    public void setPm10(int pm10) { this.pm10 = pm10; }

    public int getPm25() { return pm25; }
    public void setPm25(int pm25) { this.pm25 = pm25; }

    public float getTemperature() { return temperature; }
    public void setTemperature(float temperature) { this.temperature = temperature; }

    public float getHumidity() { return humidity; }
    public void setHumidity(float humidity) { this.humidity = humidity; }
}
