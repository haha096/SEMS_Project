// SecurityConfig.java
package Not_Found.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
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
                .cors()  // CORS 허용
                .and()
                .csrf().disable()  // CSRF 비활성화
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/**").permitAll() // 모든 요청 허용
                )
                .headers()
                .frameOptions().disable();  // X-Frame-Options 비활성화

        return http.build();
    }
}
