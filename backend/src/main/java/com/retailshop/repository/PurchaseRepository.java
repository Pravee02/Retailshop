package com.retailshop.repository;

import com.retailshop.entity.Purchase;
import com.retailshop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    /** Owner-scoped purchase cost */
    @Query("SELECT COALESCE(SUM(p.totalCost), 0) FROM Purchase p WHERE p.owner = :owner AND p.purchaseDate BETWEEN :start AND :end")
    BigDecimal getTotalPurchaseCostByOwner(@Param("owner") User owner, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Legacy unscoped */
    @Query("SELECT COALESCE(SUM(p.totalCost), 0) FROM Purchase p WHERE p.purchaseDate BETWEEN :start AND :end")
    BigDecimal getTotalPurchaseCost(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
