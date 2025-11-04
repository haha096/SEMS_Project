package Not_Found.service;

import Not_Found.model.dto.UserDTO;
import Not_Found.model.entity.User;
import Not_Found.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    // 회원가입
    @Transactional
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

    @Transactional
    public boolean processPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String tempPassword = UUID.randomUUID().toString().substring(0, 8);
            user.setPassword(passwordEncoder.encode(tempPassword));
            userRepository.save(user);

            sendPasswordResetEmail(email, tempPassword);
            return true;
        }
        return false;
    }

    private void sendPasswordResetEmail(String to, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[SEMS] 임시 비밀번호 안내");
        message.setText("안녕하세요. 회원님의 임시 비밀번호는 " + tempPassword + " 입니다. 로그인 후 비밀번호를 변경해주세요.");
        mailSender.send(message);
    }

    public boolean processFindId(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            sendIdByEmail(email, user.getId());
            return true;
        }
        return false;
    }

    private void sendIdByEmail(String to, String userId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[SEMS] 아이디 찾기 안내");
        message.setText("안녕하세요. 회원님의 아이디는 " + userId + " 입니다.");
        mailSender.send(message);
    }

    @Transactional
    public String updateNickname(String userId, String newNickname) {
        if (userRepository.existsByNickname(newNickname)) {
            return "이미 사용 중인 닉네임입니다.";
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setNickname(newNickname);
            userRepository.save(user);
            return "SUCCESS";
        } else {
            return "사용자를 찾을 수 없습니다.";
        }
    }

    @Transactional
    public String updatePassword(String userId, String currentPassword, String newPassword) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return "사용자를 찾을 수 없습니다.";
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return "현재 비밀번호가 일치하지 않습니다.";
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return "SUCCESS";
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
