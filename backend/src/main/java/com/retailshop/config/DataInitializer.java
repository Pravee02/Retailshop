package com.retailshop.config;

import com.retailshop.entity.User;
import com.retailshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Initializes default admin user and sample data on startup.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create default admin user if not exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Shop Manager")
                    .email("admin@retailshop.com")
                    .phone("9876543210")
                    .role(User.Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Default admin user created (admin / admin123)");
        }

        // Create default customer user if not exists
        if (!userRepository.existsByUsername("customer")) {
            User customer = User.builder()
                    .username("customer")
                    .password(passwordEncoder.encode("customer123"))
                    .fullName("Demo Customer")
                    .email("customer@example.com")
                    .phone("9876543211")
                    .role(User.Role.CUSTOMER)
                    .active(true)
                    .build();
            userRepository.save(customer);
            System.out.println("✅ Default customer user created (customer / customer123)");
        }
    }
}
