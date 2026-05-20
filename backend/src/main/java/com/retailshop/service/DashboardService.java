package com.retailshop.service;

import com.retailshop.dto.DashboardResponse;
import com.retailshop.dto.ProductResponse;
import com.retailshop.entity.Product;
import com.retailshop.entity.User;
import com.retailshop.repository.*;
import com.retailshop.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Dashboard service providing analytics and reporting data.
 * MULTI-USER: All metrics are scoped to the current authenticated admin.
 */
@Service
public class DashboardService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DashboardService.class);

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private SecurityUtils securityUtils;

    /** Get complete dashboard analytics for the current admin */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardResponse getDashboardData() {
        try {
            User owner = securityUtils.getCurrentUser();

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            LocalDateTime todayEnd = LocalDate.now().atTime(23, 59, 59);
            LocalDateTime weekStart = LocalDate.now().minusDays(7).atStartOfDay();
            LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();

            // Product stats — scoped to owner
            long totalProducts = productRepository.countByActiveTrueAndOwner(owner);
            BigDecimal totalStockValue = safe(productRepository.getTotalStockValueByOwner(owner));

            // Today's sales — scoped to owner
            long todaySalesCount = saleRepository.countSalesBetweenByOwner(owner, todayStart, todayEnd);
            BigDecimal todayRevenue = safe(saleRepository.getRevenueBetweenByOwner(owner, todayStart, todayEnd));

            // Weekly sales
            long weeklySalesCount = saleRepository.countSalesBetweenByOwner(owner, weekStart, now);
            BigDecimal weeklyRevenue = safe(saleRepository.getRevenueBetweenByOwner(owner, weekStart, now));

            // Monthly sales
            long monthlySalesCount = saleRepository.countSalesBetweenByOwner(owner, monthStart, now);
            BigDecimal monthlyRevenue = safe(saleRepository.getRevenueBetweenByOwner(owner, monthStart, now));

            // Monthly purchase cost
            BigDecimal monthlyPurchaseCost = safe(purchaseRepository.getTotalPurchaseCostByOwner(owner, monthStart, now));

            // Estimated profit
            BigDecimal estimatedProfit = monthlyRevenue.subtract(monthlyPurchaseCost);

            // Daily revenue chart data (last 30 days) — scoped to owner
            List<Object[]> dailyData = saleRepository.getDailyRevenueByOwner(owner, LocalDate.now().minusDays(30).atStartOfDay());
            List<Map<String, Object>> dailyRevenue = new ArrayList<>();
            for (Object[] row : dailyData) {
                Map<String, Object> point = new HashMap<>();
                point.put("date", row[0].toString());
                point.put("revenue", row[1]);
                dailyRevenue.add(point);
            }

            // Top selling products — scoped to owner
            List<Object[]> topData = saleRepository.getTopSellingProductsByOwner(owner, monthStart, now);
            List<Map<String, Object>> topProducts = new ArrayList<>();
            int limit = Math.min(topData.size(), 10);
            for (int i = 0; i < limit; i++) {
                Map<String, Object> item = new HashMap<>();
                item.put("name", topData.get(i)[0]);
                item.put("quantity", topData.get(i)[1]);
                item.put("revenue", topData.get(i)[2]);
                topProducts.add(item);
            }

            // Stock alerts — scoped to owner
            List<Product> lowStockEntities = productRepository.findLowStockProductsByOwner(owner);
            List<Product> outOfStockEntities = productRepository.findOutOfStockProductsByOwner(owner);

            int lowStockCount = lowStockEntities.size();
            int outOfStockCount = outOfStockEntities.size();

            List<ProductResponse> lowStockProducts = lowStockEntities.stream()
                    .limit(50)
                    .map(productService::toResponse)
                    .toList();

            List<ProductResponse> outOfStockProducts = outOfStockEntities.stream()
                    .limit(50)
                    .map(productService::toResponse)
                    .toList();

            return DashboardResponse.builder()
                    .totalProducts(totalProducts)
                    .totalStockValue(totalStockValue)
                    .todaySalesCount(todaySalesCount)
                    .todayRevenue(todayRevenue)
                    .weeklySalesCount(weeklySalesCount)
                    .weeklyRevenue(weeklyRevenue)
                    .monthlySalesCount(monthlySalesCount)
                    .monthlyRevenue(monthlyRevenue)
                    .monthlyPurchaseCost(monthlyPurchaseCost)
                    .estimatedProfit(estimatedProfit)
                    .lowStockCount(lowStockCount)
                    .outOfStockCount(outOfStockCount)
                    .dailyRevenue(dailyRevenue)
                    .topProducts(topProducts)
                    .lowStockProducts(lowStockProducts)
                    .outOfStockProducts(outOfStockProducts)
                    .categorySales(new ArrayList<>())
                    .build();
        } catch (Exception e) {
            log.error("Error calculating dashboard metrics", e);
            throw e;
        }
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
