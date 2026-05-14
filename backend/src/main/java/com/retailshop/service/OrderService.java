package com.retailshop.service;

import com.retailshop.dto.OrderRequest;
import com.retailshop.entity.*;
import com.retailshop.exception.*;
import com.retailshop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service handling customer orders from the portal.
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
    private SaleService saleService;

    /** Place a customer order */
    @Transactional
    public CustomerOrder createOrder(OrderRequest request) {
        String orderNumber = "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));

        CustomerOrder order = CustomerOrder.builder()
                .orderNumber(orderNumber)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerAddress(request.getCustomerAddress())
                .notes(request.getNotes())
                .status(CustomerOrder.OrderStatus.PENDING)
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

    /** Get all orders (for admin) */
    @Transactional(readOnly = true)
    public Page<CustomerOrder> getAllOrders(int page, int size) {
        return orderRepository.findAllByOrderByOrderDateDesc(PageRequest.of(page, size));
    }

    /** Update order status */
    @Transactional
    public CustomerOrder updateStatus(Long id, String status) {
        CustomerOrder order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        
        CustomerOrder.OrderStatus newStatus = CustomerOrder.OrderStatus.valueOf(status.toUpperCase());
        
        // If order is being completed/delivered and hasn't been processed as a sale yet
        boolean isFinalStatus = newStatus == CustomerOrder.OrderStatus.COMPLETED || 
                               newStatus == CustomerOrder.OrderStatus.DELIVERED;
        
        if (isFinalStatus && !order.isProcessedAsSale()) {
            saleService.createSaleFromOrder(order);
            order.setProcessedAsSale(true);
        }
        
        order.setStatus(newStatus);
        return orderRepository.save(order);
    }

    /** Get my orders (for customer) */
    @Transactional(readOnly = true)
    public java.util.List<CustomerOrder> getMyOrders(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByCustomerNameOrderByOrderDateDesc(user.getFullName());
    }

    /** Cancel my order (for customer) */
    @Transactional
    public CustomerOrder cancelMyOrder(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        
        if (!order.getCustomerName().equals(user.getFullName())) {
            throw new BadRequestException("Not authorized to cancel this order");
        }
        
        if (order.getStatus() != CustomerOrder.OrderStatus.PENDING) {
            throw new BadRequestException("Only PENDING orders can be cancelled");
        }
        
        order.setStatus(CustomerOrder.OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }
}
