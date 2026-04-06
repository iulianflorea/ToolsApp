package com.backend.ToolsApp.repository;

import com.backend.ToolsApp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByTenantId(Long tenantId);
    Optional<User> findByIdAndTenantId(Long id, Long tenantId);
    Optional<User> findByQrCodeAndTenantId(String qrCode, Long tenantId);
}
