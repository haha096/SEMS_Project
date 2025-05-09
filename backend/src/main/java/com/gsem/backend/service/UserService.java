package com.gsem.backend.service;

import com.gsem.backend.model.dto.UserDTO;
import com.gsem.backend.model.entity.User;
import com.gsem.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // 회원가입
    public String register(UserDTO userDTO) {
        if (userRepository.existsById(userDTO.getId())) {
            return "이미 사용 중인 아이디입니다.";
        }

        if (userRepository.findByEmail(userDTO.getEmail()).isPresent()) {
            return "이미 등록된 이메일입니다.";
        }

        String encodedPassword = passwordEncoder.encode(userDTO.getPassword());
        User user = new User(
                userDTO.getId(),
                encodedPassword,
                userDTO.getNickname(),
                userDTO.getEmail(),
                userDTO.getIsAdmin()
        );

        userRepository.save(user);
        return "회원가입 성공!";
    }

    // 로그인
    public Optional<User> getUserIfValid(String id, String password) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return userOpt;
        }
        return Optional.empty();
    }



    public boolean isAdmin(String id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(User::getIsAdmin).orElse(false);
    }

    public boolean isIdDuplicated(String id) {
        return userRepository.existsById(id);
    }

    public boolean isEmailDuplicated(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean isNicknameDuplicated(String nickname) {
        return userRepository.existsByNickname(nickname);
    }
}
