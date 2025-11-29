package Not_Found.controller;

import Not_Found.security.CookieUtil;
import Not_Found.security.JwtUtil;
import Not_Found.service.UserService;
import Not_Found.model.entity.User;
import Not_Found.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class TokenAuthController {

    private final UserService userService;
    private final JwtUtil jwt;
    private final CookieUtil cookie;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    // -------------------------------
    // 회원가입
    // -------------------------------
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        // 필수값 체크
        if (req.getId() == null || req.getId().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()
                || req.getNickname() == null || req.getNickname().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "필수 입력값이 누락되었습니다."));
        }

        // 아이디 중복
        if (userRepository.existsById(req.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "이미 존재하는 아이디입니다."));
        }

        // 저장
        User u = new User();
        u.setId(req.getId());
        u.setNickname(req.getNickname());
        u.setEmail(req.getEmail());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setIsAdmin(false); // 신규 회원은 기본 일반 사용자
        userRepository.save(u);

        return ResponseEntity.ok(Map.of("message", "회원가입 성공"));
    }

    // -------------------------------
    // (선택) 중복 확인: 프론트에서 사전 체크용
    // -------------------------------
    @PostMapping("/check-duplicate")
    public ResponseEntity<?> checkDuplicate(@RequestBody Map<String, String> body) {
        String id = body.getOrDefault("id", "").trim();
        boolean idUsed = (!id.isBlank()) && userRepository.existsById(id);
        return ResponseEntity.ok(Map.of("idUsed", idUsed));
    }

    // -------------------------------
    // 세션 없는 로그인 (JWT 쿠키 발급)
    // -------------------------------
    @PostMapping("/token-login")
    public ResponseEntity<?> tokenLogin(@RequestBody Map<String, String> body, HttpServletResponse res) {
        String id = body.getOrDefault("id", "").trim();
        String pw = body.getOrDefault("password", "").trim();

        return userService.getUserIfValid(id, pw)
                .map(u -> {
                    String access  = jwt.generateAccess(u.getId(), u.getNickname(), Boolean.TRUE.equals(u.getIsAdmin()));
                    String refresh = jwt.generateRefresh(u.getId());
                    cookie.add(res, "ACCESS", access,   60 * 30);           // 30분
                    cookie.add(res, "REFRESH", refresh, 60 * 60 * 24 * 14); // 14일
                    return ResponseEntity.ok(Map.of(
                            "userId",  u.getId(),
                            "nickname", u.getNickname(),
                            "email",    u.getEmail(),
                            "isAdmin",  u.getIsAdmin()
                    ));
                })
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("message", "아이디 또는 비밀번호가 틀렸습니다.")));
    }

    // -------------------------------
    // 현재 로그인 사용자
    // -------------------------------
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("message", "인증 필요"));
        }
        String userId = (String) auth.getPrincipal();
        return userService.findById(userId)
                .map(u -> ResponseEntity.ok(Map.of(
                        "userId",  u.getId(),
                        "nickname", u.getNickname(),
                        "email",    u.getEmail(),
                        "isAdmin",  u.getIsAdmin()
                )))
                .orElse(ResponseEntity.status(401).body(Map.of("message", "인증 필요")));
    }

    // -------------------------------
    // 액세스 재발급 (REFRESH 쿠키 필요)
    // -------------------------------
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest req, HttpServletResponse res) {
        String refresh = cookie.get(req, "REFRESH").orElse(null);
        if (refresh == null) {
            return ResponseEntity.status(401).body(Map.of("message", "리프레시 토큰 없음"));
        }
        try {
            String userId = jwt.getUserId(refresh);
            return userService.findById(userId)
                    .map(u -> {
                        String access = jwt.generateAccess(u.getId(), u.getNickname(), Boolean.TRUE.equals(u.getIsAdmin()));
                        cookie.add(res, "ACCESS", access, 60 * 30);
                        return ResponseEntity.ok(Map.of("message", "ok"));
                    })
                    .orElse(ResponseEntity.status(401).body(Map.of("message", "사용자 없음")));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "리프레시 토큰 오류"));
        }
    }

    // -------------------------------
    // 로그아웃 (쿠키 삭제)
    // -------------------------------
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse res) {
        cookie.clear(res, "ACCESS");
        cookie.clear(res, "REFRESH");
        return ResponseEntity.ok(Map.of("message", "로그아웃 성공"));
    }

    // -------------------------------
    // DTO
    // -------------------------------
    @Data
    public static class SignupRequest {
        private String id;
        private String password;
        private String nickname;
        private String email;
    }
}
