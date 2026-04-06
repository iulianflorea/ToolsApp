package com.backend.ToolsApp.dto.transfer;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TransferRequest {
    @NotNull
    private Long assetId;
    private Long fromLocationId;
    private Long toLocationId;
    private Long assignedToUserId;
    private LocalDate returnDate;
    private boolean indefinitePeriod;
    private String notes;
}
