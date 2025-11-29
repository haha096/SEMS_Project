package Not_Found.repository;

import Not_Found.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    // 기존
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    // 새로 추가 (아이디/비번 찾기용)
    Optional<User> findByNicknameAndEmail(String nickname, String email);
    Optional<User> findByIdAndEmail(String id, String email);
}
