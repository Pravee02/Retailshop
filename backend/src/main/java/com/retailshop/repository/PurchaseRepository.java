package com.retailshop.repository;

import com.retailshop.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    @Query("SELECT COALESCE(SUM(p.totalCost), 0) FROM Purchase p WHERE p.purchaseDate BETWEEN :start AND :end")
    BigDecimal getTotalPurchaseCost(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
