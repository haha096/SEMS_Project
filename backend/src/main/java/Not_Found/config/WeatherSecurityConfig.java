package Not_Found.config;

import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

public class WeatherSecurityConfig {
    @Bean
    @Order(0)  // 기본(any request) 체인보다 먼저 적용
    public SecurityFilterChain weatherChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher(new AntPathRequestMatcher("/weather/**"))
                .csrf(csrf -> csrf.disable())                 // POST 테스트 위해 CSRF 끔
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
