package com.retailshop.service;

import com.retailshop.dto.*;
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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.List;

/**
 * Sales service handling billing operations.
 * Automatically deducts stock and logs inventory changes.
 */
@Service
public class SaleService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private InventoryLogRepository inventoryLogRepository;

    /** Create a new sale and generate bill */
    @Transactional
    public SaleResponse createSale(SaleRequest request) {
        Sale sale = processSaleInternal(request);
        return toResponse(sale);
    }

    /** Create a sale from an existing customer order */
    @Transactional
    public void createSaleFromOrder(CustomerOrder order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new BadRequestException("Cannot process order without items: " + order.getOrderNumber());
        }

        SaleRequest request = new SaleRequest();
        request.setCustomerName(order.getCustomerName());
        request.setCustomerPhone(order.getCustomerPhone());
        request.setNotes("Portal Order: " + order.getOrderNumber());
        request.setPaymentMethod("CASH");
        request.setTaxPercent(BigDecimal.ZERO);
        request.setDiscount(BigDecimal.ZERO);

        List<SaleRequest.SaleItemRequest> itemRequests = order.getItems().stream()
                .map(item -> {
                    SaleRequest.SaleItemRequest ir = new SaleRequest.SaleItemRequest();
                    ir.setProductId(item.getProduct().getId());
                    ir.setQuantity(item.getQuantity());
                    ir.setUnit(item.getUnit());
                    ir.setPricePerUnit(item.getPricePerUnit());
                    return ir;
                }).toList();

        request.setItems(itemRequests);
        processSaleInternal(request);
    }

    /** 
     * Core sale processing logic shared by direct sales and customer orders.
     * Handles bill generation, stock deduction, and inventory logging.
     */
    private Sale processSaleInternal(SaleRequest request) {
        // Generate bill number: BILL-YYYYMMDD-XXXX
        String billNumber = generateBillNumber();

        // Handle customer
        Customer customer = null;
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().isEmpty()) {
            customer = customerRepository.findByPhone(request.getCustomerPhone())
                    .orElseGet(() -> customerRepository.save(
                        Customer.builder()
                                .name(request.getCustomerName() != null ? request.getCustomerName() : "Walk-in")
                                .phone(request.getCustomerPhone())
                                .build()
                    ));
        }

        // Create sale
        Sale sale = Sale.builder()
                .billNumber(billNumber)
                .customer(customer)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .saleDate(LocalDateTime.now())
                .notes(request.getNotes())
                .build();

        if (request.getPaymentMethod() != null) {
            sale.setPaymentMethod(Sale.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
        }

        // Process items
        BigDecimal subtotal = BigDecimal.ZERO;
        AtomicInteger serialNum = new AtomicInteger(1);

        for (SaleRequest.SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));

            // Determine price (use override or calculate)
            BigDecimal pricePerUnit = itemReq.getPricePerUnit();
            if (pricePerUnit == null) {
                String unit = itemReq.getUnit() != null ? itemReq.getUnit() : product.getUnitType().name();
                pricePerUnit = productService.computePrice(product, BigDecimal.ONE, unit);
            }

            BigDecimal itemTotal = pricePerUnit.multiply(itemReq.getQuantity());

            SaleItem saleItem = SaleItem.builder()
                    .serialNumber(serialNum.getAndIncrement())
                    .product(product)
                    .productName(product.getName())
                    .quantity(itemReq.getQuantity())
                    .unit(itemReq.getUnit() != null ? itemReq.getUnit() : product.getUnitType().name())
                    .pricePerUnit(pricePerUnit)
                    .total(itemTotal)
                    .build();

            sale.addItem(saleItem);
            subtotal = subtotal.add(itemTotal);

            // Deduct stock (matching working Admin Billing flow)
            BigDecimal deductionQty = productService.convertQuantityForDeduction(
                    product, itemReq.getQuantity(), itemReq.getUnit());
            
            product.setQuantity(product.getQuantity().subtract(deductionQty));

            if (product.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Insufficient stock for product: " + product.getName());
            }

            productRepository.save(product);
            productRepository.flush(); // Force immediate update to DB

            // Log inventory change
            InventoryLog log = InventoryLog.builder()
                    .product(product)
                    .type(InventoryLog.LogType.SALE)
                    .quantityChanged(deductionQty.negate())
                    .stockAfter(product.getQuantity())
                    .referenceId(billNumber)
                    .notes("Sale: " + billNumber)
                    .build();
            inventoryLogRepository.save(log);
        }

        // Calculate totals
        sale.setSubtotal(subtotal);

        BigDecimal taxPercent = request.getTaxPercent() != null ? request.getTaxPercent() : BigDecimal.ZERO;
        BigDecimal taxAmount = subtotal.multiply(taxPercent).divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
        sale.setTaxPercent(taxPercent);
        sale.setTaxAmount(taxAmount);

        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        sale.setDiscount(discount);

        BigDecimal grandTotal = subtotal.add(taxAmount).subtract(discount);
        sale.setGrandTotal(grandTotal);

        return saleRepository.save(sale);
    }

    /** Get sale by ID */
    @Transactional(readOnly = true)
    public SaleResponse getSale(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with ID: " + id));
        return toResponse(sale);
    }

    /** Get sale by bill number */
    @Transactional(readOnly = true)
    public SaleResponse getSaleByBillNumber(String billNumber) {
        Sale sale = saleRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found: " + billNumber));
        return toResponse(sale);
    }

    /** Get all sales with pagination */
    @Transactional(readOnly = true)
    public Page<SaleResponse> getAllSales(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return saleRepository.findAllByOrderBySaleDateDesc(pageable)
                .map(this::toResponse);
    }

    /** Generate unique bill number */
    private String generateBillNumber() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = saleRepository.countSalesBetween(
                LocalDateTime.now().toLocalDate().atStartOfDay(),
                LocalDateTime.now().toLocalDate().atTime(23, 59, 59));
        return String.format("BILL-%s-%04d", dateStr, count + 1);
    }

    /** Convert Sale entity to response DTO */
    private SaleResponse toResponse(Sale sale) {
        List<SaleResponse.SaleItemResponse> items = sale.getItems().stream()
                .map(item -> SaleResponse.SaleItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .serialNumber(item.getSerialNumber())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unit(item.getUnit())
                        .pricePerUnit(item.getPricePerUnit())
                        .total(item.getTotal())
                        .build())
                .toList();

        return SaleResponse.builder()
                .id(sale.getId())
                .billNumber(sale.getBillNumber())
                .customerName(sale.getCustomerName())
                .customerPhone(sale.getCustomerPhone())
                .items(items)
                .subtotal(sale.getSubtotal())
                .taxPercent(sale.getTaxPercent())
                .taxAmount(sale.getTaxAmount())
                .discount(sale.getDiscount())
                .grandTotal(sale.getGrandTotal())
                .paymentMethod(sale.getPaymentMethod().name())
                .saleDate(sale.getSaleDate())
                .notes(sale.getNotes())
                .totalItems(items.size())
                .build();
    }
}
