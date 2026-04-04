package com.backend.ToolsApp.controller;

import com.backend.ToolsApp.dto.maintenance.MaintenanceRequest;
import com.backend.ToolsApp.dto.maintenance.MaintenanceResponse;
import com.backend.ToolsApp.enums.MaintenanceStatus;
import com.backend.ToolsApp.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping
    public ResponseEntity<List<MaintenanceResponse>> getAll(
            @RequestParam(required = false) MaintenanceStatus status,
            @RequestParam(required = false) Long assetId) {
        return ResponseEntity.ok(maintenanceService.getAll(status, assetId));
    }

    @PostMapping
    public ResponseEntity<MaintenanceResponse> create(@Valid @RequestBody MaintenanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody MaintenanceRequest request) {
        return ResponseEntity.ok(maintenanceService.update(id, request));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<MaintenanceResponse> complete(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.complete(id));
    }
}
