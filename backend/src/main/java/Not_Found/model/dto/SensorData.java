package Not_Found.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SensorData {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("timestamp")
    private String timestamp;

    @JsonProperty("CURRENT")
    private double current;

    @JsonProperty("VOLT")
    private double volt;

    @JsonProperty("TEMP")
    private double temp;

    @JsonProperty("HUM")
    private double hum;

    @JsonProperty("MODE")
    private String mode;

    @JsonProperty("SPEED")
    private int speed;

    @JsonProperty("PM1.0")
    private double pm1_0;

    @JsonProperty("PM2.5")
    private double pm2_5;

    @JsonProperty("PM10")
    private double pm10;

    @JsonProperty("전력량")
    private double powerUsage;

}
