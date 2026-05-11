package com.retailshop.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Sale response DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SaleResponse {
    private Long id;
    private String billNumber;
    private String customerName;
    private String customerPhone;
    private List<SaleItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private BigDecimal discount;
    private BigDecimal grandTotal;
    private String paymentMethod;
    private LocalDateTime saleDate;
    private String notes;
    private int totalItems;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SaleItemResponse {
        private Long id;
        private Long productId;
        private Integer serialNumber;
        private String productName;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal pricePerUnit;
        private BigDecimal total;
    }
}
