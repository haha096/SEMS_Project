package Not_Found.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        var f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(1000); // 1s
        f.setReadTimeout(2000);    // 2s
        return new RestTemplate(f);
    }
}
