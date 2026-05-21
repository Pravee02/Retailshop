package com.retailshop.repository;

import com.retailshop.entity.Product;
import com.retailshop.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /** Search by name (partial) OR productCode (partial) — scoped to owner */
    @Query("SELECT p FROM Product p WHERE p.active = true AND p.owner = :owner AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchProductsByOwner(@Param("keyword") String keyword, @Param("owner") User owner, Pageable pageable);


    /** Exact lookup by product ID scoped to owner */
    Page<Product> findByIdAndActiveTrueAndOwner(Long id, User owner, Pageable pageable);

    /** Find all active products for a specific owner */
    Page<Product> findByActiveTrueAndOwner(User owner, Pageable pageable);

    /** Find products with stock below minimum level — scoped to owner */
    @Query("SELECT p FROM Product p WHERE p.active = true AND p.owner = :owner AND p.quantity <= p.minStockLevel")
    List<Product> findLowStockProductsByOwner(@Param("owner") User owner);

    /** Find out-of-stock products — scoped to owner */
    @Query("SELECT p FROM Product p WHERE p.active = true AND p.owner = :owner AND p.quantity <= 0.001")
    List<Product> findOutOfStockProductsByOwner(@Param("owner") User owner);

    /** Count active products for owner */
    long countByActiveTrueAndOwner(User owner);

    /** Total inventory value for owner */
    @Query("SELECT COALESCE(SUM(p.quantity * p.pricePerUnit), 0) FROM Product p WHERE p.active = true AND p.owner = :owner")
    BigDecimal getTotalStockValueByOwner(@Param("owner") User owner);

    /** Check if a productCode already exists for this owner */
    boolean existsByProductCodeAndActiveTrueAndOwner(String productCode, User owner);

    /** Check if a productCode exists on a different product for same owner (for update) */
    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.productCode = :code AND p.active = true AND p.owner = :owner AND p.id <> :excludeId")
    boolean existsByProductCodeAndActiveTrueAndOwnerAndIdNot(@Param("code") String code, @Param("owner") User owner, @Param("excludeId") Long excludeId);

    /** Find by category — scoped to owner */
    Page<Product> findByCategoryAndActiveTrueAndOwner(String category, User owner, Pageable pageable);

    /** Get distinct categories — scoped to owner */
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.active = true AND p.owner = :owner AND p.category IS NOT NULL ORDER BY p.category")
    List<String> findDistinctCategoriesByOwner(@Param("owner") User owner);

    /** Find product by ID — used for validation (no owner filter, needed for safety checks) */
    Optional<Product> findByIdAndOwner(Long id, User owner);

    // === Legacy (unscoped) queries kept for backward compatibility ===
    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);


    Page<Product> findByIdAndActiveTrue(Long id, Pageable pageable);
    Page<Product> findByActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.quantity <= p.minStockLevel")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.quantity <= 0.001")
    List<Product> findOutOfStockProducts();

    long countByActiveTrue();

    @Query("SELECT COALESCE(SUM(p.quantity * p.pricePerUnit), 0) FROM Product p WHERE p.active = true")
    BigDecimal getTotalStockValue();

    boolean existsByProductCodeAndActiveTrue(String productCode);

    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.productCode = :code AND p.active = true AND p.id <> :excludeId")
    boolean existsByProductCodeAndActiveTrueAndIdNot(@Param("code") String code, @Param("excludeId") Long excludeId);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.active = true AND p.category IS NOT NULL ORDER BY p.category")
    List<String> findDistinctCategories();

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Product p SET p.quantity = p.quantity - :qty WHERE p.id = :id")
    int updateStockQuantity(@Param("id") Long id, @Param("qty") BigDecimal qty);
}
