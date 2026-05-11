package com.retailshop.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Dashboard analytics data */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardResponse {
    private long totalProducts;
    private BigDecimal totalStockValue;
    private long todaySalesCount;
    private BigDecimal todayRevenue;
    private long weeklySalesCount;
    private BigDecimal weeklyRevenue;
    private long monthlySalesCount;
    private BigDecimal monthlyRevenue;
    private BigDecimal monthlyPurchaseCost;
    private BigDecimal estimatedProfit;
    private int lowStockCount;
    private int outOfStockCount;
    private List<Map<String, Object>> dailyRevenue;
    private List<Map<String, Object>> topProducts;
    private List<Map<String, Object>> categorySales;
}
