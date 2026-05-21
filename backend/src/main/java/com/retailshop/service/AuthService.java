package com.retailshop.service;

import com.retailshop.dto.*;
import com.retailshop.entity.User;
import com.retailshop.entity.Shop;
import com.retailshop.exception.BadRequestException;
import com.retailshop.repository.UserRepository;
import com.retailshop.repository.ShopRepository;
import com.retailshop.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Authentication service handling login and registration.
 * MULTI-USER: Supports both ADMIN and CUSTOMER self-registration.
 * Admins each get their own isolated data space (shop).
 */
@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    /** Authenticate user and return JWT token */
    public AuthResponse login(LoginRequest request) {
        return login(request, null);
    }

    /** Authenticate user and return JWT token with optional role constraint */
    public AuthResponse login(LoginRequest request, String requiredRole) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (requiredRole != null && !user.getRole().name().equalsIgnoreCase(requiredRole)) {
            throw new BadRequestException("Access denied. Invalid credentials for this login portal.");
        }

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    /**
     * Register a new user.
     * Role is determined by the 'role' field in the request:
     *   - "ADMIN" → creates a new shop admin with isolated data
     *   - anything else (or null) → creates a CUSTOMER account
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists. Please choose a different username.");
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            if (userRepository.existsByPhone(request.getPhone())) {
                throw new BadRequestException("Phone number already registered.");
            }
        }

        // Determine role — allow ADMIN registration explicitly
        User.Role role = User.Role.CUSTOMER;
        if ("ADMIN".equalsIgnoreCase(request.getRole())) {
            role = User.Role.ADMIN;
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName() != null ? request.getFullName() : request.getUsername())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(role)
                .active(true)
                .build();

        userRepository.save(user);

        // Auto-create shop for ADMIN user
        if (role == User.Role.ADMIN) {
            Shop shop = Shop.builder()
                    .owner(user)
                    .name(user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername() + " Store")
                    .phone(user.getPhone())
                    .active(true)
                    .build();
            shopRepository.save(shop);
        }

        String token = tokenProvider.generateToken(user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
