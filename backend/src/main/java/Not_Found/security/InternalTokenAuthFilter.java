// src/main/java/Not_Found/security/InternalTokenAuthFilter.java
package Not_Found.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class InternalTokenAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(InternalTokenAuthFilter.class);
    private final String expectedToken;

    public InternalTokenAuthFilter(String expectedToken) {
        this.expectedToken = expectedToken;
        if (!StringUtils.hasText(expectedToken)) {
            log.warn("[InternalToken] expectedToken is EMPTY. Set property internal.token or env INTERNAL_TOKEN.");
        } else {
            log.info("[InternalToken] expectedToken=**** ({} chars)", expectedToken.length());
        }
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String path = request.getRequestURI();

        // ✅ WebSocket/SockJS/ broker 경로는 전부 우회 (403 방지)
        if (path.startsWith("/ws") || path.startsWith("/sockjs")
                || path.startsWith("/topic") || path.startsWith("/queue") || path.startsWith("/user")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 이미 인증된 경우 통과
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        final String headerName = "X-Internal-Token";
        String token = request.getHeader(headerName);

        // 디버그 헤더/로그
        response.addHeader("X-Debug-Internal-Token", StringUtils.hasText(token) ? "present" : "missing");
        response.addHeader("X-Debug-Internal-Token-Expected", StringUtils.hasText(expectedToken) ? "present" : "missing");
        log.debug("[InternalToken] path={} hdr={} present={} expectedPresent={}",
                path, headerName, StringUtils.hasText(token), StringUtils.hasText(expectedToken));

        if (StringUtils.hasText(token) && StringUtils.hasText(expectedToken) && expectedToken.equals(token)) {
            var auth = new UsernamePasswordAuthenticationToken(
                    "internal-ai",
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_AI"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("[InternalToken] authenticated as internal-ai (ADMIN/AI)");
        }

        filterChain.doFilter(request, response);
    }
}
