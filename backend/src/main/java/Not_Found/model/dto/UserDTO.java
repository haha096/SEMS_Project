package Not_Found.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UserDTO {
    private String id;
    private String password;
    private String nickname;
    private String email;
    private boolean isAdmin;

    @JsonProperty("isAdmin")
    public Boolean getIsAdmin() {
        return isAdmin;
    }
}
