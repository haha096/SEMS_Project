package Not_Found.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserDTO {
    private String id;
    private String password;
    private String nickname; // 프론트가 nickname으로 보냄
    private String email;
    private boolean isAdmin;

    // 프론트가 혹시 쓸지도 모를 별칭들(옵션): 보내면 매핑해줌, 안 보내면 무시
    @JsonAlias({"confirmPassword","passwordConfirm","passwordCheck","confirm_password"})
    private String confirmPassword;

    @JsonAlias({"name"})
    private String name; // 쓰지 않아도 무방 (nickname 우선 사용)

    public Boolean getIsAdmin() { return isAdmin; }
}
