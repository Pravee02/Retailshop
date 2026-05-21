package com.retailshop.service;

import com.retailshop.dto.OrderRequest;
import com.retailshop.entity.*;
import com.retailshop.exception.*;
import com.retailshop.repository.*;
import com.retailshop.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service handling customer orders from the portal.
 * MULTI-USER: Admin views are scoped to their own shop.
 */
@Service
public class OrderService {

    @Autowired
    private CustomerOrderRepository orderRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private SaleService saleService;

    @Autowired
    private SecurityUtils securityUtils;

    /**
     * Place a customer order.
     * Tied to a specific admin shop and optional authenticated customer user.
     */
    @Transactional
    public CustomerOrder createOrder(OrderRequest request, String customerUsername) {
        String orderNumber = "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));

        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with ID: " + request.getShopId()));
        User owner = shop.getOwner();

        User customer = null;
        if (customerUsername != null) {
            customer = userRepository.findByUsername(customerUsername).orElse(null);
        }

        CustomerOrder order = CustomerOrder.builder()
                .orderNumber(orderNumber)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerAddress(request.getCustomerAddress())
                .notes(request.getNotes())
                .status(CustomerOrder.OrderStatus.PENDING)
                .shop(shop)
                .owner(owner)
                .customer(customer)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productService.findProductById(itemReq.getProductId());
            String unit = itemReq.getUnit() != null ? itemReq.getUnit() : product.getUnitType().name();
            BigDecimal price = productService.computePrice(product, itemReq.getQuantity(), unit);
            BigDecimal pricePerUnit = productService.computePrice(product, BigDecimal.ONE, unit);

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .quantity(itemReq.getQuantity())
                    .unit(unit)
                    .pricePerUnit(pricePerUnit)
                    .total(price)
                    .build();

            order.addItem(item);
            total = total.add(price);
        }

        order.setTotalAmount(total);
        return orderRepository.save(order);
    }

    /** Get all orders (for admin) — scoped to current admin */
    @Transactional(readOnly = true)
    public Page<CustomerOrder> getAllOrders(int page, int size) {
        try {
            User owner = securityUtils.getCurrentUser();
            return orderRepository.findByOwnerOrderByOrderDateDesc(owner, PageRequest.of(page, size));
        } catch (Exception e) {
            // Fallback to unscoped if no owner context (should not happen for authenticated admins)
            return orderRepository.findAllByOrderByOrderDateDesc(PageRequest.of(page, size));
        }
    }

    /** Update order status */
    @Transactional
    public CustomerOrder updateStatus(Long id, String status) {
        CustomerOrder order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));

        CustomerOrder.OrderStatus newStatus = CustomerOrder.OrderStatus.valueOf(status.toUpperCase());

        boolean isFinalStatus = newStatus == CustomerOrder.OrderStatus.COMPLETED ||
                               newStatus == CustomerOrder.OrderStatus.DELIVERED;

        if (isFinalStatus && !order.isProcessedAsSale()) {
            saleService.createSaleFromOrder(order);
            order.setProcessedAsSale(true);
        }

        order.setStatus(newStatus);
        return orderRepository.save(order);
    }

    /** Get my orders (for customer) — optionally scoped to a specific shop */
    @Transactional(readOnly = true)
    public java.util.List<CustomerOrder> getMyOrders(String username, Long shopId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (shopId != null) {
            // Shop-scoped: only orders this customer placed at the selected shop
            Shop shop = shopRepository.findById(shopId).orElse(null);
            if (shop != null && user != null) {
                return orderRepository.findByCustomerAndShopOrderByOrderDateDesc(user, shop);
            }
        }
        // Fallback: all orders for this customer
        java.util.List<CustomerOrder> orders = orderRepository.findByCustomerOrderByOrderDateDesc(user);
        if (orders.isEmpty()) {
            // Fallback to legacy customer name matching
            orders = orderRepository.findByCustomerNameOrderByOrderDateDesc(user.getFullName());
        }
        return orders;
    }


    /** Cancel my order (for customer) */
    @Transactional
    public CustomerOrder cancelMyOrder(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));

        boolean isAuthorized = false;
        if (order.getCustomer() != null) {
            isAuthorized = order.getCustomer().getId().equals(user.getId());
        } else {
            isAuthorized = order.getCustomerName().equals(user.getFullName());
        }

        if (!isAuthorized) {
            throw new BadRequestException("Not authorized to cancel this order");
        }

        if (order.getStatus() != CustomerOrder.OrderStatus.PENDING) {
            throw new BadRequestException("Only PENDING orders can be cancelled");
        }

        order.setStatus(CustomerOrder.OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }
}
