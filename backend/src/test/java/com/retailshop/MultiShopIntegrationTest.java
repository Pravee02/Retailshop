package com.retailshop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailshop.dto.OrderRequest;
import com.retailshop.dto.ProductRequest;
import com.retailshop.dto.RegisterRequest;
import com.retailshop.entity.Product;
import com.retailshop.entity.Shop;
import com.retailshop.entity.User;
import com.retailshop.repository.ProductRepository;
import com.retailshop.repository.ShopRepository;
import com.retailshop.repository.UserRepository;
import com.retailshop.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
@Transactional
public class MultiShopIntegrationTest {

    @Autowired
    private com.retailshop.service.OrderService orderService;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private com.retailshop.repository.CustomerOrderRepository customerOrderRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private User adminA;
    private User adminB;
    private Shop shopA;
    private Shop shopB;

    private static int counter = 0;

    @BeforeEach
    public void setup() {
        // Generate unique names to prevent clashes with existing/seeded users
        counter++;
        String suffix = "_" + counter + "_" + System.currentTimeMillis();
        
        // 1. Register Shop Owner Admin A
        RegisterRequest regA = new RegisterRequest();
        regA.setUsername("praveen_admin" + suffix);
        regA.setPassword("praveen123");
        regA.setFullName("Praveen Mart " + suffix);
        regA.setPhone("9876543" + String.format("%03d", counter % 1000));
        regA.setRole("ADMIN");
        authService.register(regA);

        adminA = userRepository.findByUsername("praveen_admin" + suffix).orElseThrow();
        shopA = shopRepository.findByOwner(adminA).orElseThrow();

        // 2. Register Shop Owner Admin B
        RegisterRequest regB = new RegisterRequest();
        regB.setUsername("prime_admin" + suffix);
        regB.setPassword("prime123");
        regB.setFullName("Prime Supermarket " + suffix);
        regB.setPhone("9876544" + String.format("%03d", counter % 1000));
        regB.setRole("ADMIN");
        authService.register(regB);

        adminB = userRepository.findByUsername("prime_admin" + suffix).orElseThrow();
        shopB = shopRepository.findByOwner(adminB).orElseThrow();
    }

