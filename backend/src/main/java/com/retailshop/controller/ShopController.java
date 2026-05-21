package com.retailshop.controller;

import com.retailshop.entity.Shop;
import com.retailshop.repository.ShopRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/shops")
@Tag(name = "Shops", description = "Shop storefront public endpoints")
public class ShopController {

    @Autowired
    private ShopRepository shopRepository;

    @GetMapping
    @Operation(summary = "Get all active shops")
    public ResponseEntity<List<Shop>> getAllShops() {
        return ResponseEntity.ok(shopRepository.findByActiveTrue());
    }

    @GetMapping("/search")
    @Operation(summary = "Search shops by name or owner (live suggestions)")
    public ResponseEntity<List<Shop>> searchShops(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.ok(shopRepository.findByActiveTrue());
        }
        return ResponseEntity.ok(shopRepository.searchShops(keyword.trim()));
    }
}
