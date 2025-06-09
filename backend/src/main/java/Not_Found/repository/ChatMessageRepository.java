package Not_Found.repository;

import Not_Found.model.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m " +
            "WHERE (m.senderId = :userId AND m.receiverId = 'admin') " +
            "   OR (m.senderId = 'admin' AND m.receiverId = :userId) " +
            "ORDER BY m.timestamp ASC")
    List<ChatMessage> findMessagesWithAdmin(@Param("userId") String userId);

    @Query("SELECT DISTINCT m.senderId FROM ChatMessage m WHERE m.receiverId = 'admin' " +
            "UNION " +
            "SELECT DISTINCT m.receiverId FROM ChatMessage m WHERE m.senderId = 'admin'")
    List<String> findAllUserIdsWhoChattedWithAdmin();

}
