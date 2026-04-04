package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.maintenance.MaintenanceRequest;
import com.backend.ToolsApp.dto.maintenance.MaintenanceResponse;
import com.backend.ToolsApp.entity.Asset;
import com.backend.ToolsApp.entity.MaintenanceRecord;
import com.backend.ToolsApp.enums.AssetStatus;
import com.backend.ToolsApp.enums.MaintenanceStatus;
import com.backend.ToolsApp.exception.ResourceNotFoundException;
import com.backend.ToolsApp.repository.AssetRepository;
import com.backend.ToolsApp.repository.MaintenanceRecordRepository;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaintenanceService {

    private final MaintenanceRecordRepository maintenanceRepository;
    private final AssetRepository assetRepository;

    private Long tenantId() {
        return ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
    }

    public List<MaintenanceResponse> getAll(MaintenanceStatus status, Long assetId) {
        return maintenanceRepository.findFiltered(tenantId(), status, assetId)
                .stream().map(this::toResponse).toList();
    }

    public List<MaintenanceResponse> getByAsset(Long assetId) {
        return maintenanceRepository.findByAssetIdAndTenantId(assetId, tenantId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public MaintenanceResponse create(MaintenanceRequest request) {
        Long tid = tenantId();
        assetRepository.findByIdAndTenantId(request.getAssetId(), tid)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));

        MaintenanceRecord record = new MaintenanceRecord();
        record.setTenantId(tid);
        record.setAssetId(request.getAssetId());
        record.setType(request.getType());
        record.setScheduledDate(request.getScheduledDate());
        record.setCost(request.getCost());
        record.setTechnicianName(request.getTechnicianName());
        record.setNotes(request.getNotes());
        record.setStatus(MaintenanceStatus.PENDING);

        Asset asset = assetRepository.findByIdAndTenantId(request.getAssetId(), tid).get();
        asset.setStatus(AssetStatus.IN_MAINTENANCE);
        assetRepository.save(asset);

        return toResponse(maintenanceRepository.save(record));
    }

    @Transactional
    public MaintenanceResponse update(Long id, MaintenanceRequest request) {
        MaintenanceRecord record = maintenanceRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found"));
        record.setType(request.getType());
        record.setScheduledDate(request.getScheduledDate());
        if (request.getCost() != null) record.setCost(request.getCost());
        if (request.getTechnicianName() != null) record.setTechnicianName(request.getTechnicianName());
        if (request.getNotes() != null) record.setNotes(request.getNotes());
        return toResponse(maintenanceRepository.save(record));
    }

    @Transactional
    public MaintenanceResponse complete(Long id) {
        Long tid = tenantId();
        MaintenanceRecord record = maintenanceRepository.findByIdAndTenantId(id, tid)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found"));

        record.setStatus(MaintenanceStatus.COMPLETED);
        record.setCompletedDate(LocalDate.now());

        Asset asset = assetRepository.findByIdAndTenantId(record.getAssetId(), tid)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
        asset.setStatus(AssetStatus.AVAILABLE);
        assetRepository.save(asset);

        return toResponse(maintenanceRepository.save(record));
    }

    private MaintenanceResponse toResponse(MaintenanceRecord m) {
        MaintenanceResponse r = new MaintenanceResponse();
        r.setId(m.getId());
        r.setTenantId(m.getTenantId());
        r.setAssetId(m.getAssetId());
        r.setType(m.getType());
        r.setScheduledDate(m.getScheduledDate());
        r.setCompletedDate(m.getCompletedDate());
        r.setCost(m.getCost());
        r.setTechnicianName(m.getTechnicianName());
        r.setNotes(m.getNotes());
        r.setStatus(m.getStatus());
        assetRepository.findById(m.getAssetId()).ifPresent(a -> r.setAssetName(a.getName()));
        return r;
    }
}
