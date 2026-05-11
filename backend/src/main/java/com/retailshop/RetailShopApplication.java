package com.retailshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Retail Shop Inventory Management System.
 * 
 * This application provides:
 * - Product management with flexible pricing
 * - Sales & billing with invoice generation
 * - Inventory dashboard with analytics
 * - Customer portal for browsing and ordering
 * - JWT-based authentication with role-based access
 */
@SpringBootApplication
public class RetailShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(RetailShopApplication.class, args);
    }
}
