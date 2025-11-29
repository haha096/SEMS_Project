package Not_Found.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.access-exp-min}") private long accessExpMin;
    @Value("${jwt.refresh-exp-days}") private long refreshExpDays;

    private Key key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccess(String userId, String nickname, boolean isAdmin) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(userId)
                .claim("nickname", nickname)
                .claim("isAdmin", isAdmin)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(accessExpMin, ChronoUnit.MINUTES)))
                .signWith(key(), SignatureAlgorithm.HS256).compact();
    }

    public String generateRefresh(String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(userId)
                .claim("typ", "refresh")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(refreshExpDays, ChronoUnit.DAYS)))
                .signWith(key(), SignatureAlgorithm.HS256).compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
    }

    public String getUserId(String token) {
        return parse(token).getBody().getSubject();
    }
}
