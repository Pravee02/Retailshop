package com.retailshop.controller;

import com.retailshop.dto.OrderRequest;
import com.retailshop.entity.CustomerOrder;
import com.retailshop.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Customer order controller.
 * POST is public (customers can place orders).
 * GET/PUT requires ADMIN role.
 */
@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "Customer order endpoints")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    @Operation(summary = "Place a customer order (public)")
    public ResponseEntity<CustomerOrder> createOrder(
            @Valid @RequestBody OrderRequest request,
            java.security.Principal principal) {
        String customerUsername = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(orderService.createOrder(request, customerUsername));
    }

    @GetMapping
    @Operation(summary = "Get all orders (Admin only)")
    public ResponseEntity<Page<CustomerOrder>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.getAllOrders(page, size));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update order status (Admin only)")
    public ResponseEntity<CustomerOrder> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get current customer's orders (optionally filtered by shopId)")
    public ResponseEntity<java.util.List<CustomerOrder>> getMyOrders(
            java.security.Principal principal,
            @RequestParam(required = false) Long shopId) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(orderService.getMyOrders(principal.getName(), shopId));
    }

    @PutMapping("/my-orders/{id}/cancel")
    @Operation(summary = "Cancel customer order")
    public ResponseEntity<CustomerOrder> cancelMyOrder(@PathVariable Long id, java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(orderService.cancelMyOrder(id, principal.getName()));
    }
}
