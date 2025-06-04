package Not_Found.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ChatController {

    @GetMapping("/chat")
    public String chatPage() {
        return "chat"; // static 폴더 안에 있는 chat.mustache 불러옴
    }
}
