package com.retailshop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * InventoryLog entity for auditing stock movements.
 * Tracks every addition/deduction from inventory.
 */
@Entity
@Table(name = "inventory_logs", indexes = {
    @Index(name = "idx_invlog_product", columnList = "product_id"),
    @Index(name = "idx_invlog_date", columnList = "logDate")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LogType type;

    /** Quantity changed (positive for addition, value stored as-is) */
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityChanged;

    /** Stock level after this change */
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal stockAfter;

    /** Reference ID (sale ID, purchase ID, etc.) */
    @Column(length = 50)
    private String referenceId;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime logDate;

    @PrePersist
    protected void onCreate() {
        if (logDate == null) {
            logDate = LocalDateTime.now();
        }
    }

    public enum LogType {
        SALE, PURCHASE, ADJUSTMENT, RETURN
    }
}
