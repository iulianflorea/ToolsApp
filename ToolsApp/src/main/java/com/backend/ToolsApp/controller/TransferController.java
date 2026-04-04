package com.backend.ToolsApp.controller;

import com.backend.ToolsApp.dto.transfer.TransferRequest;
import com.backend.ToolsApp.dto.transfer.TransferResponse;
import com.backend.ToolsApp.enums.TransferStatus;
import com.backend.ToolsApp.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @GetMapping
    public ResponseEntity<List<TransferResponse>> getAll(
            @RequestParam(required = false) Long assetId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) TransferStatus status) {
        return ResponseEntity.ok(transferService.getAll(assetId, userId, status));
    }

    @PostMapping
    public ResponseEntity<TransferResponse> create(@Valid @RequestBody TransferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transferService.create(request));
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<TransferResponse> returnAsset(@PathVariable Long id) {
        return ResponseEntity.ok(transferService.returnAsset(id));
    }
}
