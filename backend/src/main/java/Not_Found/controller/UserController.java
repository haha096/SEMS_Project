package Not_Found.controller;

import Not_Found.model.dto.UserDTO;
import Not_Found.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

//    @PostMapping("/signup")
//    public ResponseEntity<?> signup(@RequestBody UserDTO userDTO) {
//        try {
//            String response = userService.register(userDTO);
//            return ResponseEntity.ok(response);
//        } catch (IllegalArgumentException e) {
//            String msg = e.getMessage() != null ? e.getMessage() : "잘못된 요청입니다.";
//            String message = msg;
//            String field = null;
//            int sep = msg.indexOf("::");
//            if (sep > -1) { message = msg.substring(0, sep); field = msg.substring(sep + 2); }
//            Map<String, Object> body = new HashMap<>();
//            body.put("message", message);
//            if (field != null && !field.isBlank()) body.put("field", field);
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
//        }
//    }

    // 아이디 찾기: 이름+이메일
    @PostMapping("/find-id")
    public ResponseEntity<?> handleFindId(@RequestBody Map<String, String> payload) {
        String name = safe(payload.get("name"));
        String email = safe(payload.get("email"));
        if (name.isBlank())  return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "이름을 입력하세요."));
        if (email.isBlank()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "이메일을 입력하세요."));
        boolean result = userService.processFindIdByNameEmail(name, email);
        if (result) return ResponseEntity.ok().body(Map.of("message", "아이디가 이메일로 전송되었습니다."));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "일치하는 가입 정보가 없습니다."));
    }

    // 비밀번호 찾기: 아이디+이메일
    @PostMapping("/password-reset")
    public ResponseEntity<?> handlePasswordReset(@RequestBody Map<String, String> payload) {
        String id = safe(payload.get("id"));
        String email = safe(payload.get("email"));
        if (id.isBlank())    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "아이디를 입력하세요."));
        if (email.isBlank()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "이메일을 입력하세요."));
        boolean result = userService.processPasswordResetByIdEmail(id, email);
        if (result) return ResponseEntity.ok().body(Map.of("message", "비밀번호 재설정 이메일이 전송되었습니다."));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "아이디/이메일이 일치하지 않습니다."));
    }

//    @PostMapping("/check-duplicate")
//    public ResponseEntity<String> checkDuplicate(@RequestBody UserDTO userDTO) {
//        boolean isIdDuplicated = userService.isIdDuplicated(userDTO.getId());
//        boolean isEmailDuplicated = userService.isEmailDuplicated(userDTO.getEmail());
//        boolean isNicknameDuplicated = userService.isNicknameDuplicated(userDTO.getNickname());
//        if (isIdDuplicated) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("아이디가 이미 존재합니다.");
//        if (isEmailDuplicated) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("이메일이 이미 존재합니다.");
//        if (isNicknameDuplicated) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("닉네임이 이미 존재합니다.");
//        return ResponseEntity.ok("중복 없음");
//    }

    @GetMapping("/isAdmin/{id}")
    public boolean isAdmin(@PathVariable String id) {
        return userService.isAdmin(id);
    }

    private static String safe(String s) { return s == null ? "" : s.trim(); }
}
