package com.retailshop.config;

import com.retailshop.entity.*;
import com.retailshop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

/**
 * Initializes the default admin user on startup.
 * 
 * MULTI-USER SYSTEM:
 * - Each admin registers their own account via /api/auth/register-admin
 * - The default admin (admin/admin123) is kept for backward compatibility
 * - New admins have completely isolated products, sales, and billing data
 * - Customers register via /api/auth/register
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private CustomerOrderRepository orderRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) {
        System.out.println("=== STARTING DATA DIAGNOSTICS ===");
        try {
            System.out.println("--- USERS ---");
            userRepository.findAll().forEach(u -> 
                System.out.println("User ID: " + u.getId() + ", Username: " + u.getUsername() + ", Role: " + u.getRole())
            );

            System.out.println("--- SHOPS ---");
            shopRepository.findAll().forEach(s -> 
                System.out.println("Shop ID: " + s.getId() + ", Name: " + s.getName() + ", Owner: " + (s.getOwner() != null ? s.getOwner().getUsername() + " (" + s.getOwner().getId() + ")" : "null"))
            );

            System.out.println("--- PRODUCTS ---");
            productRepository.findAll().forEach(p -> 
                System.out.println("Product ID: " + p.getId() + ", Name: " + p.getName() + ", Owner: " + (p.getOwner() != null ? p.getOwner().getId() : "null") + ", Shop: " + (p.getShop() != null ? p.getShop().getId() : "null"))
            );

            System.out.println("--- ORDERS ---");
            orderRepository.findAll().forEach(o -> {
                System.out.println("Order ID: " + o.getId() + ", Number: " + o.getOrderNumber() + ", Status: " + o.getStatus() + ", Owner: " + (o.getOwner() != null ? o.getOwner().getId() : "null") + ", Shop: " + (o.getShop() != null ? o.getShop().getId() : "null"));
                o.getItems().forEach(item -> 
                    System.out.println("  Item Product ID: " + (item.getProduct() != null ? item.getProduct().getId() : "null") + ", Name: " + item.getProductName() + ", Qty: " + item.getQuantity())
                );
            });

            System.out.println("--- SALES ---");
            saleRepository.findAll().forEach(s -> 
                System.out.println("Sale ID: " + s.getId() + ", Bill: " + s.getBillNumber() + ", Owner: " + (s.getOwner() != null ? s.getOwner().getId() : "null"))
            );
        } catch (Exception e) {
            System.out.println("Error in diagnostics: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println("=== END OF DATA DIAGNOSTICS ===");

        // Create default admin user if not exists (backward compatibility)
        User admin = null;
        if (!userRepository.existsByUsername("admin")) {
            admin = User.builder()
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
            System.out.println("   → New shops should register via the 'Create Shop Account' button on the login page.");
        } else {
            admin = userRepository.findByUsername("admin").orElse(null);
        }

        // Ensure default shop exists for the default admin user
        Shop defaultShop = null;
        if (admin != null) {
            if (!shopRepository.existsByOwner(admin)) {
                defaultShop = Shop.builder()
                        .owner(admin)
                        .name("Shop Manager Store")
                        .phone(admin.getPhone())
                        .active(true)
                        .build();
                shopRepository.save(defaultShop);
                System.out.println("✅ Default shop storefront created for admin");
            } else {
                defaultShop = shopRepository.findByOwner(admin).orElse(null);
            }
        }

        // Locate any orphan products (where owner is null, seeded by data.sql)
        // and link them to the default admin user and default shop
        if (admin != null && defaultShop != null) {
            List<Product> orphanProducts = productRepository.findAll().stream()
                    .filter(p -> p.getOwner() == null || p.getShop() == null)
                    .toList();
            if (!orphanProducts.isEmpty()) {
                for (Product p : orphanProducts) {
                    p.setOwner(admin);
                    p.setShop(defaultShop);
                }
                productRepository.saveAll(orphanProducts);
                System.out.println("✅ Associated " + orphanProducts.size() + " orphan seeded products to default admin's shop");
            }
        }

        // Migrate orphan Sales (no owner) to default admin
        if (admin != null) {
            List<com.retailshop.entity.Sale> orphanSales = saleRepository.findAll().stream()
                    .filter(s -> s.getOwner() == null)
                    .toList();
            if (!orphanSales.isEmpty()) {
                for (com.retailshop.entity.Sale s : orphanSales) {
                    s.setOwner(admin);
                }
                saleRepository.saveAll(orphanSales);
                System.out.println("✅ Migrated " + orphanSales.size() + " orphan sales to default admin");
            }
        }

        // Migrate orphan CustomerOrders (no owner or no shop) to default admin
        if (admin != null && defaultShop != null) {
            List<com.retailshop.entity.CustomerOrder> orphanOrders = orderRepository.findAll().stream()
                    .filter(o -> o.getOwner() == null || o.getShop() == null)
                    .toList();
            if (!orphanOrders.isEmpty()) {
                for (com.retailshop.entity.CustomerOrder o : orphanOrders) {
                    o.setOwner(admin);
                    o.setShop(defaultShop);
                }
                orderRepository.saveAll(orphanOrders);
                System.out.println("✅ Migrated " + orphanOrders.size() + " orphan orders to default admin's shop");
            }
        }

        // Migrate orphan Purchases (no owner) to default admin
        if (admin != null) {
            List<com.retailshop.entity.Purchase> orphanPurchases = purchaseRepository.findAll().stream()
                    .filter(p -> p.getOwner() == null)
                    .toList();
            if (!orphanPurchases.isEmpty()) {
                for (com.retailshop.entity.Purchase p : orphanPurchases) {
                    p.setOwner(admin);
                }
                purchaseRepository.saveAll(orphanPurchases);
                System.out.println("✅ Migrated " + orphanPurchases.size() + " orphan purchases to default admin");
            }
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

        System.out.println("✅ Multi-user RetailShop system ready.");
        System.out.println("   → Admin registers → gets isolated shop data");
        System.out.println("   → Login any time → all data persists permanently");
    }
}

