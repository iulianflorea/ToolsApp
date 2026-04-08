package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.alert.AlertResponse;
import com.backend.ToolsApp.entity.Alert;
import com.backend.ToolsApp.enums.AlertType;
import com.backend.ToolsApp.exception.ResourceNotFoundException;
import com.backend.ToolsApp.repository.AlertRepository;
import com.backend.ToolsApp.repository.AssetRepository;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlertService {

    private final AlertRepository alertRepository;
    private final AssetRepository assetRepository;

    private Long tenantId() {
        return ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
    }

    public List<AlertResponse> getAll() {
        return alertRepository.findByTenantIdOrderByIsReadAscCreatedAtDesc(tenantId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public AlertResponse markRead(Long id) {
        Alert alert = alertRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        alert.setRead(true);
        return toResponse(alertRepository.save(alert));
    }

    @Transactional
    public void markAllRead() {
        alertRepository.markAllReadByTenantId(tenantId());
    }

    @Transactional
    public void delete(Long id) {
        Alert alert = alertRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        alertRepository.delete(alert);
    }

    @Transactional
    public void createAlert(Long tenantId, Long assetId, AlertType type, String message) {
        Alert alert = new Alert();
        alert.setTenantId(tenantId);
        alert.setAssetId(assetId);
        alert.setType(type);
        alert.setMessage(message);
        alertRepository.save(alert);
    }

    private AlertResponse toResponse(Alert a) {
        AlertResponse r = new AlertResponse();
        r.setId(a.getId());
        r.setTenantId(a.getTenantId());
        r.setAssetId(a.getAssetId());
        r.setType(a.getType());
        r.setMessage(a.getMessage());
        r.setRead(a.isRead());
        r.setUrgent(a.isUrgent());
        r.setAlertDate(a.getAlertDate());
        r.setDaysRemaining(a.getDaysRemaining());
        r.setAlertExtra(a.getAlertExtra());
        r.setCreatedAt(a.getCreatedAt());
        if (a.getAssetId() != null)
            assetRepository.findById(a.getAssetId()).ifPresent(asset -> {
                r.setAssetName(asset.getName());
                r.setAssetSerialNumber(asset.getSerialNumber());
            });
        return r;
    }
}
