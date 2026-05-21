package com.retailshop.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/** Customer order request from the customer portal */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderRequest {

    @NotNull(message = "Shop ID is required")
    private Long shopId;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerPhone;
    private String customerAddress;

    @NotNull(message = "Items are required")
    @Size(min = 1, message = "At least one item is required")
    private List<OrderItemRequest> items;

    private String notes;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.001", message = "Quantity must be greater than 0")
        private BigDecimal quantity;

        private String unit;
    }
}
