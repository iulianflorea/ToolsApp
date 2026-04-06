package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.dashboard.CategoryStats;
import com.backend.ToolsApp.dto.dashboard.DashboardStats;
import com.backend.ToolsApp.enums.AssetStatus;
import com.backend.ToolsApp.enums.MaintenanceStatus;
import com.backend.ToolsApp.enums.TransferStatus;
import com.backend.ToolsApp.repository.AlertRepository;
import com.backend.ToolsApp.repository.AssetRepository;
import com.backend.ToolsApp.repository.AssetTransferRepository;
import com.backend.ToolsApp.repository.MaintenanceRecordRepository;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final AssetRepository assetRepository;
    private final AssetTransferRepository transferRepository;
    private final MaintenanceRecordRepository maintenanceRepository;
    private final AlertRepository alertRepository;

    public DashboardStats getStats() {
        Long tid = ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();

        return DashboardStats.builder()
                .totalAssets(assetRepository.countByTenantId(tid))
                .availableAssets(assetRepository.countByTenantIdAndStatus(tid, AssetStatus.AVAILABLE))
                .inUseAssets(assetRepository.countByTenantIdAndStatus(tid, AssetStatus.IN_USE))
                .inMaintenanceAssets(assetRepository.countByTenantIdAndStatus(tid, AssetStatus.IN_MAINTENANCE))
                .retiredAssets(assetRepository.countByTenantIdAndStatus(tid, AssetStatus.RETIRED))
                .overdueTransfers(transferRepository.countByTenantIdAndStatusAndReturnDateBefore(
                        tid, TransferStatus.ACTIVE, LocalDateTime.now()))
                .pendingMaintenance(maintenanceRepository.countByTenantIdAndStatus(tid, MaintenanceStatus.PENDING))
                .unreadAlerts(alertRepository.countByTenantIdAndIsReadFalse(tid))
                .build();
    }

    public List<CategoryStats> getCategoryStats() {
        Long tid = ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
        return assetRepository.countByTenantIdGroupByCategory(tid).stream()
                .map(row -> new CategoryStats(
                        row[0] != null ? (String) row[0] : "Fără categorie",
                        ((Number) row[1]).longValue(),
                        ((Number) row[2]).longValue(),
                        ((Number) row[3]).longValue(),
                        ((Number) row[4]).longValue(),
                        ((Number) row[5]).longValue()
                ))
                .toList();
    }
}
