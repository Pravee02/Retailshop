package com.retailshop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Purchase entity representing stock purchase/replenishment entries.
 */
@Entity
@Table(name = "purchases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 200)
    private String productName;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit;

    /** Purchase cost per unit */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costPerUnit;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalCost;

    @Column(length = 200)
    private String supplier;

    @Column(nullable = false)
    private LocalDateTime purchaseDate;

    @Column(length = 500)
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (purchaseDate == null) {
            purchaseDate = LocalDateTime.now();
        }
    }
}
