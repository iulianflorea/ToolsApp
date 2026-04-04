package com.backend.ToolsApp.repository;

import com.backend.ToolsApp.entity.Asset;
import com.backend.ToolsApp.enums.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByTenantId(Long tenantId);

    Optional<Asset> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Asset> findByQrCodeAndTenantId(String qrCode, Long tenantId);

    long countByTenantIdAndStatus(Long tenantId, AssetStatus status);

    long countByTenantId(Long tenantId);

    @Query("SELECT a FROM Asset a WHERE a.tenantId = :tenantId " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:category IS NULL OR a.category = :category) " +
           "AND (:q IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "     OR LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Asset> findFiltered(@Param("tenantId") Long tenantId,
                             @Param("status") AssetStatus status,
                             @Param("category") String category,
                             @Param("q") String q);
}
