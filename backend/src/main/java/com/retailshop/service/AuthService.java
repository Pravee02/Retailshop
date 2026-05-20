package com.retailshop.service;

import com.retailshop.dto.*;
import com.retailshop.entity.User;
import com.retailshop.exception.BadRequestException;
import com.retailshop.repository.UserRepository;
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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    /** Authenticate user and return JWT token */
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("User not found"));

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
