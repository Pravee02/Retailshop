package com.retailshop.controller;

import com.retailshop.dto.*;
import com.retailshop.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller for login and registration.
 * Supports both Admin and Customer registration.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Login and registration endpoints")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login with username and password (Customer only)")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request, "CUSTOMER");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/login")
    @Operation(summary = "Login with username and password (Admin only)")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request, "ADMIN");
        return ResponseEntity.ok(response);
    }

    /** Register a CUSTOMER account */
    @PostMapping("/register")
    @Operation(summary = "Register a new customer account")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        // Force CUSTOMER role for /register (customer-facing)
        request.setRole("CUSTOMER");
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Register a new ADMIN / Shop account.
     * This creates an isolated shop space — all products/sales/orders will be 
     * scoped to this admin only.
     */
    @PostMapping("/register-admin")
    @Operation(summary = "Register a new admin/shop account")
    public ResponseEntity<AuthResponse> registerAdmin(@Valid @RequestBody RegisterRequest request) {
        request.setRole("ADMIN");
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }
}
