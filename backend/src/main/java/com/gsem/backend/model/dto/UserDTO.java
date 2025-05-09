package com.gsem.backend.model.dto;

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

    public Boolean getIsAdmin() {
        return isAdmin;
    }
}
