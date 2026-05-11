package com.retailshop.dto;

import lombok.*;
import java.math.BigDecimal;

/** Price calculation response for flexible quantity pricing */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PriceCalculation {
    private Long productId;
    private String productName;
    private BigDecimal requestedQuantity;
    private String requestedUnit;
    private BigDecimal basePrice;
    private String baseUnit;
    private BigDecimal calculatedPrice;
}
