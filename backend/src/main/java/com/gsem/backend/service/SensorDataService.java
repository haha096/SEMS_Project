// src/main/java/com/gsem/backend/service/SensorDataService.java
package com.gsem.backend.service;

import com.gsem.backend.model.SensorData;
import org.springframework.stereotype.Service;

@Service
public class SensorDataService {
    private SensorData latestData;

    public void updateSensorData(SensorData data) {
        this.latestData = data;
    }

    public SensorData getLatestSensorData() {
        return latestData;
    }
}

