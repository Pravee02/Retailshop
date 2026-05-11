package com.retailshop.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/** Sale creation request */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SaleRequest {

    private String customerName;
    private String customerPhone;

    @NotNull(message = "Items are required")
    @Size(min = 1, message = "At least one item is required")
    private List<SaleItemRequest> items;

    private BigDecimal taxPercent;
    private BigDecimal discount;
    private String paymentMethod;
    private String notes;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SaleItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.001", message = "Quantity must be greater than 0")
        private BigDecimal quantity;

        private String unit;

        /** Optional: override price per unit */
        private BigDecimal pricePerUnit;
    }
}
