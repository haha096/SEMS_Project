package com.gsem.backend.controller;

import com.gsem.backend.model.dto.UserDTO;
import com.gsem.backend.model.entity.User;
import com.gsem.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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
    public ResponseEntity<?> login(@RequestBody UserDTO userDTO) {
        Optional<User> userOpt = userService.getUserIfValid(userDTO.getId(), userDTO.getPassword());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("nickname", user.getNickname());
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "아이디 또는 비밀번호가 틀렸습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
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
