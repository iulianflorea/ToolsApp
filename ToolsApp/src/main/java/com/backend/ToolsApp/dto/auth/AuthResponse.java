package com.backend.ToolsApp.dto.auth;

import com.backend.ToolsApp.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private Long tenantId;
    private String email;
    private String fullName;
    private UserRole role;
}
