package com.backend.ToolsApp.dto.maintenance;

import com.backend.ToolsApp.enums.MaintenanceType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MaintenanceRequest {
    @NotNull
    private Long assetId;
    @NotNull
    private MaintenanceType type;
    private LocalDate scheduledDate;
    private BigDecimal cost;
    private String technicianName;
    private String notes;
}
