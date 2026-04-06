package com.backend.ToolsApp.repository;

import com.backend.ToolsApp.entity.AssetTransfer;
import com.backend.ToolsApp.enums.TransferStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AssetTransferRepository extends JpaRepository<AssetTransfer, Long> {

    List<AssetTransfer> findByTenantId(Long tenantId);

    Optional<AssetTransfer> findByIdAndTenantId(Long id, Long tenantId);

    List<AssetTransfer> findByAssetIdAndTenantId(Long assetId, Long tenantId);

    @Query("SELECT t FROM AssetTransfer t WHERE t.tenantId = :tenantId " +
           "AND (:assetId IS NULL OR t.assetId = :assetId) " +
           "AND (:userId IS NULL OR t.assignedToUserId = :userId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:fromDate IS NULL OR t.transferDate >= :fromDate) " +
           "AND (:toDate IS NULL OR t.transferDate <= :toDate)")
    List<AssetTransfer> findFiltered(@Param("tenantId") Long tenantId,
                                     @Param("assetId") Long assetId,
                                     @Param("userId") Long userId,
                                     @Param("status") TransferStatus status,
                                     @Param("fromDate") LocalDateTime fromDate,
                                     @Param("toDate") LocalDateTime toDate,
                                     Pageable pageable);

    long countByTenantIdAndStatusAndReturnDateBefore(Long tenantId, TransferStatus status, LocalDateTime date);

    boolean existsByAssetIdAndTenantIdAndStatus(Long assetId, Long tenantId, TransferStatus status);

    Optional<AssetTransfer> findFirstByAssetIdAndTenantIdAndStatusOrderByTransferDateDesc(
            Long assetId, Long tenantId, TransferStatus status);

    void deleteByAssetId(Long assetId);
}
