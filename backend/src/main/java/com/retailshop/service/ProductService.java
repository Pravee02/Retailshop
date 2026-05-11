package com.retailshop.service;

import com.retailshop.dto.*;
import com.retailshop.entity.Product;
import com.retailshop.exception.*;
import com.retailshop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Product service handling CRUD and price calculations.
 * Implements flexible quantity-based pricing (KG→Gram, Liter→ML).
 */
@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    /** Get all active products with pagination and smart search */
    public Page<ProductResponse> getAllProducts(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Product> products;

        if (search != null && !search.trim().isEmpty()) {
            String keyword = search.trim();
            // Search by name (partial) or Product ID (exact)
            products = productRepository.searchProducts(keyword, pageable);
        } else {
            products = productRepository.findByActiveTrue(pageable);
        }

        return products.map(this::toResponse);
    }

    /** Get product by ID */
    public ProductResponse getProduct(Long id) {
        Product product = findProductById(id);
        return toResponse(product);
    }

    /** Create a new product */
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        // Validate Product ID uniqueness
        if (productRepository.existsByProductCodeAndActiveTrue(request.getProductCode())) {
            throw new BadRequestException("Product ID '" + request.getProductCode() + "' already exists. Please use a unique Product ID.");
        }

        Product product = Product.builder()
                .name(request.getName())
                .localName(request.getLocalName())
                .category(request.getCategory())
                .quantity(request.getQuantity())
                .unitType(Product.UnitType.valueOf(request.getUnitType().toUpperCase()))
                .customUnit(request.getCustomUnit())
                .pricePerUnit(request.getPricePerUnit())
                .productCode(request.getProductCode())
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .minStockLevel(request.getMinStockLevel() != null ? request.getMinStockLevel() : BigDecimal.TEN)
                .active(true)
                .build();

        product = productRepository.save(product);
        return toResponse(product);
    }

    /** Update an existing product */
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = findProductById(id);

        // Validate Product ID uniqueness (exclude current product)
        if (productRepository.existsByProductCodeAndActiveTrueAndIdNot(request.getProductCode(), id)) {
            throw new BadRequestException("Product ID '" + request.getProductCode() + "' already exists. Please use a unique Product ID.");
        }

        product.setName(request.getName());
        product.setLocalName(request.getLocalName());
        product.setCategory(request.getCategory());
        product.setQuantity(request.getQuantity());
        product.setUnitType(Product.UnitType.valueOf(request.getUnitType().toUpperCase()));
        product.setCustomUnit(request.getCustomUnit());
        product.setPricePerUnit(request.getPricePerUnit());
        product.setProductCode(request.getProductCode());
        product.setImageUrl(request.getImageUrl());
        product.setDescription(request.getDescription());
        if (request.getMinStockLevel() != null) {
            product.setMinStockLevel(request.getMinStockLevel());
        }

        product = productRepository.save(product);
        return toResponse(product);
    }

    /** Soft delete a product */
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findProductById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    /** Get low stock products */
    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::toResponse)
                .toList();
    }

    /** Get all distinct categories */
    public List<String> getCategories() {
        return productRepository.findDistinctCategories();
    }

    /**
     * Calculate price based on flexible quantity.
     * E.g., if base unit is KG and price is ₹400/KG:
     *   - 100 GRAM → ₹40
     *   - 500 GRAM → ₹200
     *   - 250 ML → calculated based on conversion
     */
    public PriceCalculation calculatePrice(Long productId, BigDecimal quantity, String unit) {
        Product product = findProductById(productId);
        BigDecimal calculatedPrice = computePrice(product, quantity, unit);

        return PriceCalculation.builder()
                .productId(product.getId())
                .productName(product.getName())
                .requestedQuantity(quantity)
                .requestedUnit(unit)
                .basePrice(product.getPricePerUnit())
                .baseUnit(product.getUnitType().name())
                .calculatedPrice(calculatedPrice)
                .build();
    }

    /**
     * Core price calculation logic with unit conversion.
     */
    public BigDecimal computePrice(Product product, BigDecimal quantity, String requestedUnit) {
        BigDecimal pricePerBaseUnit = product.getPricePerUnit();
        String baseUnit = product.getUnitType().name();
        String reqUnit = requestedUnit != null ? requestedUnit.toUpperCase() : baseUnit;

        // Convert requested quantity to base unit quantity
        BigDecimal baseQuantity = convertToBaseUnit(quantity, reqUnit, baseUnit);

        // Calculate price
        return pricePerBaseUnit.multiply(baseQuantity).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Convert quantity from requested unit to base unit.
     * Supports: KG↔GRAM, LITER↔ML
     */
    private BigDecimal convertToBaseUnit(BigDecimal quantity, String fromUnit, String toUnit) {
        if (fromUnit.equals(toUnit)) {
            return quantity;
        }

        // KG and GRAM conversions
        if (fromUnit.equals("GRAM") && toUnit.equals("KG")) {
            return quantity.divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        }
        if (fromUnit.equals("KG") && toUnit.equals("GRAM")) {
            return quantity.multiply(BigDecimal.valueOf(1000));
        }

        // LITER and ML conversions
        if (fromUnit.equals("ML") && toUnit.equals("LITER")) {
            return quantity.divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        }
        if (fromUnit.equals("LITER") && toUnit.equals("ML")) {
            return quantity.multiply(BigDecimal.valueOf(1000));
        }

        // If units don't have a known conversion, treat as same unit
        return quantity;
    }

    /** Convert stock quantity for deduction */
    public BigDecimal convertQuantityForDeduction(Product product, BigDecimal quantity, String unit) {
        String baseUnit = product.getUnitType().name();
        String reqUnit = unit != null ? unit.toUpperCase() : baseUnit;
        return convertToBaseUnit(quantity, reqUnit, baseUnit);
    }

    // --- Helpers ---

    Product findProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
    }

    private ProductResponse toResponse(Product p) {
        boolean isLowStock = p.getMinStockLevel() != null && p.getQuantity().compareTo(p.getMinStockLevel()) <= 0;
        boolean isOutOfStock = p.getQuantity().compareTo(BigDecimal.ZERO) <= 0;

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .localName(p.getLocalName())
                .category(p.getCategory())
                .quantity(p.getQuantity())
                .unitType(p.getUnitType().name())
                .customUnit(p.getCustomUnit())
                .pricePerUnit(p.getPricePerUnit())
                .productCode(p.getProductCode())
                .imageUrl(p.getImageUrl())
                .description(p.getDescription())
                .minStockLevel(p.getMinStockLevel())
                .active(p.getActive())
                .lowStock(isLowStock)
                .outOfStock(isOutOfStock)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
