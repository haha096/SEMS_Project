// src/main/java/Not_Found/config/SecurityConfig.java
package Not_Found.config;

import Not_Found.security.JwtAuthFilter;
import Not_Found.security.InternalTokenAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${internal.token:}")
    private String internalToken;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(h -> h.frameOptions(f -> f.disable()))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/ws/**",
                                "/actuator/health"
                        ).permitAll()
                        .requestMatchers(
                                "/api/monitoring/**",
                                "/api/environment/**",
                                "/api/environment-data/**",
                                "/api/env/**",
                                "/api/sensor/**",
                                "/api/weather/**",
                                "/api/station/**",
                                "/api/device/**"
                        ).permitAll()
                        .requestMatchers(
                                "/api/motor/**",
                                "/api/analysis/**",
                                "/api/admin/**"
                        ).hasRole("ADMIN")
                        .anyRequest().permitAll()
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authEx) -> {
                            writeJson(response, HttpServletResponse.SC_UNAUTHORIZED,
                                    "UNAUTHORIZED", "로그인이 필요합니다.");
                        })
                        .accessDeniedHandler((request, response, accessEx) -> {
                            writeJson(response, HttpServletResponse.SC_FORBIDDEN,
                                    "ADMIN_ONLY", "관리자 로그인이 필요합니다.");
                        })
                )

                // ✅ 둘 다 UsernamePasswordAuthenticationFilter 기준으로만 등록
                // ① 내부 토큰 인증을 먼저
                .addFilterBefore(new InternalTokenAuthFilter(internalToken), UsernamePasswordAuthenticationFilter.class)
                // ② 그 다음 JWT (이미 @Component 빈)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void writeJson(HttpServletResponse res, int status, String code, String message) throws IOException {
        res.setStatus(status);
        res.setCharacterEncoding(StandardCharsets.UTF_8.name());
        res.setContentType("application/json; charset=UTF-8");
        String body = String.format("{\"code\":\"%s\",\"message\":\"%s\"}", escape(code), escape(message));
        res.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));
    }

    private static String escape(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:5173"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
