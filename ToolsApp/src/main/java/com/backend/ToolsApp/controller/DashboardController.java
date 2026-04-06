package com.backend.ToolsApp.controller;

import com.backend.ToolsApp.dto.dashboard.CategoryStats;
import com.backend.ToolsApp.dto.dashboard.DashboardStats;
import com.backend.ToolsApp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/by-category")
    public ResponseEntity<List<CategoryStats>> getByCategory() {
        return ResponseEntity.ok(dashboardService.getCategoryStats());
    }
}
