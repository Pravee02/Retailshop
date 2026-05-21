package com.retailshop.repository;

import com.retailshop.entity.Shop;
import com.retailshop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {
    
    Optional<Shop> findByOwner(User owner);
    
    Optional<Shop> findByOwnerId(Long ownerId);
    
    boolean existsByOwner(User owner);

    List<Shop> findByActiveTrue();

    /**
     * Search shops by name or owner full name with case-insensitivity and partial matching.
     * Supports live suggestions and short keywords (e.g. "pr").
     */
    @Query("SELECT s FROM Shop s WHERE s.active = true AND " +
           "(LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.owner.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Shop> searchShops(@Param("keyword") String keyword);
}
