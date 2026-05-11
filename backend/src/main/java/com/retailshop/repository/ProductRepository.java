package com.retailshop.repository;

import com.retailshop.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /** Search by name (partial) or productCode (exact) */
    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.productCode) = LOWER(:keyword))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);

    /** Exact lookup by product ID (for numeric search) */
    Page<Product> findByIdAndActiveTrue(Long id, Pageable pageable);

    /** Find all active products */
    Page<Product> findByActiveTrue(Pageable pageable);

    /** Find products with stock below minimum level */
    @Query("SELECT p FROM Product p WHERE p.active = true AND p.quantity <= p.minStockLevel")
    List<Product> findLowStockProducts();

    /** Find out-of-stock products */
    @Query("SELECT p FROM Product p WHERE p.active = true AND p.quantity <= 0")
    List<Product> findOutOfStockProducts();

    /** Count active products */
    long countByActiveTrue();

    /** Total inventory value */
    @Query("SELECT COALESCE(SUM(p.quantity * p.pricePerUnit), 0) FROM Product p WHERE p.active = true")
    BigDecimal getTotalStockValue();

    /** Check if a productCode already exists among active products */
    boolean existsByProductCodeAndActiveTrue(String productCode);

    /** Check if a productCode exists on a different product (for update uniqueness) */
    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.productCode = :code AND p.active = true AND p.id <> :excludeId")
    boolean existsByProductCodeAndActiveTrueAndIdNot(@Param("code") String code, @Param("excludeId") Long excludeId);

    /** Find by category */
    Page<Product> findByCategoryAndActiveTrue(String category, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Product p SET p.quantity = p.quantity - :qty WHERE p.id = :id")
    int updateStockQuantity(@Param("id") Long id, @Param("qty") BigDecimal qty);

    /** Get distinct categories */
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.active = true AND p.category IS NOT NULL ORDER BY p.category")
    List<String> findDistinctCategories();
}
