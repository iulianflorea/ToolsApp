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
