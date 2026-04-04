package com.backend.ToolsApp.dto.transfer;

import com.backend.ToolsApp.enums.TransferStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponse {
    private Long id;
    private Long tenantId;
    private Long assetId;
    private String assetName;
    private String assetSerialNumber;
    private Long fromLocationId;
    private String fromLocationName;
    private Long toLocationId;
    private String toLocationName;
    private Long assignedToUserId;
    private String assignedToUserName;
    private LocalDateTime transferDate;
    private LocalDateTime returnDate;
    private String notes;
    private TransferStatus status;
}
