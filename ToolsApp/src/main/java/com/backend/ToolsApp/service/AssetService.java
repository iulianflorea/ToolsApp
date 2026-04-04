package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.asset.AssetRequest;
import com.backend.ToolsApp.dto.asset.AssetResponse;
import com.backend.ToolsApp.entity.Asset;
import com.backend.ToolsApp.enums.AssetStatus;
import com.backend.ToolsApp.exception.ResourceNotFoundException;
import com.backend.ToolsApp.mapper.AssetMapper;
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
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetMapper assetMapper;

    private Long tenantId() {
        return ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
    }

    public List<AssetResponse> getAll(AssetStatus status, String category, String q) {
        List<Asset> assets = assetRepository.findFiltered(tenantId(), status, category, q);
        return assetMapper.toResponseList(assets);
    }

    public AssetResponse getById(Long id) {
        Asset asset = assetRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id));
        return assetMapper.toResponse(asset);
    }

    public AssetResponse getByQrCode(String qrCode) {
        Asset asset = assetRepository.findByQrCodeAndTenantId(qrCode, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found for QR code"));
        return assetMapper.toResponse(asset);
    }

    @Transactional
    public AssetResponse create(AssetRequest request) {
        Asset asset = assetMapper.toEntity(request);
        asset.setTenantId(tenantId());
        if (request.getStatus() == null) {
            asset.setStatus(AssetStatus.AVAILABLE);
        }
        return assetMapper.toResponse(assetRepository.save(asset));
    }

    @Transactional
    public AssetResponse update(Long id, AssetRequest request) {
        Asset asset = assetRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id));
        assetMapper.updateEntity(request, asset);
        return assetMapper.toResponse(assetRepository.save(asset));
    }

    @Transactional
    public void delete(Long id) {
        Asset asset = assetRepository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id));
        assetRepository.delete(asset);
    }
}
