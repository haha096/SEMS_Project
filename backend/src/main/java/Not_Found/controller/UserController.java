// package Not_Found.controller;

// import Not_Found.model.dto.UserDTO;
// import Not_Found.model.entity.User;
// import Not_Found.service.UserService;
// import Not_Found.util.JwtUtil;
// import io.jsonwebtoken.Claims;
// import io.jsonwebtoken.Jwts;
// import jakarta.servlet.http.HttpSession;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.HashMap;
// import java.util.Map;
// import java.util.Optional;

// //@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
// @CrossOrigin(origins = "http://sems-project.s3-website-us-east-1.amazonaws.com", allowCredentials = "true")
// @RestController
// @RequestMapping("/api/user")
// public class UserController {

//     @Autowired
//     private UserService userService;

//     @Autowired
//     private JwtUtil jwtUtil;

//     // 회원가입
//     @PostMapping("/signup")
//     public ResponseEntity<String> signup(@RequestBody UserDTO userDTO) {
//         String response = userService.register(userDTO);  // UserDTO를 User 엔티티로 변환 후 저장
//         return ResponseEntity.ok(response);
//     }

//     // 로그인
//     @PostMapping("/login")
//     public ResponseEntity<?> login(@RequestBody UserDTO userDTO) {
//         Optional<User> userOpt = userService.getUserIfValid(userDTO.getId(), userDTO.getPassword());
//         if (userOpt.isPresent()) {
//             User user = userOpt.get();
//             // JWT 토큰 생성 (email 추가)
//             String token = jwtUtil.generateToken(user.getId(), user.getNickname(), user.getEmail(), user.getIsAdmin());

//             // ✅ 토큰 정보 출력 (세션 정보 대신)
//             System.out.println("생성된 JWT 토큰: " + token);

//             Map<String, Object> response = new HashMap<>();
//             response.put("token", token);
//             response.put("userId", user.getId());
//             response.put("nickname", user.getNickname());
//             response.put("email", user.getEmail());
//             response.put("isAdmin", user.getIsAdmin());

//             return ResponseEntity.ok(response);
//         } else {
//             Map<String, String> error = new HashMap<>();
//             error.put("message", "아이디 또는 비밀번호가 틀렸습니다.");
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
//         }
//     }

//     //로그인하고 내정보 페이지에 정보를 넣기 위한 GetMapping
//     @GetMapping("/session")
//     public ResponseEntity<?> checkSession(@RequestHeader("Authorization") String token) {
//         try {
//             String jwtToken = token.substring(7); // "Bearer " 제거
//             Claims claims = jwtUtil.parseToken(jwtToken);

//             Map<String, Object> response = new HashMap<>();
//             response.put("userId", claims.get("userId"));
//             response.put("nickname", claims.get("nickname"));
//             response.put("email", claims.get("email"));
//             response.put("isAdmin", claims.get("isAdmin"));
//             return ResponseEntity.ok(response);
//         } catch (Exception e) {
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 상태가 아닙니다.");
//         }
//     }

//     @PostMapping("/logout")
//     public ResponseEntity<?> logout(HttpSession session) {
//         session.invalidate();  // 세션 완전 삭제
//         System.out.println("세션이 삭제되었습니다. 로그아웃 성공");
//         return ResponseEntity.ok("로그아웃 성공");
//     }

//     // 관리자 확인
//     @GetMapping("/isAdmin/{id}")
//     public boolean isAdmin(@PathVariable String id) {
//         return userService.isAdmin(id);
//     }

//     // 회원가입 중복사항 확인
//     @PostMapping("/check-duplicate")
//     public ResponseEntity<String> checkDuplicate(@RequestBody UserDTO userDTO) {
//         boolean isIdDuplicated = userService.isIdDuplicated(userDTO.getId());
//         boolean isEmailDuplicated = userService.isEmailDuplicated(userDTO.getEmail());
//         boolean isNicknameDuplicated = userService.isNicknameDuplicated(userDTO.getNickname());

//         if (isIdDuplicated) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("아이디가 이미 존재합니다.");
//         }
//         if (isEmailDuplicated) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("이메일이 이미 존재합니다.");
//         }
//         if (isNicknameDuplicated) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("닉네임이 이미 존재합니다.");
//         }

//         return ResponseEntity.ok("중복 없음");
//     }


// }

package Not_Found.controller;

