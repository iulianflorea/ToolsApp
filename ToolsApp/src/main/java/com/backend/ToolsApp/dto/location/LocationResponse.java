package com.backend.ToolsApp.dto.location;

import com.backend.ToolsApp.enums.LocationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponse {
    private Long id;
    private Long tenantId;
    private String name;
    private String address;
    private LocationType type;
    private boolean active;
}
