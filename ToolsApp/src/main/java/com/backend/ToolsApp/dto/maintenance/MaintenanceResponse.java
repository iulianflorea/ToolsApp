package com.backend.ToolsApp.dto.maintenance;

import com.backend.ToolsApp.enums.MaintenanceStatus;
import com.backend.ToolsApp.enums.MaintenanceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceResponse {
    private Long id;
    private Long tenantId;
    private Long assetId;
    private String assetName;
    private MaintenanceType type;
    private LocalDate scheduledDate;
    private LocalDate completedDate;
    private BigDecimal cost;
    private String technicianName;
    private String notes;
    private MaintenanceStatus status;
}
