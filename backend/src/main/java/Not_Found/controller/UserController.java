package Not_Found.controller;

import Not_Found.model.dto.UserDTO;
import Not_Found.model.entity.User;
import Not_Found.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

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

            System.out.println("로그인 세션 ID: " + session.getId());
            System.out.println("로그인 저장된 userId: " + session.getAttribute("userId"));
            System.out.println("가져온 User 정보: " + user);

            Map<String, Object> response = new HashMap<>();
            response.put("userId", user.getId());
            response.put("nickname", user.getNickname());
            response.put("email", user.getEmail());
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "아이디 또는 비밀번호가 틀렸습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
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
