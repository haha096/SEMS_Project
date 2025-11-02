import React, { useEffect } from "react";

function Chat() {
    return (
        <div>
             {/* Spring Boot에서 제공하는 채팅 페이지를 iframe으로 렌더링 */}
                        <div className="chat-container">
                            <iframe
                                src="http://localhost:8080/chat"  // Spring Boot에서 제공하는 채팅 페이지 URL
                                width="100%"
                                height="800px"  // 적당한 높이로 설정
                                title="채팅 페이지"
                            />
                        </div>
        </div>
    );
}

export default Chat;
