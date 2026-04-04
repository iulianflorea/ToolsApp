package com.backend.ToolsApp.entity;

import com.backend.ToolsApp.enums.TransferStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_transfers")
@Data
@NoArgsConstructor
public class AssetTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "asset_id", nullable = false)
    private Long assetId;

    @Column(name = "from_location_id")
    private Long fromLocationId;

    @Column(name = "to_location_id")
    private Long toLocationId;

    @Column(name = "assigned_to_user_id")
    private Long assignedToUserId;

    @Column(name = "transfer_date")
    private LocalDateTime transferDate;

    @Column(name = "return_date")
    private LocalDateTime returnDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferStatus status = TransferStatus.ACTIVE;

    @PrePersist
    protected void onCreate() {
        if (transferDate == null) {
            transferDate = LocalDateTime.now();
        }
    }
}