    @Test
    public void testShopAutoCreationAndSearch() throws Exception {
        // Verify shop owners are registered and shops exist
        assertNotNull(shopA);
        assertTrue(shopA.getName().startsWith("Praveen Mart"));
        assertNotNull(shopB);
        assertTrue(shopB.getName().startsWith("Prime Supermarket"));

        // Test GET /api/shops - lists all active shops (including seeded default shops)
        mockMvc.perform(get("/api/shops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));

        // Test case-insensitive live suggestions matching "Pr" (both match "Praveen" and "Prime")
        mockMvc.perform(get("/api/shops/search").param("keyword", "Pr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));

        // Test case-insensitive live suggestions matching "praveen"
        mockMvc.perform(get("/api/shops/search").param("keyword", "praveen"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", containsString("Praveen Mart")));

        // Test search matching "supermarket"
        mockMvc.perform(get("/api/shops/search").param("keyword", "supermarket"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", containsString("Prime Supermarket")));
    }

    @Test
    public void testProductScopingAndIsolation() throws Exception {
        // Authenticate programmatically as Admin A (Praveen Mart)
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                adminA.getUsername(), null, 
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );

        // Create product under Praveen Mart (adminA)
        ProductRequest prodA = new ProductRequest();
        prodA.setName("Premium Basmati Rice");
        prodA.setCategory("Grains");
        prodA.setQuantity(new BigDecimal("100.0"));
        prodA.setUnitType("KG");
        prodA.setPricePerUnit(new BigDecimal("95.00"));
        prodA.setProductCode("RICE01");
        prodA.setDescription("High quality basmati rice");

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prodA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Premium Basmati Rice")));

        // Verify products is present in DB and has the correct shop assigned
        List<Product> products = productRepository.findAll();
        Product savedProduct = products.stream()
                .filter(p -> p.getName().equals("Premium Basmati Rice") && p.getOwner().getId().equals(adminA.getId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Product not found"));
        
        assertEquals(shopA.getId(), savedProduct.getShop().getId());
        assertEquals(adminA.getId(), savedProduct.getOwner().getId());

        // Clear security context to simulate an anonymous customer browsing
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        // Perform customer query with Praveen's shopId - should return the product
        mockMvc.perform(get("/api/products").param("shopId", shopA.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Premium Basmati Rice")));

        // Perform customer query with Prime's shopId - should return empty list (no products in Prime Mart)
        mockMvc.perform(get("/api/products").param("shopId", shopB.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    public void testOrderScopingAndValidation() throws Exception {
        // Authenticate programmatically as Admin A (Praveen Mart)
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                adminA.getUsername(), null, 
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );

        // First add product to shopA
        ProductRequest prodA = new ProductRequest();
        prodA.setName("Premium Basmati Rice");
        prodA.setCategory("Grains");
        prodA.setQuantity(new BigDecimal("100.0"));
        prodA.setUnitType("KG");
        prodA.setPricePerUnit(new BigDecimal("95.00"));
        prodA.setProductCode("RICE01");

        String responseStr = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prodA)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long productId = objectMapper.readTree(responseStr).get("id").asLong();

        // Clear security context to simulate an anonymous customer ordering
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        // Place order for shopA as anonymous customer
        OrderRequest orderReq = new OrderRequest();
        orderReq.setShopId(shopA.getId());
        orderReq.setCustomerName("Ram Kumar");
        orderReq.setCustomerPhone("9988776655");
        orderReq.setCustomerAddress("Bengaluru");
        
        OrderRequest.OrderItemRequest itemReq = new OrderRequest.OrderItemRequest();
        itemReq.setProductId(productId);
        itemReq.setQuantity(new BigDecimal("2.5"));
        itemReq.setUnit("KG");
        orderReq.setItems(Collections.singletonList(itemReq));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber", notNullValue()))
                .andExpect(jsonPath("$.customerName", is("Ram Kumar")))
                .andExpect(jsonPath("$.totalAmount", is(237.50)));

        // Authenticate back as Admin A (Praveen Mart)
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                adminA.getUsername(), null, 
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );

        // Retrieve orders as Admin A (Praveen Mart) - should see the order
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].customerName", is("Ram Kumar")));
    }

    @Test
    public void testOrderCompletion() throws Exception {
        // Authenticate programmatically as Admin A (Praveen Mart)
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                adminA.getUsername(), null, 
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );

        // First add product to shopA
        ProductRequest prodA = new ProductRequest();
        prodA.setName("Premium Basmati Rice");
        prodA.setCategory("Grains");
        prodA.setQuantity(new BigDecimal("100.0"));
        prodA.setUnitType("KG");
        prodA.setPricePerUnit(new BigDecimal("95.00"));
        prodA.setProductCode("RICE01");

        String responseStr = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prodA)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long productId = objectMapper.readTree(responseStr).get("id").asLong();

        // Clear security context to simulate an anonymous customer ordering
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        // Place order for shopA as anonymous customer
        OrderRequest orderReq = new OrderRequest();
        orderReq.setShopId(shopA.getId());
        orderReq.setCustomerName("Ram Kumar");
        orderReq.setCustomerPhone("9988776655");
        orderReq.setCustomerAddress("Bengaluru");
        
        OrderRequest.OrderItemRequest itemReq = new OrderRequest.OrderItemRequest();
        itemReq.setProductId(productId);
        itemReq.setQuantity(new BigDecimal("2.5"));
        itemReq.setUnit("KG");
        orderReq.setItems(Collections.singletonList(itemReq));

        String orderResponseStr = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        Long orderId = objectMapper.readTree(orderResponseStr).get("id").asLong();

        // Authenticate back as Admin A (Praveen Mart)
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                adminA.getUsername(), null, 
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );

        // Complete the order
        mockMvc.perform(put("/api/orders/" + orderId + "/status").param("status", "COMPLETED"))
                .andExpect(status().isOk());
    }

    @Test
    public void testDiagnoseDemoAdminCompletion() throws Exception {
        System.out.println("=== DIAGNOSING DEMO ADMIN ORDER COMPLETION VIA JDBC ===");
        try (java.sql.Connection conn = java.sql.DriverManager.getConnection("jdbc:h2:file:./data/retailshop;DB_CLOSE_DELAY=-1;AUTO_SERVER=TRUE;AUTO_RECONNECT=TRUE", "sa", "")) {
            try (java.sql.Statement stmt = conn.createStatement()) {
                System.out.println("--- PRODUCTS IN DEMO ADMIN ORDERS ---");
                try (java.sql.ResultSet rs = stmt.executeQuery("SELECT id, name, owner_id, shop_id, product_code FROM products WHERE id IN (1, 13)")) {
                    while (rs.next()) {
                        System.out.println(String.format("Product ID: %d, Name: %s, Owner ID: %d, Shop ID: %d, Code: %s",
                                rs.getLong("id"), rs.getString("name"), rs.getLong("owner_id"), rs.getLong("shop_id"), rs.getString("product_code")));
                    }
                }

                System.out.println("--- SHOP OF DEMO ADMIN ---");
                try (java.sql.ResultSet rs = stmt.executeQuery("SELECT id, name, owner_id FROM shops WHERE owner_id = 1")) {
                    while (rs.next()) {
                        System.out.println(String.format("Shop ID: %d, Name: %s, Owner ID: %d",
                                rs.getLong("id"), rs.getString("name"), rs.getLong("owner_id")));
                    }
                }

                System.out.println("--- DEMO ADMIN ORDERS ---");
                try (java.sql.ResultSet rs = stmt.executeQuery("SELECT id, order_number, status, owner_id, shop_id FROM customer_orders WHERE owner_id = 1")) {
                    while (rs.next()) {
                        System.out.println(String.format("Order ID: %d, Num: %s, Status: %s, Owner: %d, Shop: %d",
                                rs.getLong("id"), rs.getString("order_number"), rs.getString("status"), rs.getLong("owner_id"), rs.getLong("shop_id")));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testDemoAdminOrderCompletion() throws Exception {
        // 1. Authenticate programmatically as default admin (admin)
        User admin = userRepository.findByUsername("admin").orElseThrow();
        Shop shop = shopRepository.findByOwner(admin).orElseThrow();
        
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                admin.getUsername(), null, 
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );

        // 2. Add product to admin's shop
        ProductRequest prod = new ProductRequest();
        prod.setName("Demo Rice");
        prod.setCategory("Grains");
        prod.setQuantity(new BigDecimal("100.0"));
        prod.setUnitType("KG");
        prod.setPricePerUnit(new BigDecimal("90.00"));
        prod.setProductCode("DEMO_RICE");

        String responseStr = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prod)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long productId = objectMapper.readTree(responseStr).get("id").asLong();

        // 3. Clear security context to simulate an anonymous customer ordering
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        // 4. Place order for admin's shop
        OrderRequest orderReq = new OrderRequest();
        orderReq.setShopId(shop.getId());
        orderReq.setCustomerName("Ram Kumar");
        orderReq.setCustomerPhone("9988776655");
        orderReq.setCustomerAddress("Bengaluru");
        
        OrderRequest.OrderItemRequest itemReq = new OrderRequest.OrderItemRequest();
        itemReq.setProductId(productId);
        itemReq.setQuantity(new BigDecimal("2.0"));
        itemReq.setUnit("KG");
        orderReq.setItems(Collections.singletonList(itemReq));

        String orderResponseStr = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        Long orderId = objectMapper.readTree(orderResponseStr).get("id").asLong();

        // 5. Authenticate back as default admin (admin)
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                admin.getUsername(), null, 
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );

        // 6. Complete the order
        System.out.println("COMPLETING DEMO ADMIN ORDER: " + orderId);
        mockMvc.perform(put("/api/orders/" + orderId + "/status").param("status", "COMPLETED"))
                .andExpect(status().isOk());
        System.out.println("DEMO ADMIN ORDER COMPLETION SUCCESS IN TEST");
    }

}


