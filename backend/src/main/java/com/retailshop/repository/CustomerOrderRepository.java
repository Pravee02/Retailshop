package com.retailshop.repository;

import com.retailshop.entity.CustomerOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    Page<CustomerOrder> findAllByOrderByOrderDateDesc(Pageable pageable);
    Page<CustomerOrder> findByStatusOrderByOrderDateDesc(CustomerOrder.OrderStatus status, Pageable pageable);
    java.util.List<CustomerOrder> findByCustomerNameOrderByOrderDateDesc(String customerName);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM CustomerOrder o LEFT JOIN FETCH o.items WHERE o.id = :id")
    java.util.Optional<CustomerOrder> findByIdWithItems(@org.springframework.data.repository.query.Param("id") Long id);
}
