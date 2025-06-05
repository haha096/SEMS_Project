package Not_Found.service;

import Not_Found.model.dto.UsageTimeDTO;
import Not_Found.repository.SensorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EnvironmentDataService {

    private final SensorRepository sensorRepository;

    @Autowired
    public EnvironmentDataService(SensorRepository sensorRepository) {
        this.sensorRepository = sensorRepository;
    }

    public UsageTimeDTO getUsageTime() {
        try {
            List<Object[]> resultList = sensorRepository.getTimeDiff();

            if (resultList == null || resultList.isEmpty()) {
                System.err.println("getTimeDiff 결과가 null 이거나 비어있음");
                return new UsageTimeDTO(0, 0, 0);
            }

            Object[] result = resultList.get(0); // 첫 번째 결과만 사용
            if (result.length < 3) {
                System.err.println("getTimeDiff 결과 배열 크기가 부족함");
                return new UsageTimeDTO(0, 0, 0);
            }

            int seconds = ((Number) result[0]).intValue();
            int minutes = ((Number) result[1]).intValue();
            int hours = ((Number) result[2]).intValue();

            System.out.println("seconds=" + seconds + ", minutes=" + minutes + ", hours=" + hours);

            return new UsageTimeDTO(seconds, minutes, hours);
        } catch (Exception e) {
            e.printStackTrace();
            return new UsageTimeDTO(0, 0, 0);
        }
    }
}
