// src/main/java/Not_Found/security/JwtAuthFilter.java
package Not_Found.security;

import Not_Found.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwt;
    private final CookieUtil cookieUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        // ✅ 0) 이미 앞선 필터(내부토큰 등)에서 인증이 설정돼 있다면 손대지 않고 통과
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(req, res);
            return;
        }

        String token = null;

        // 1) Authorization: Bearer ...
        String auth = req.getHeader("Authorization");
        if (StringUtils.hasText(auth) && auth.startsWith("Bearer ")) {
            token = auth.substring(7);
        }

        // 2) 없으면 ACCESS 쿠키
        if (!StringUtils.hasText(token)) {
            token = cookieUtil.get(req, "ACCESS").orElse(null);
        }

        // 3) 토큰이 아예 없으면 인증 세팅 없이 그대로 통과 (permitAll 엔드포인트 정상 동작)
        if (!StringUtils.hasText(token)) {
            chain.doFilter(req, res);
            return;
        }

        try {
            String userId = jwt.getUserId(token);
            userRepository.findById(userId).ifPresent(u -> {
                List<GrantedAuthority> auths = List.of(
                        new SimpleGrantedAuthority(Boolean.TRUE.equals(u.getIsAdmin()) ? "ROLE_ADMIN" : "ROLE_USER")
                );
                var at = new UsernamePasswordAuthenticationToken(userId, null, auths);
                SecurityContextHolder.getContext().setAuthentication(at);
            });
        } catch (JwtException ignored) {
            // 4) 토큰 오류: 퍼블릭 엔드포인트를 위해 차단하지 않고 체인 진행
            chain.doFilter(req, res);
            return;
        }

        chain.doFilter(req, res);
    }
}
