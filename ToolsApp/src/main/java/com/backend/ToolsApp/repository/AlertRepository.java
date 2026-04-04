package com.backend.ToolsApp.repository;

import com.backend.ToolsApp.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByTenantIdOrderByIsReadAscCreatedAtDesc(Long tenantId);

    Optional<Alert> findByIdAndTenantId(Long id, Long tenantId);

    long countByTenantIdAndIsReadFalse(Long tenantId);

    @Modifying
    @Query("UPDATE Alert a SET a.isRead = true WHERE a.tenantId = :tenantId")
    void markAllReadByTenantId(@Param("tenantId") Long tenantId);
}
