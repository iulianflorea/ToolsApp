package com.backend.ToolsApp.dto.alert;

import com.backend.ToolsApp.enums.AlertType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {
    private Long id;
    private Long tenantId;
    private Long assetId;
    private String assetName;
    private String assetSerialNumber;
    private AlertType type;
    private String message;
    private boolean isRead;
    private boolean urgent;
    private String alertDate;
    private Integer daysRemaining;
    private String alertExtra;
    private LocalDateTime createdAt;
}
