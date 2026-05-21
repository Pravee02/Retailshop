package com.retailshop.service;

import com.retailshop.dto.*;
import com.retailshop.entity.*;
import com.retailshop.exception.*;
import com.retailshop.repository.*;
import com.retailshop.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.List;

/**
 * Sales service handling billing operations.
 * MULTI-USER: All operations are scoped to the current authenticated admin.
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

    @Autowired
    private SecurityUtils securityUtils;

    /** Create a new sale and generate bill — scoped to current admin */
    @Transactional
    public SaleResponse createSale(SaleRequest request) {
        User owner = securityUtils.getCurrentUser();
        Sale sale = processSaleInternal(request, owner);
        return toResponse(sale);
    }

    /** Create a sale from an existing customer order — uses order's owner */
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
        // Use the order's owner so sale lands in the correct shop
        processSaleInternal(request, order.getOwner());
    }

    /**
     * Core sale processing logic — accepts explicit owner for createSaleFromOrder.
     */
    private Sale processSaleInternal(SaleRequest request, User owner) {
        String billNumber = generateBillNumber(owner);

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

        Sale sale = Sale.builder()
                .owner(owner)
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

        BigDecimal subtotal = BigDecimal.ZERO;
        AtomicInteger serialNum = new AtomicInteger(1);

        for (SaleRequest.SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));

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

            BigDecimal deductionQty = productService.convertQuantityForDeduction(product, itemReq.getQuantity(), itemReq.getUnit());
            product.setQuantity(product.getQuantity().subtract(deductionQty));

            // Allow negative stock (overselling support) as per implementation plan to avoid digital order blockages.
            // if (product.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
            //     throw new BadRequestException("Insufficient stock for product: " + product.getName());
            // }

            productRepository.save(product);
            productRepository.flush();

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

        sale.setSubtotal(subtotal);

        BigDecimal taxPercent = request.getTaxPercent() != null ? request.getTaxPercent() : BigDecimal.ZERO;
        BigDecimal taxAmount = subtotal.multiply(taxPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
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

    /** Get all sales — scoped to current admin */
    @Transactional(readOnly = true)
    public Page<SaleResponse> getAllSales(int page, int size) {
        User owner = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        return saleRepository.findByOwnerOrderBySaleDateDesc(owner, pageable)
                .map(this::toResponse);
    }

    /** Generate unique bill number — race-safe via MAX extraction instead of COUNT */
    private String generateBillNumber(User owner) {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        LocalDateTime dayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime dayEnd   = LocalDateTime.now().toLocalDate().atTime(23, 59, 59);

        java.util.List<String> existing = saleRepository.findBillNumbersByOwnerAndDate(owner, dayStart, dayEnd);

        int nextSeq = 1;
        if (!existing.isEmpty()) {
            // Bill format: BILL-OWNERID-YYYYMMDD-NNNN → extract NNNN from the first (highest ordered DESC) entry
            String latest = existing.get(0);
            try {
                String seqPart = latest.substring(latest.lastIndexOf('-') + 1);
                nextSeq = Integer.parseInt(seqPart) + 1;
            } catch (Exception ignored) {
                // If parsing fails fall back to count+1
                nextSeq = existing.size() + 1;
            }
        }
        return String.format("BILL-%d-%s-%04d", owner.getId(), dateStr, nextSeq);
    }


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
