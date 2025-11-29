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

    // 회원가입 (이전 단계에서 리팩토링한 버전 유지)
    @Transactional
    public String register(UserDTO dto) {
        String id = safe(dto.getId());
        String pw = safe(dto.getPassword());
        String email = safe(dto.getEmail());
        String nickname = safe(dto.getNickname());
        if (id.isBlank()) throw err("아이디를 입력하세요.", "id");
        if (pw.isBlank()) throw err("비밀번호를 입력하세요.", "password");
        if (email.isBlank()) throw err("이메일을 입력하세요.", "email");
        if (nickname.isBlank()) throw err("닉네임(이름)을 입력하세요.", "nickname");
        if (userRepository.existsById(id)) throw err("이미 사용 중인 아이디입니다.", "id");
        if (userRepository.existsByEmail(email)) throw err("이미 등록된 이메일입니다.", "email");
        if (userRepository.existsByNickname(nickname)) throw err("이미 사용 중인 닉네임입니다.", "nickname");
        User user = new User(id, passwordEncoder.encode(pw), nickname, email, false);
        userRepository.save(user);
        return "OK";
    }

    /* ===================== 여기부터 추가 ===================== */

    // 아이디 찾기: 이름(=nickname) + 이메일로 검증 후 아이디 메일 발송
    @Transactional(readOnly = true)
    public boolean processFindIdByNameEmail(String name, String email) {
        Optional<User> userOpt = userRepository.findByNicknameAndEmail(name.trim(), email.trim());
        if (userOpt.isPresent()) {
            sendIdByEmail(email, userOpt.get().getId());
            return true;
        }
        return false;
    }

    // 비밀번호 재설정: 아이디 + 이메일 일치 시 임시 비번 발급 메일 발송
    @Transactional
    public boolean processPasswordResetByIdEmail(String id, String email) {
        Optional<User> userOpt = userRepository.findByIdAndEmail(id.trim(), email.trim());
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

    /* ===================== 여기까지 추가 ===================== */

    // 기존 로그인/업데이트/이메일 발송 로직 유지
    public Optional<User> getUserIfValid(String id, String password) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return userOpt;
        }
        return Optional.empty();
    }

    @Transactional
    public boolean processPasswordReset(String email) { // (이전 방식: email만) — 사용 안 하면 두어도 무방
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

    public Optional<Not_Found.model.entity.User> findById(String id) {
        return userRepository.findById(id);
    }

    public boolean isAdmin(String id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(User::getIsAdmin).orElse(false);
    }
    public boolean isIdDuplicated(String id) { return userRepository.existsById(id); }
    public boolean isEmailDuplicated(String email) { return userRepository.existsByEmail(email); }
    public boolean isNicknameDuplicated(String nickname) { return userRepository.existsByNickname(nickname); }

    private IllegalArgumentException err(String m, String f) { return new IllegalArgumentException(m + "::" + f); }
    private String safe(String s) { return s == null ? "" : s.trim(); }
}
