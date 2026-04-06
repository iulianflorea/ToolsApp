package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.user.UserRequest;
import com.backend.ToolsApp.dto.user.UserResponse;
import com.backend.ToolsApp.entity.User;
import com.backend.ToolsApp.exception.BadRequestException;
import com.backend.ToolsApp.exception.ResourceNotFoundException;
import com.backend.ToolsApp.mapper.UserMapper;
import com.backend.ToolsApp.repository.UserRepository;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    private Long tenantId() {
        return ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
    }

    public List<UserResponse> getAll() {
        return userMapper.toResponseList(userRepository.findByTenantId(tenantId()));
    }

    public UserResponse getById(Long id) {
        User user = userRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return userMapper.toResponse(user);
    }

    public UserResponse getByQrCode(String qrCode) {
        User user = userRepository.findByQrCodeAndTenantId(qrCode, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found for QR code"));
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }
        User user = userMapper.toEntity(request);
        user.setTenantId(tenantId());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        User saved = userRepository.save(user);
        saved.setQrCode(String.valueOf(saved.getId()));
        return userMapper.toResponse(userRepository.save(saved));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        User user = userRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setActive(false);
        userRepository.save(user);
    }
}
