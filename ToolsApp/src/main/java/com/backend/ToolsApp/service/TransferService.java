package com.backend.ToolsApp.service;

import com.backend.ToolsApp.dto.transfer.TransferRequest;
import com.backend.ToolsApp.dto.transfer.TransferResponse;
import com.backend.ToolsApp.entity.Asset;
import com.backend.ToolsApp.entity.AssetTransfer;
import com.backend.ToolsApp.enums.AssetStatus;
import com.backend.ToolsApp.enums.TransferStatus;
import com.backend.ToolsApp.exception.BadRequestException;
import com.backend.ToolsApp.exception.ResourceNotFoundException;
import com.backend.ToolsApp.repository.AssetRepository;
import com.backend.ToolsApp.repository.AssetTransferRepository;
import com.backend.ToolsApp.repository.LocationRepository;
import com.backend.ToolsApp.repository.UserRepository;
import com.backend.ToolsApp.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransferService {

    private final AssetTransferRepository transferRepository;
    private final AssetRepository assetRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    private Long tenantId() {
        return ((SecurityUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getTenantId();
    }

    public List<TransferResponse> getAll(Long assetId, Long userId, TransferStatus status) {
        return transferRepository.findFiltered(tenantId(), assetId, userId, status)
                .stream().map(this::enrich).toList();
    }

    public List<TransferResponse> getByAsset(Long assetId) {
        return transferRepository.findByAssetIdAndTenantId(assetId, tenantId())
                .stream().map(this::enrich).toList();
    }

    @Transactional
    public TransferResponse create(TransferRequest request) {
        Long tid = tenantId();
        Asset asset = assetRepository.findByIdAndTenantId(request.getAssetId(), tid)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));

        if (transferRepository.existsByAssetIdAndTenantIdAndStatus(request.getAssetId(), tid, TransferStatus.ACTIVE)) {
            throw new BadRequestException("Asset already has an active transfer");
        }

        AssetTransfer transfer = new AssetTransfer();
        transfer.setTenantId(tid);
        transfer.setAssetId(request.getAssetId());
        transfer.setFromLocationId(request.getFromLocationId());
        transfer.setToLocationId(request.getToLocationId());
        transfer.setAssignedToUserId(request.getAssignedToUserId());
        if (request.getReturnDate() != null) {
            transfer.setReturnDate(request.getReturnDate().atStartOfDay());
        }
        transfer.setNotes(request.getNotes());

        asset.setStatus(AssetStatus.IN_USE);
        assetRepository.save(asset);

        return enrich(transferRepository.save(transfer));
    }

    @Transactional
    public TransferResponse returnAsset(Long id) {
        Long tid = tenantId();
        AssetTransfer transfer = transferRepository.findByIdAndTenantId(id, tid)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found"));

        if (transfer.getStatus() == TransferStatus.RETURNED) {
            throw new BadRequestException("Transfer already returned");
        }

        transfer.setStatus(TransferStatus.RETURNED);
        transfer.setReturnDate(LocalDateTime.now());

        Asset asset = assetRepository.findByIdAndTenantId(transfer.getAssetId(), tid)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
        asset.setStatus(AssetStatus.AVAILABLE);
        assetRepository.save(asset);

        return enrich(transferRepository.save(transfer));
    }

    private TransferResponse enrich(AssetTransfer t) {
        TransferResponse r = new TransferResponse();
        r.setId(t.getId());
        r.setTenantId(t.getTenantId());
        r.setAssetId(t.getAssetId());
        r.setFromLocationId(t.getFromLocationId());
        r.setToLocationId(t.getToLocationId());
        r.setAssignedToUserId(t.getAssignedToUserId());
        r.setTransferDate(t.getTransferDate());
        r.setReturnDate(t.getReturnDate());
        r.setNotes(t.getNotes());
        r.setStatus(t.getStatus());

        assetRepository.findById(t.getAssetId()).ifPresent(a -> {
            r.setAssetName(a.getName());
            r.setAssetSerialNumber(a.getSerialNumber());
        });
        if (t.getFromLocationId() != null)
            locationRepository.findById(t.getFromLocationId())
                    .ifPresent(l -> r.setFromLocationName(l.getName()));
        if (t.getToLocationId() != null)
            locationRepository.findById(t.getToLocationId())
                    .ifPresent(l -> r.setToLocationName(l.getName()));
        if (t.getAssignedToUserId() != null)
            userRepository.findById(t.getAssignedToUserId())
                    .ifPresent(u -> r.setAssignedToUserName(u.getFullName()));
        return r;
    }
}
