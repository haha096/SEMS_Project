package Not_Found.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS는 @CrossOrigin 어노테이션으로 컨트롤러에서 개별 설정하므로, 여기서는 기본 설정을 유지합니다.
                .cors(cors -> {})
                // CSRF 보호 기능을 비활성화합니다. (Stateless API 서버에서는 일반적으로 비활성화)
                .csrf(AbstractHttpConfigurer::disable)
                // HTTP 요청에 대한 접근 권한을 설정합니다.
                .authorizeHttpRequests(auth -> auth
                        // "/api/auth/**" 경로의 모든 요청은 인증 없이 허용합니다.
                        .requestMatchers("/api/auth/**").permitAll()
                        // h2-console 접근을 허용합니다. (개발용)
                        .requestMatchers("/h2-console/**").permitAll()
                        // 위에서 지정한 경로 외의 모든 요청은 일단 허용합니다.
                        .anyRequest().permitAll()
                )
                // h2-console을 iframe에서 표시할 수 있도록 X-Frame-Options 헤더를 비활성화합니다.
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.disable())
                );

        return http.build();
    }
}
