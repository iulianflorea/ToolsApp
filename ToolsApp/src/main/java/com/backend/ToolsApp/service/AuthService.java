package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.auth.AuthResponse;
import com.backend.ToolsApp.dto.auth.LoginRequest;
import com.backend.ToolsApp.dto.auth.RegisterRequest;
import com.backend.ToolsApp.entity.Tenant;
import com.backend.ToolsApp.entity.User;
import com.backend.ToolsApp.enums.UserRole;
import com.backend.ToolsApp.exception.BadRequestException;
import com.backend.ToolsApp.repository.TenantRepository;
import com.backend.ToolsApp.repository.UserRepository;
import com.backend.ToolsApp.security.JwtTokenProvider;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityUser principal = (SecurityUser) auth.getPrincipal();
        String token = tokenProvider.generateToken(principal);

        User user = principal.getUser();
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .tenantId(user.getTenantId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        Tenant tenant = new Tenant();
        tenant.setName(request.getCompanyName());
        tenant = tenantRepository.save(tenant);

        User user = new User();
        user.setTenantId(tenant.getId());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(UserRole.ADMIN);
        user = userRepository.save(user);

        SecurityUser principal = new SecurityUser(user);
        String token = tokenProvider.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .tenantId(user.getTenantId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
