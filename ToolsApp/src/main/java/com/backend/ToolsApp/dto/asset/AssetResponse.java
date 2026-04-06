package com.backend.ToolsApp.dto.asset;

import com.backend.ToolsApp.enums.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponse {
    private Long id;
    private Long tenantId;
    private String name;
    private String serialNumber;
    private String category;
    private AssetStatus status;
    private String qrCode;
    private LocalDate purchaseDate;
    private BigDecimal purchasePrice;
    private String notes;
    private String imageUrl;
    private Integer warrantyMonths;
    private LocalDate warrantyExpiresAt;
    private LocalDate metrologyDate;
    private LocalDate metrologyExpiryDate;
    private Long currentLocationId;
    private String currentLocationName;
    private LocalDateTime createdAt;
}
