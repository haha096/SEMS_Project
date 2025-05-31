package Not_Found.model.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Getter
@Setter
public class ChatMsgDTO {
    private String senderId;
    private String receiverId;
    private String content;
    private OffsetDateTime timestamp;
}

