package com.retailshop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * CustomerOrder entity for orders placed by customers through the portal.
 * These orders are visible to the shop manager for processing.
 */
@Entity
@Table(name = "customer_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String orderNumber;

    @Column(nullable = false, length = 100)
    private String customerName;

    @Column(length = 20)
    private String customerPhone;

    @Column(length = 500)
    private String customerAddress;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean processedAsSale = false;

    @Column(nullable = false)
    private LocalDateTime orderDate;

    @PrePersist
    protected void onCreate() {
        if (orderDate == null) {
            orderDate = LocalDateTime.now();
        }
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public enum OrderStatus {
        PENDING, CONFIRMED, PROCESSING, COMPLETED, DELIVERED, CANCELLED
    }
}
