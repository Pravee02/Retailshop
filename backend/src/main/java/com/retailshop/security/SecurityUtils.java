package com.retailshop.security;

import com.retailshop.entity.User;
import com.retailshop.exception.ResourceNotFoundException;
import com.retailshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility to retrieve the currently authenticated User entity.
 * Used for multi-user data isolation — every service call that touches
 * user-owned data must call getCurrentUser() to scope queries correctly.
 */
@Component
public class SecurityUtils {

    @Autowired
    private UserRepository userRepository;

    /**
     * Returns the full User entity for the currently authenticated principal.
     * Throws if no authentication is present (should not happen inside a secured endpoint).
     */
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ResourceNotFoundException("No authenticated user found");
        }
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    /**
     * Returns the username of the current principal, or null if anonymous.
     */
    public String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }
}
