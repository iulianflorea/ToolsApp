package com.backend.ToolsApp.dto.user;

import com.backend.ToolsApp.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRequest {
    @NotBlank @Email
    private String email;
    @Size(min = 6)
    private String password;
    @NotBlank
    private String fullName;
    @NotNull
    private UserRole role;
}
