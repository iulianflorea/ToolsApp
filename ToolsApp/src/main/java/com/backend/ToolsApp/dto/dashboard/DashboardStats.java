package com.backend.ToolsApp.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalAssets;
    private long availableAssets;
    private long inUseAssets;
    private long inMaintenanceAssets;
    private long retiredAssets;
    private long overdueTransfers;
    private long pendingMaintenance;
    private long unreadAlerts;
}
