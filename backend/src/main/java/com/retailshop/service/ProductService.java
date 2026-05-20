package com.retailshop.service;

import com.retailshop.dto.*;
import com.retailshop.entity.Product;
import com.retailshop.entity.User;
import com.retailshop.exception.*;
import com.retailshop.repository.ProductRepository;
import com.retailshop.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Product service handling CRUD and price calculations.
 * MULTI-USER: All read/write operations are scoped to the authenticated admin.
 */
@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SecurityUtils securityUtils;

    /**
     * Get all active products for the current admin.
     * Falls back to a public (owner-free) listing for the customer shop.
     */
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());

        // Try to get current user; if anonymous/not found use unscoped query (customer shop)
        User owner = tryGetCurrentUser();

        Page<Product> products;
        if (owner != null && owner.getRole() == User.Role.ADMIN) {
            // Admin: show ONLY their own products
            if (search != null && !search.trim().isEmpty()) {
                products = productRepository.searchProductsByOwner(search.trim(), owner, pageable);
            } else {
                products = productRepository.findByActiveTrueAndOwner(owner, pageable);
            }
        } else {
            // Customer / public: show all active products (global catalog)
            if (search != null && !search.trim().isEmpty()) {
                products = productRepository.searchProducts(search.trim(), pageable);
            } else {
                products = productRepository.findByActiveTrue(pageable);
            }
        }

        return products.map(this::toResponse);
    }

    /** Get product by ID (no owner filter — needed for sale item lookup) */
    @Transactional(readOnly = true)
    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        return toResponse(product);
    }

    /** Create a new product — scoped to current admin */
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        User owner = securityUtils.getCurrentUser();

        // Validate Product ID uniqueness per owner
        if (request.getProductCode() != null && !request.getProductCode().isBlank()
                && productRepository.existsByProductCodeAndActiveTrueAndOwner(request.getProductCode(), owner)) {
            throw new BadRequestException("Product ID '" + request.getProductCode() + "' already exists in your shop. Please use a unique Product ID.");
        }

        Product product = Product.builder()
                .owner(owner)
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

    /** Update an existing product — verifies ownership */
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        User owner = securityUtils.getCurrentUser();
        Product product = findProductByIdAndOwner(id, owner);

        // Validate Product ID uniqueness (exclude current product) per owner
        if (request.getProductCode() != null && !request.getProductCode().isBlank()
                && productRepository.existsByProductCodeAndActiveTrueAndOwnerAndIdNot(request.getProductCode(), owner, id)) {
            throw new BadRequestException("Product ID '" + request.getProductCode() + "' already exists in your shop. Please use a unique Product ID.");
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

    /** Soft delete a product — verifies ownership */
    @Transactional
    public void deleteProduct(Long id) {
        User owner = securityUtils.getCurrentUser();
        Product product = findProductByIdAndOwner(id, owner);
        product.setActive(false);
        productRepository.save(product);
    }

    /** Get low stock products — scoped to current admin */
    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStockProducts() {
        User owner = tryGetCurrentUser();
        if (owner != null && owner.getRole() == User.Role.ADMIN) {
            return productRepository.findLowStockProductsByOwner(owner).stream()
                    .map(this::toResponse).toList();
        }
        return productRepository.findLowStockProducts().stream()
                .map(this::toResponse).toList();
    }

    /** Get all distinct categories — scoped to current admin */
    @Transactional(readOnly = true)
    public List<String> getCategories() {
        User owner = tryGetCurrentUser();
        if (owner != null && owner.getRole() == User.Role.ADMIN) {
            return productRepository.findDistinctCategoriesByOwner(owner);
        }
        return productRepository.findDistinctCategories();
    }

    /** Calculate price for a product */
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

    /** Core price calculation logic with unit conversion */
    public BigDecimal computePrice(Product product, BigDecimal quantity, String requestedUnit) {
        BigDecimal pricePerBaseUnit = product.getPricePerUnit();
        String baseUnit = product.getUnitType().name();
        String reqUnit = requestedUnit != null ? requestedUnit.toUpperCase() : baseUnit;

        BigDecimal baseQuantity = convertToBaseUnit(quantity, reqUnit, baseUnit);
        return pricePerBaseUnit.multiply(baseQuantity).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal convertToBaseUnit(BigDecimal quantity, String fromUnit, String toUnit) {
        if (fromUnit.equals(toUnit)) return quantity;

        if (fromUnit.equals("GRAM") && toUnit.equals("KG")) return quantity.divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        if (fromUnit.equals("KG") && toUnit.equals("GRAM")) return quantity.multiply(BigDecimal.valueOf(1000));
        if (fromUnit.equals("ML") && toUnit.equals("LITER")) return quantity.divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        if (fromUnit.equals("LITER") && toUnit.equals("ML")) return quantity.multiply(BigDecimal.valueOf(1000));

        return quantity;
    }

    /** Convert stock quantity for deduction */
    public BigDecimal convertQuantityForDeduction(Product product, BigDecimal quantity, String unit) {
        String baseUnit = product.getUnitType().name();
        String reqUnit = unit != null ? unit.toUpperCase() : baseUnit;
        return convertToBaseUnit(quantity, reqUnit, baseUnit);
    }

    // --- Helpers ---

    /** Find product by ID — no owner filter (used for sale processing) */
    public Product findProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
    }

    /** Find product by ID and verify it belongs to the given owner */
    public Product findProductByIdAndOwner(Long id, User owner) {
        return productRepository.findByIdAndOwner(id, owner)
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
    }

    /** Try to get the current user without throwing — returns null if anonymous */
    private User tryGetCurrentUser() {
        try {
            return securityUtils.getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }

    public ProductResponse toResponse(Product p) {
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
