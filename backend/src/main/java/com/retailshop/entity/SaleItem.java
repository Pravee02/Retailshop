package com.retailshop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * SaleItem entity representing a single line item within a sale.
 */
@Entity
@Table(name = "sale_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Serial number within the bill */
    @Column(nullable = false)
    private Integer serialNumber;

    /** Product name snapshot at time of sale */
    @Column(nullable = false, length = 200)
    private String productName;

    /** Quantity sold */
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    /** Unit type at time of sale */
    @Column(nullable = false, length = 20)
    private String unit;

    /** Price per unit at time of sale */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerUnit;

    /** Total = quantity * pricePerUnit */
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;
}
