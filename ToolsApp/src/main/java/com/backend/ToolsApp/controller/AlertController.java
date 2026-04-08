package com.backend.ToolsApp.controller;

import com.backend.ToolsApp.dto.alert.AlertResponse;
import com.backend.ToolsApp.scheduler.AlertScheduler;
import com.backend.ToolsApp.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;
    private final AlertScheduler alertScheduler;

    @PostMapping("/check")
    public ResponseEntity<Void> check() {
        alertScheduler.checkExpiringDates();
        alertScheduler.checkUpcomingMaintenance();
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAll() {
        return ResponseEntity.ok(alertService.getAll());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<AlertResponse> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.markRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        alertService.markAllRead();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        alertService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
