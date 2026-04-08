package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.asset.AssetRequest;
import com.backend.ToolsApp.dto.asset.AssetResponse;
import com.backend.ToolsApp.entity.Asset;
import com.backend.ToolsApp.entity.AssetTransfer;
import com.backend.ToolsApp.entity.Location;
import com.backend.ToolsApp.enums.AssetStatus;
import com.backend.ToolsApp.enums.LocationType;
import com.backend.ToolsApp.enums.TransferStatus;
import com.backend.ToolsApp.exception.ResourceNotFoundException;
import com.backend.ToolsApp.mapper.AssetMapper;
import com.backend.ToolsApp.repository.AlertRepository;
import com.backend.ToolsApp.repository.AssetRepository;
import com.backend.ToolsApp.repository.AssetTransferRepository;
import com.backend.ToolsApp.repository.LocationRepository;
import com.backend.ToolsApp.repository.MaintenanceRecordRepository;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetService {

    private static final String STORAGE_LOCATION_NAME = "Depozit";

    private final AssetRepository assetRepository;
    private final AssetMapper assetMapper;
    private final AssetTransferRepository transferRepository;
    private final LocationRepository locationRepository;
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final AlertRepository alertRepository;

    private Long tenantId() {
        return ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
    }

    public List<AssetResponse> getAll(AssetStatus status, String category, String q) {
        return assetRepository.findFiltered(tenantId(), status, category, q)
                .stream().map(this::enrichResponse).toList();
    }

    public AssetResponse getById(Long id) {
        Asset asset = assetRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id));
        return enrichResponse(asset);
    }

    public AssetResponse getByQrCode(String qrCode) {
        Asset asset = assetRepository.findByQrCodeAndTenantId(qrCode, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found for QR code"));
        return enrichResponse(asset);
    }

    @Transactional
    public AssetResponse create(AssetRequest request) {
        Asset asset = assetMapper.toEntity(request);
        asset.setTenantId(tenantId());

        if (request.getLocationId() != null) {
            // Location provided → IN_USE
            asset.setStatus(AssetStatus.IN_USE);
        } else if (request.getStatus() == null) {
            asset.setStatus(AssetStatus.AVAILABLE);
        }

        Asset saved = assetRepository.save(asset);
        // Assign qrCode = ID (numeric, readable on a label)
        saved.setQrCode(String.valueOf(saved.getId()));
        saved = assetRepository.save(saved);

        if (request.getLocationId() != null) {
            createTransfer(saved, request.getLocationId());
        }

        return enrichResponse(saved);
    }

    @Transactional
    public AssetResponse update(Long id, AssetRequest request) {
        Asset asset = assetRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id));
        assetMapper.updateEntity(request, asset);
        return enrichResponse(assetRepository.save(asset));
    }

    @Transactional
    public void delete(Long id) {
        Asset asset = assetRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id));
        alertRepository.deleteByAssetId(id);
        maintenanceRecordRepository.deleteByAssetId(id);
        transferRepository.deleteByAssetId(id);
        assetRepository.delete(asset);
    }

    // ── Called by TransferService when an asset is returned ───────────────────
    @Transactional
    public void onAssetReturned(Asset asset) {
        asset.setStatus(AssetStatus.AVAILABLE);
        assetRepository.save(asset);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AssetResponse enrichResponse(Asset asset) {
        AssetResponse response = assetMapper.toResponse(asset);
        transferRepository.findFirstByAssetIdAndTenantIdAndStatusOrderByTransferDateDesc(
                asset.getId(), asset.getTenantId(), TransferStatus.ACTIVE)
                .ifPresent(t -> {
                    response.setCurrentLocationId(t.getToLocationId());
                    if (t.getToLocationId() != null) {
                        locationRepository.findById(t.getToLocationId())
                                .ifPresent(l -> response.setCurrentLocationName(l.getName()));
                    }
                });
        return response;
    }

    private void assignToStorage(Asset asset) {
        Long tid = asset.getTenantId();
        Location storage = locationRepository
                .findByTenantIdAndNameIgnoreCase(tid, STORAGE_LOCATION_NAME)
                .orElseGet(() -> {
                    Location loc = new Location();
                    loc.setTenantId(tid);
                    loc.setName(STORAGE_LOCATION_NAME);
                    loc.setType(LocationType.WAREHOUSE);
                    loc.setActive(true);
                    return locationRepository.save(loc);
                });
        createTransfer(asset, storage.getId());
    }

    private void createTransfer(Asset asset, Long toLocationId) {
        AssetTransfer t = new AssetTransfer();
        t.setTenantId(asset.getTenantId());
        t.setAssetId(asset.getId());
        t.setToLocationId(toLocationId);
        t.setIndefinitePeriod(true);
        transferRepository.save(t);
    }
}
