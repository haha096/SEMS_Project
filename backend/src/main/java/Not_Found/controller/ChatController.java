package Not_Found.controller;

import Not_Found.model.dto.ChatMsgDTO;
import Not_Found.model.entity.ChatMessage;
import Not_Found.service.ChatMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatMessageService chatMessageService) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageService = chatMessageService;
    }

    @MessageMapping("/user-to-admin")
    public void sendToAdmin(@Payload ChatMsgDTO dto) {
        // DB 저장
        chatMessageService.save(convertToEntity(dto));
        // 실시간 전송
        messagingTemplate.convertAndSend("/topic/messages/admin", dto);
    }

    @MessageMapping("/admin-to-user")
    public void sendToUser(@Payload ChatMsgDTO dto) {
        chatMessageService.save(convertToEntity(dto));
        messagingTemplate.convertAndSendToUser(dto.getReceiverId(), "/queue/messages", dto);
    }

    private ChatMessage convertToEntity(ChatMsgDTO dto) {
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(dto.getSenderId());
        msg.setReceiverId(dto.getReceiverId());
        msg.setContent(dto.getContent());
        msg.setTimestamp(
                dto.getTimestamp() != null
                        ? dto.getTimestamp()
                        : OffsetDateTime.now(ZoneId.of("Asia/Seoul"))
        );
        return msg;
    }
}

