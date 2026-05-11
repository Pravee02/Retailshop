package com.retailshop.service;

import com.retailshop.dto.DashboardResponse;
import com.retailshop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Dashboard service providing analytics and reporting data.
 */
@Service
public class DashboardService {

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ProductService productService;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    /** Get complete dashboard analytics */
    public DashboardResponse getDashboardData() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(23, 59, 59);
        LocalDateTime weekStart = LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        // Product stats
        long totalProducts = productRepository.countByActiveTrue();
        BigDecimal totalStockValue = productRepository.getTotalStockValue();
        int lowStockCount = productRepository.findLowStockProducts().size();
        int outOfStockCount = productRepository.findOutOfStockProducts().size();

        // Today's sales
        long todaySalesCount = saleRepository.countSalesBetween(todayStart, todayEnd);
        BigDecimal todayRevenue = saleRepository.getRevenueBetween(todayStart, todayEnd);

        // Weekly sales
        long weeklySalesCount = saleRepository.countSalesBetween(weekStart, now);
        BigDecimal weeklyRevenue = saleRepository.getRevenueBetween(weekStart, now);

        // Monthly sales
        long monthlySalesCount = saleRepository.countSalesBetween(monthStart, now);
        BigDecimal monthlyRevenue = saleRepository.getRevenueBetween(monthStart, now);

        // Monthly purchase cost
        BigDecimal monthlyPurchaseCost = purchaseRepository.getTotalPurchaseCost(monthStart, now);

        // Estimated profit
        BigDecimal estimatedProfit = monthlyRevenue.subtract(monthlyPurchaseCost);

        // Daily revenue chart data (last 30 days)
        List<Object[]> dailyData = saleRepository.getDailyRevenue(LocalDate.now().minusDays(30).atStartOfDay());
        List<Map<String, Object>> dailyRevenue = new ArrayList<>();
        for (Object[] row : dailyData) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", row[0].toString());
            point.put("revenue", row[1]);
            dailyRevenue.add(point);
        }

        // Top selling products (this month)
        List<Object[]> topData = saleRepository.getTopSellingProducts(monthStart, now);
        List<Map<String, Object>> topProducts = new ArrayList<>();
        int limit = Math.min(topData.size(), 10);
        for (int i = 0; i < limit; i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", topData.get(i)[0]);
            item.put("quantity", topData.get(i)[1]);
            item.put("revenue", topData.get(i)[2]);
            topProducts.add(item);
        }

        // Stock Alerts Logic
        List<Product> lowStockEntities = productRepository.findLowStockProducts();
        List<Product> outOfStockEntities = productRepository.findOutOfStockProducts();

        long lowStockCount = lowStockEntities.size();
        long outOfStockCount = outOfStockEntities.size();

        // Convert to DTOs for the modals
        List<com.retailshop.dto.ProductResponse> lowStockProducts = lowStockEntities.stream()
                .map(productService::toResponse)
                .collect(java.util.stream.Collectors.toList());
        
        List<com.retailshop.dto.ProductResponse> outOfStockProducts = outOfStockEntities.stream()
                .map(productService::toResponse)
                .collect(java.util.stream.Collectors.toList());

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
                .lowStockCount((int) lowStockCount)
                .outOfStockCount((int) outOfStockCount)
                .dailyRevenue(dailyRevenue)
                .topProducts(topProducts)
                .lowStockProducts(lowStockProducts)
                .outOfStockProducts(outOfStockProducts)
                .build();
    }
}
