package com.backend.ToolsApp.dto.asset;

import com.backend.ToolsApp.enums.AssetStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssetRequest {
    @NotBlank
    private String name;
    private String serialNumber;
    private String category;
    private AssetStatus status;
    private LocalDate purchaseDate;
    private BigDecimal purchasePrice;
    private String notes;
    private String imageUrl;
    private Integer warrantyMonths;
    private LocalDate metrologyDate;
    private LocalDate metrologyExpiryDate;
    private Long locationId;   // set on create → auto-assign transfer + IN_USE
}
