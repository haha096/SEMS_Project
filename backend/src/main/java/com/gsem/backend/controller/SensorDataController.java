// src/main/java/com/gsem/backend/controller/SensorDataController.java
package com.gsem.backend.controller;

import com.gsem.backend.model.SensorData;
import com.gsem.backend.service.SensorDataService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sensor")
@CrossOrigin("*")
public class SensorDataController {
    private final SensorDataService sensorDataService;

    public SensorDataController(SensorDataService sensorDataService) {
        this.sensorDataService = sensorDataService;
    }

    @GetMapping("/latest")
    public SensorData getLatestSensorData() {
        return sensorDataService.getLatestSensorData();
    }
}
