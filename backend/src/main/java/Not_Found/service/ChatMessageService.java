package Not_Found.service;

import Not_Found.model.entity.ChatMessage;
import Not_Found.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatMessageService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    public void save(ChatMessage message) {
        chatMessageRepository.save(message);
    }

    public List<ChatMessage> getChatHistory(String userId) {
        return chatMessageRepository.findMessagesWithAdmin(userId);
    }

    public List<String> getAllUserIdsWhoChattedWithAdmin() {
        return chatMessageRepository.findAllUserIdsWhoChattedWithAdmin();
    }
}
