package com.retailshop.repository;

import com.retailshop.entity.Sale;
import com.retailshop.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByBillNumber(String billNumber);

    /** Find the highest bill number for this owner today — used for race-safe bill generation */
    @Query("SELECT s.billNumber FROM Sale s WHERE s.owner = :owner AND s.saleDate >= :dayStart AND s.saleDate <= :dayEnd ORDER BY s.billNumber DESC")
    java.util.List<String> findBillNumbersByOwnerAndDate(@Param("owner") User owner, @Param("dayStart") LocalDateTime dayStart, @Param("dayEnd") LocalDateTime dayEnd);



    // === Owner-scoped queries ===

    Page<Sale> findByOwnerOrderBySaleDateDesc(User owner, Pageable pageable);

    @Query("SELECT COALESCE(SUM(s.grandTotal), 0) FROM Sale s WHERE s.owner = :owner AND s.saleDate BETWEEN :start AND :end")
    BigDecimal getRevenueBetweenByOwner(@Param("owner") User owner, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.owner = :owner AND s.saleDate BETWEEN :start AND :end")
    long countSalesBetweenByOwner(@Param("owner") User owner, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT CAST(s.saleDate AS date), SUM(s.grandTotal) FROM Sale s " +
           "WHERE s.owner = :owner AND s.saleDate >= :since GROUP BY CAST(s.saleDate AS date) ORDER BY CAST(s.saleDate AS date)")
    List<Object[]> getDailyRevenueByOwner(@Param("owner") User owner, @Param("since") LocalDateTime since);

    @Query("SELECT si.productName, SUM(si.quantity) as totalQty, SUM(si.total) as totalRevenue " +
           "FROM SaleItem si WHERE si.sale.owner = :owner AND si.sale.saleDate BETWEEN :start AND :end " +
           "GROUP BY si.productName ORDER BY totalRevenue DESC")
    List<Object[]> getTopSellingProductsByOwner(@Param("owner") User owner, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // === Legacy unscoped queries ===

    Page<Sale> findAllByOrderBySaleDateDesc(Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE s.saleDate BETWEEN :start AND :end ORDER BY s.saleDate DESC")
    List<Sale> findSalesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(s.grandTotal), 0) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    BigDecimal getRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    long countSalesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT CAST(s.saleDate AS date), SUM(s.grandTotal) FROM Sale s " +
           "WHERE s.saleDate >= :since GROUP BY CAST(s.saleDate AS date) ORDER BY CAST(s.saleDate AS date)")
    List<Object[]> getDailyRevenue(@Param("since") LocalDateTime since);

    @Query("SELECT si.productName, SUM(si.quantity) as totalQty, SUM(si.total) as totalRevenue " +
           "FROM SaleItem si WHERE si.sale.saleDate BETWEEN :start AND :end " +
           "GROUP BY si.productName ORDER BY totalRevenue DESC")
    List<Object[]> getTopSellingProducts(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