import Not_Found.model.dto.UserDTO;
import Not_Found.model.entity.User;
import Not_Found.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody UserDTO userDTO) {
        String response = userService.register(userDTO);  // UserDTO를 User 엔티티로 변환 후 저장
        return ResponseEntity.ok(response);
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserDTO userDTO, HttpSession session) {
        Optional<User> userOpt = userService.getUserIfValid(userDTO.getId(), userDTO.getPassword());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            session.setAttribute("userId", user.getId());
            session.setAttribute("nickname", user.getNickname());
            session.setAttribute("email", user.getEmail());
            session.setAttribute("isAdmin", user.getIsAdmin());

            System.out.println("로그인 세션 ID: " + session.getId());
            System.out.println("로그인 저장된 userId: " + session.getAttribute("userId"));
            System.out.println("가져온 User 정보: " + user);

            Map<String, Object> response = new HashMap<>();
            response.put("userId", user.getId());
            response.put("nickname", user.getNickname());
            response.put("email", user.getEmail());
            response.put("isAdmin", user.getIsAdmin());
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "아이디 또는 비밀번호가 틀렸습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/password-reset")
    public ResponseEntity<?> handlePasswordReset(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        boolean result = userService.processPasswordReset(email);
        if (result) {
            return ResponseEntity.ok().body(Map.of("message", "비밀번호 재설정 이메일이 전송되었습니다."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "등록되지 않은 이메일입니다."));
        }
    }

    @PostMapping("/find-id")
    public ResponseEntity<?> handleFindId(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        boolean result = userService.processFindId(email);
        if (result) {
            return ResponseEntity.ok().body(Map.of("message", "아이디가 이메일로 전송되었습니다."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "등록되지 않은 이메일입니다."));
        }
    }

    @PostMapping("/update-nickname")
    public ResponseEntity<String> updateNickname(@RequestBody Map<String, String> payload, HttpSession session) {
        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        String newNickname = payload.get("nickname");
        String result = userService.updateNickname(userId, newNickname);

        if ("SUCCESS".equals(result)) {
            // 세션의 닉네임 정보도 업데이트
            session.setAttribute("nickname", newNickname);
            return ResponseEntity.ok("닉네임이 성공적으로 변경되었습니다.");
        } else {
            // "이미 사용 중인 닉네임입니다." 또는 "사용자를 찾을 수 없습니다." 등의 메시지 반환
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
    }

    @PostMapping("/update-password")
    public ResponseEntity<String> updatePassword(@RequestBody Map<String, String> payload, HttpSession session) {
        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");
        String result = userService.updatePassword(userId, currentPassword, newPassword);

        if ("SUCCESS".equals(result)) {
            // 보안을 위해 세션을 무효화하여 자동 로그아웃 처리
            session.invalidate();
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
        } else {
            // "현재 비밀번호가 일치하지 않습니다." 등의 메시지 반환
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
    }

    //로그인하고 내정보 페이지에 정보를 넣기 위한 GetMapping
    @GetMapping("/session")
    public ResponseEntity<?> checkSession(HttpSession session) {
        Object userId = session.getAttribute("userId");
        System.out.println("세션 확인 - userId: " + userId);
        System.out.println("저장된 userId: " + session.getAttribute("userId"));

        if (userId != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("nickname", session.getAttribute("nickname"));
            response.put("email", session.getAttribute("email"));
            response.put("isAdmin", session.getAttribute("isAdmin"));
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 상태가 아닙니다.");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();  // 세션 완전 삭제
        System.out.println("세션이 삭제되었습니다. 로그아웃 성공");
        return ResponseEntity.ok("로그아웃 성공");
    }

    // 관리자 확인
    @GetMapping("/isAdmin/{id}")
    public boolean isAdmin(@PathVariable String id) {
        return userService.isAdmin(id);
    }

    // 회원가입 중복사항 확인
    @PostMapping("/check-duplicate")
    public ResponseEntity<String> checkDuplicate(@RequestBody UserDTO userDTO) {
        boolean isIdDuplicated = userService.isIdDuplicated(userDTO.getId());
        boolean isEmailDuplicated = userService.isEmailDuplicated(userDTO.getEmail());
        boolean isNicknameDuplicated = userService.isNicknameDuplicated(userDTO.getNickname());

        if (isIdDuplicated) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("아이디가 이미 존재합니다.");
        }
        if (isEmailDuplicated) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("이메일이 이미 존재합니다.");
        }
        if (isNicknameDuplicated) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("닉네임이 이미 존재합니다.");
        }

        return ResponseEntity.ok("중복 없음");
    }


}
