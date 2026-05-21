package com.retailshop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Product entity representing items in the shop inventory.
 * Supports flexible unit types (KG, Gram, Liter, etc.) 
 * with automatic price calculation based on quantity.
 * 
 * MULTI-USER: Each product belongs to an owner (Admin user/shop).
 */
@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_name", columnList = "name"),
    @Index(name = "idx_product_category", columnList = "category"),
    @Index(name = "idx_product_code", columnList = "product_code"),
    @Index(name = "idx_product_owner", columnList = "owner_id"),
    @Index(name = "idx_product_shop", columnList = "shop_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owner admin — every product belongs to exactly one admin/shop */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User owner;

    /** Shop storefront — every product belongs to exactly one shop */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Shop shop;

    @Column(nullable = false, length = 200)
    private String name;

    /** Local language name for multi-language support */
    @Column(length = 200)
    private String localName;

    @Column(length = 100)
    private String category;

    /** Current stock quantity in base unit */
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    /** 
     * Unit type: KG, GRAM, LITER, ML, PACK, PIECE, CUSTOM 
     * Base unit for pricing (e.g., KG means pricePerUnit is per 1 KG)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnitType unitType;

    /** Custom unit name when unitType is CUSTOM */
    @Column(length = 50)
    private String customUnit;

    /** Price per base unit (e.g., price per 1 KG, per 1 Liter) */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerUnit;

    /** Manually assigned Product ID — unique per owner/shop (enforced in service) */
    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 1000)
    private String description;

    /** Minimum stock level — triggers low stock warning */
    @Column(precision = 12, scale = 3)
    private BigDecimal minStockLevel;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (minStockLevel == null) {
            minStockLevel = BigDecimal.TEN;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum UnitType {
        KG, GRAM, LITER, ML, PACK, PIECE, CUSTOM
    }
}
