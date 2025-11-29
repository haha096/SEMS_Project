package Not_Found.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Component
public class CookieUtil {
    public void add(HttpServletResponse res, String name, String value, int maxAgeSec) {
        // Spring Boot 3.2+: ResponseCookie로 SameSite 지정
        ResponseCookie rc = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)      // HTTPS 환경이면 true
                .path("/")
                .sameSite("Lax")
                .maxAge(maxAgeSec)
                .build();
        res.addHeader("Set-Cookie", rc.toString());
    }

    public void clear(HttpServletResponse res, String name) {
        add(res, name, "", 0);
    }

    public Optional<String> get(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return Optional.empty();
        return Arrays.stream(req.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}
