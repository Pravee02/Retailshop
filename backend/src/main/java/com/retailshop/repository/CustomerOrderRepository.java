package com.retailshop.repository;

import com.retailshop.entity.CustomerOrder;
import com.retailshop.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    // === Owner-scoped queries ===
    @EntityGraph(attributePaths = {"items"})
    Page<CustomerOrder> findByOwnerOrderByOrderDateDesc(User owner, Pageable pageable);

    Page<CustomerOrder> findByOwnerAndStatusOrderByOrderDateDesc(User owner, CustomerOrder.OrderStatus status, Pageable pageable);

    // === Legacy unscoped queries (kept for backward compat) ===
    @EntityGraph(attributePaths = {"items"})
    Page<CustomerOrder> findAllByOrderByOrderDateDesc(Pageable pageable);

    Page<CustomerOrder> findByStatusOrderByOrderDateDesc(CustomerOrder.OrderStatus status, Pageable pageable);

    List<CustomerOrder> findByCustomerNameOrderByOrderDateDesc(String customerName);

    List<CustomerOrder> findByCustomerOrderByOrderDateDesc(User customer);

    /** Get orders by authenticated customer scoped to a specific shop */
    List<CustomerOrder> findByCustomerAndShopOrderByOrderDateDesc(User customer, com.retailshop.entity.Shop shop);



    @Query("SELECT o FROM CustomerOrder o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.id = :id")
    Optional<CustomerOrder> findByIdWithItems(@Param("id") Long id);
}
