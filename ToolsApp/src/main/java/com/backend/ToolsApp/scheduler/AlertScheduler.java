package com.backend.ToolsApp.scheduler;

import com.backend.ToolsApp.entity.Alert;
import com.backend.ToolsApp.entity.Asset;
import com.backend.ToolsApp.entity.AssetTransfer;
import com.backend.ToolsApp.entity.MaintenanceRecord;
import com.backend.ToolsApp.enums.AlertType;
import com.backend.ToolsApp.enums.TransferStatus;
import com.backend.ToolsApp.repository.AlertRepository;
import com.backend.ToolsApp.repository.AssetRepository;
import com.backend.ToolsApp.repository.AssetTransferRepository;
import com.backend.ToolsApp.repository.MaintenanceRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static java.lang.String.format;

@Component
@RequiredArgsConstructor
@Slf4j
public class AlertScheduler {

    private final MaintenanceRecordRepository maintenanceRepository;
    private final AssetTransferRepository transferRepository;
    private final AssetRepository assetRepository;
    private final AlertRepository alertRepository;

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkUpcomingMaintenance() {
        LocalDate today = LocalDate.now();
        LocalDate in7Days = today.plusDays(7);

        List<MaintenanceRecord> upcoming = maintenanceRepository.findUpcomingMaintenance(today, in7Days);
        for (MaintenanceRecord record : upcoming) {
            String assetName = assetRepository.findById(record.getAssetId())
                    .map(Asset::getName).orElse("Unknown Asset");

            String message = String.format("Maintenance due for '%s' on %s (%s)",
                    assetName, record.getScheduledDate(), record.getType());

            Alert alert = new Alert();
            alert.setTenantId(record.getTenantId());
            alert.setAssetId(record.getAssetId());
            alert.setType(AlertType.MAINTENANCE_DUE);
            alert.setMessage(message);
            alertRepository.save(alert);
        }

        if (!upcoming.isEmpty()) {
            log.info("Created {} maintenance-due alerts", upcoming.size());
        }
    }

    private static final int[] WARNING_DAYS = {30, 14, 7, 1};

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkExpiringDates() {
        LocalDate today = LocalDate.now();
        List<Asset> assets = assetRepository.findAll();
        int created = 0;

        for (Asset asset : assets) {

            // ── Garanție ──────────────────────────────────────────────────────
            if (asset.getPurchaseDate() != null && asset.getWarrantyMonths() != null) {
                LocalDate warrantyExpiry = asset.getPurchaseDate().plusMonths(asset.getWarrantyMonths());
                for (int days : WARNING_DAYS) {
                    if (today.plusDays(days).equals(warrantyExpiry)) {
                        String msg = format("Garanția uneltei '%s' expiră pe %s (în %d %s)",
                                asset.getName(), warrantyExpiry, days, days == 1 ? "zi" : "zile");
                        if (!alertRepository.existsByAssetIdAndMessage(asset.getId(), msg)) {
                            alertRepository.save(buildAlert(asset, AlertType.WARRANTY_EXPIRING, msg));
                            created++;
                        }
                    }
                }
            }

            // ── Metrologie ────────────────────────────────────────────────────
            if (asset.getMetrologyExpiryDate() != null) {
                LocalDate metrologyExpiry = asset.getMetrologyExpiryDate();
                for (int days : WARNING_DAYS) {
                    if (today.plusDays(days).equals(metrologyExpiry)) {
                        String msg = format("Metrologia uneltei '%s' expiră pe %s (în %d %s)",
                                asset.getName(), metrologyExpiry, days, days == 1 ? "zi" : "zile");
                        if (!alertRepository.existsByAssetIdAndMessage(asset.getId(), msg)) {
                            alertRepository.save(buildAlert(asset, AlertType.METROLOGY_EXPIRING, msg));
                            created++;
                        }
                    }
                }
            }
        }

        if (created > 0) {
            log.info("Created {} warranty/metrology expiry alerts", created);
        }
    }

    private Alert buildAlert(Asset asset, AlertType type, String message) {
        Alert alert = new Alert();
        alert.setTenantId(asset.getTenantId());
        alert.setAssetId(asset.getId());
        alert.setType(type);
        alert.setMessage(message);
        return alert;
    }

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkOverdueTransfers() {
        List<AssetTransfer> all = transferRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (AssetTransfer transfer : all) {
            if (transfer.getStatus() == TransferStatus.ACTIVE
                    && transfer.getReturnDate() != null
                    && transfer.getReturnDate().isBefore(now)) {

                String assetName = assetRepository.findById(transfer.getAssetId())
                        .map(Asset::getName).orElse("Unknown Asset");

                String message = String.format("Overdue return for asset '%s' (due: %s)",
                        assetName, transfer.getReturnDate().toLocalDate());

                Alert alert = new Alert();
                alert.setTenantId(transfer.getTenantId());
                alert.setAssetId(transfer.getAssetId());
                alert.setType(AlertType.OVERDUE_RETURN);
                alert.setMessage(message);
                alertRepository.save(alert);
            }
        }
    }
}
