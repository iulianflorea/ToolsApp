package com.backend.ToolsApp.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryStats {
    private String category;
    private long total;
    private long available;
    private long inUse;
    private long inMaintenance;
    private long retired;
}
