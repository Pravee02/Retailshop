package com.retailshop.controller;

import com.retailshop.dto.*;
import com.retailshop.service.SaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Sales & billing controller (Admin only).
 */
@RestController
@RequestMapping("/api/sales")
@Tag(name = "Sales", description = "Sales and billing endpoints")
public class SaleController {

    @Autowired
    private SaleService saleService;

    @PostMapping
    @Operation(summary = "Create a new sale / generate bill")
    public ResponseEntity<SaleResponse> createSale(@Valid @RequestBody SaleRequest request) {
        return ResponseEntity.ok(saleService.createSale(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sale by ID")
    public ResponseEntity<SaleResponse> getSale(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getSale(id));
    }

    @GetMapping("/bill/{billNumber}")
    @Operation(summary = "Get sale by bill number")
    public ResponseEntity<SaleResponse> getSaleByBillNumber(@PathVariable String billNumber) {
        return ResponseEntity.ok(saleService.getSaleByBillNumber(billNumber));
    }

    @GetMapping
    @Operation(summary = "Get all sales with pagination")
    public ResponseEntity<Page<SaleResponse>> getAllSales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(saleService.getAllSales(page, size));
    }
}
