package com.backend.ToolsApp.dto.location;

import com.backend.ToolsApp.enums.LocationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LocationRequest {
    @NotBlank
    private String name;
    private String address;
    @NotNull
    private LocationType type;
}
