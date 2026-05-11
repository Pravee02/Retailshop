package com.retailshop.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

/** Product creation/update request */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {

    private Long id;

    @NotBlank(message = "Product name is required")
    private String name;

    private String localName;

    private String category;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0", message = "Quantity cannot be negative")
    private BigDecimal quantity;

    @NotBlank(message = "Unit type is required")
    private String unitType;

    private String customUnit;

    @NotNull(message = "Price per unit is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal pricePerUnit;

    @NotBlank(message = "Product ID is required")
    private String productCode;
    private String imageUrl;
    private String description;
    private BigDecimal minStockLevel;
}
