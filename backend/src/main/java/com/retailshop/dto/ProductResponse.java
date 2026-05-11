package com.retailshop.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Product response DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String localName;
    private String category;
    private BigDecimal quantity;
    private String unitType;
    private String customUnit;
    private BigDecimal pricePerUnit;
    private String productCode;
    private String imageUrl;
    private String description;
    private BigDecimal minStockLevel;
    private Boolean active;
    private Boolean lowStock;
    private Boolean outOfStock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
