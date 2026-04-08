package com.backend.ToolsApp.entity;

import com.backend.ToolsApp.enums.AlertType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "asset_id")
    private Long assetId;

    @Enumerated(EnumType.STRING)
    private AlertType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "is_urgent", nullable = false)
    private boolean urgent = false;

    @Column(name = "alert_date")
    private String alertDate;

    @Column(name = "days_remaining")
    private Integer daysRemaining;

    @Column(name = "alert_extra")
    private String alertExtra;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
