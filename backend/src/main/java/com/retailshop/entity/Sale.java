package com.retailshop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Sale entity representing a complete sales transaction.
 * Contains customer info, bill details, and line items.
 */
@Entity
@Table(name = "sales", indexes = {
    @Index(name = "idx_sale_date", columnList = "saleDate"),
    @Index(name = "idx_sale_bill", columnList = "billNumber")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String billNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    /** Customer name for quick access (denormalized) */
    @Column(length = 100)
    private String customerName;

    @Column(length = 20)
    private String customerPhone;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    /** Tax percentage (e.g., GST 18%) */
    @Column(precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxPercent = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    /** Discount amount */
    @Column(precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal grandTotal;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Column(nullable = false)
    private LocalDateTime saleDate;

    @Column(length = 500)
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (saleDate == null) {
            saleDate = LocalDateTime.now();
        }
    }

    /** Add a line item and set the back-reference */
    public void addItem(SaleItem item) {
        items.add(item);
        item.setSale(this);
    }

    public enum PaymentMethod {
        CASH, CARD, UPI, CREDIT
    }
}
