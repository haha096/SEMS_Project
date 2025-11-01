package Not_Found.util;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.Dimension;
import software.amazon.awssdk.services.cloudwatch.model.GetMetricDataRequest;
import software.amazon.awssdk.services.cloudwatch.model.MetricDataQuery;
import software.amazon.awssdk.services.cloudwatch.model.MetricStat;
import software.amazon.awssdk.services.cloudwatch.model.Metric;
import software.amazon.awssdk.services.cloudwatch.model.MetricDataResult;

import java.time.Duration;
import java.time.Instant;

public class CloudWatchApiExample {

    public static void main(String[] args) {

        // 1. AWS 리전 설정 (예: 버지니아 북부)
        Region region = Region.US_EAST_1;

        // 2. 본인의 EC2 인스턴스 ID로 교체
        String instanceId = "i-1234567890abcdef0";

        // try-with-resources 문을 사용하여 클라이언트가 자동으로 닫히도록 합니다.
        try (CloudWatchClient cwClient = CloudWatchClient.builder()
                .region(region)
                .build()) {

            // 3. 가져올 지표 정의 (EC2 CPU 사용률)
            Metric metric = Metric.builder()
                    .namespace("AWS/EC2") // EC2 지표 네임스페이스
                    .metricName("CPUUtilization") // 지표 이름
                    .dimensions(Dimension.builder()
                            .name("InstanceId") // 'InstanceId' dimension
                            .value(instanceId) // 인스턴스 ID
                            .build())
                    .build();

            // 4. 지표 데이터 쿼리 방법 정의 (5분 간격의 평균값)
            MetricStat metricStat = MetricStat.builder()
                    .metric(metric)
                    .period(300) // 300초 = 5분
                    .stat("Average") // 평균값
                    .build();

            // 5. 지표 데이터 쿼리 생성
            MetricDataQuery dataQuery = MetricDataQuery.builder()
                    .id("cpu_utilization_query")
                    .metricStat(metricStat)
                    .returnData(true)
                    .build();

            // 6. 지난 30분간의 지표 데이터를 요청하는 객체 생성
            GetMetricDataRequest request = GetMetricDataRequest.builder()
                    .startTime(Instant.now().minus(Duration.ofMinutes(30)))
                    .endTime(Instant.now())
                    .metricDataQueries(dataQuery)
                    .build();

            // 7. API 호출 및 결과 출력
            System.out.println("AWS CloudWatch API에 연결하여 지표를 가져오는 중...");

            cwClient.getMetricData(request).metricDataResults().forEach(result -> {
                System.out.println("----------------------------------------");
                System.out.println("지표 ID: " + result.id());
                System.out.println("지표 값: " + result.values());
                System.out.println("타임스탬프: " + result.timestamps());
                System.out.println("----------------------------------------");
            });

        } catch (Exception e) {
            // 8. 오류 발생 시 메시지 출력
            System.err.println("API 연결 오류가 발생했습니다: " + e.getMessage());
        }
    }
}