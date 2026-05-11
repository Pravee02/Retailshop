package com.retailshop.repository;

import com.retailshop.entity.Sale;
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

    Page<Sale> findAllByOrderBySaleDateDesc(Pageable pageable);

    /** Sales within a date range */
    @Query("SELECT s FROM Sale s WHERE s.saleDate BETWEEN :start AND :end ORDER BY s.saleDate DESC")
    List<Sale> findSalesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Total revenue within a date range */
    @Query("SELECT COALESCE(SUM(s.grandTotal), 0) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    BigDecimal getRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Count of sales within a date range */
    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    long countSalesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Daily revenue for the last N days (for charts) */
    @Query("SELECT CAST(s.saleDate AS date), SUM(s.grandTotal) FROM Sale s " +
           "WHERE s.saleDate >= :since GROUP BY CAST(s.saleDate AS date) ORDER BY CAST(s.saleDate AS date)")
    List<Object[]> getDailyRevenue(@Param("since") LocalDateTime since);

    /** Top selling products */
    @Query("SELECT si.productName, SUM(si.quantity) as totalQty, SUM(si.total) as totalRevenue " +
           "FROM SaleItem si WHERE si.sale.saleDate BETWEEN :start AND :end " +
           "GROUP BY si.productName ORDER BY totalRevenue DESC")
    List<Object[]> getTopSellingProducts(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
