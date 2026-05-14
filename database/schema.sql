-- =====================================================
-- Retail Shop Inventory Management System
-- Database Schema (MySQL compatible / H2 compatible)
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    local_name VARCHAR(200),
    category VARCHAR(100),
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    unit_type VARCHAR(20) NOT NULL,
    custom_unit VARCHAR(50),
    price_per_unit DECIMAL(12,2) NOT NULL,
    barcode VARCHAR(50),
    image_url VARCHAR(500),
    description VARCHAR(1000),
    min_stock_level DECIMAL(12,3) DEFAULT 10,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure product_code exists (renamed from barcode or added)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_product_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_product_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_product_code ON products(product_code);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(500),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    subtotal DECIMAL(14,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(14,2) DEFAULT 0,
    discount DECIMAL(14,2) DEFAULT 0,
    grand_total DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'CASH',
    sale_date TIMESTAMP NOT NULL,
    notes VARCHAR(500),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sale_bill ON sales(bill_number);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    serial_number INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price_per_unit DECIMAL(12,2) NOT NULL,
    total DECIMAL(14,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(12,2) NOT NULL,
    total_cost DECIMAL(14,2) NOT NULL,
    supplier VARCHAR(200),
    purchase_date TIMESTAMP NOT NULL,
    notes VARCHAR(500),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantity_changed DECIMAL(12,3) NOT NULL,
    stock_after DECIMAL(12,3) NOT NULL,
    reference_id VARCHAR(50),
    notes VARCHAR(500),
    log_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_invlog_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_invlog_date ON inventory_logs(log_date);

-- Customer orders table
CREATE TABLE IF NOT EXISTS customer_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_address VARCHAR(500),
    total_amount DECIMAL(14,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes VARCHAR(500),
    processed_as_sale BOOLEAN NOT NULL DEFAULT FALSE,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure processed_as_sale column exists for existing databases
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS processed_as_sale BOOLEAN NOT NULL DEFAULT FALSE;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price_per_unit DECIMAL(12,2) NOT NULL,
    total DECIMAL(14,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES customer_orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
