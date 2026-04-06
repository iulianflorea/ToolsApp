package com.backend.ToolsApp.repository;

import com.backend.ToolsApp.entity.MaintenanceRecord;
import com.backend.ToolsApp.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {

    List<MaintenanceRecord> findByTenantId(Long tenantId);

    Optional<MaintenanceRecord> findByIdAndTenantId(Long id, Long tenantId);

    List<MaintenanceRecord> findByAssetIdAndTenantId(Long assetId, Long tenantId);

    @Query("SELECT m FROM MaintenanceRecord m WHERE m.tenantId = :tenantId " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:assetId IS NULL OR m.assetId = :assetId)")
    List<MaintenanceRecord> findFiltered(@Param("tenantId") Long tenantId,
                                         @Param("status") MaintenanceStatus status,
                                         @Param("assetId") Long assetId);

    long countByTenantIdAndStatus(Long tenantId, MaintenanceStatus status);

    @Query("SELECT m FROM MaintenanceRecord m WHERE m.status = 'PENDING' " +
           "AND m.scheduledDate BETWEEN :from AND :to")
    List<MaintenanceRecord> findUpcomingMaintenance(@Param("from") LocalDate from,
                                                     @Param("to") LocalDate to);

    void deleteByAssetId(Long assetId);
}
