package com.backend.ToolsApp.controller;

import com.backend.ToolsApp.dto.asset.AssetRequest;
import com.backend.ToolsApp.dto.asset.AssetResponse;
import com.backend.ToolsApp.enums.AssetStatus;
import com.backend.ToolsApp.service.AssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAll(
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(assetService.getAll(status, category, q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getById(id));
    }

    @GetMapping("/qr/{qrCode}")
    public ResponseEntity<AssetResponse> getByQrCode(@PathVariable String qrCode) {
        return ResponseEntity.ok(assetService.getByQrCode(qrCode));
    }

    @GetMapping("/search")
    public ResponseEntity<List<AssetResponse>> search(@RequestParam String q) {
        return ResponseEntity.ok(assetService.getAll(null, null, q));
    }

    @PostMapping
    public ResponseEntity<AssetResponse> create(@Valid @RequestBody AssetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assetService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody AssetRequest request) {
        return ResponseEntity.ok(assetService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
