-- =====================================================
-- Sample Data for Retail Shop
-- =====================================================

-- Sample Products (inserted via JPA, but also available here for MySQL direct import)
-- Note: Users are created by DataInitializer.java

-- Merge sample products (idempotent)
MERGE INTO products (name, local_name, category, quantity, unit_type, price_per_unit, product_code, description, min_stock_level, active, created_at, updated_at) KEY (product_code) VALUES
('Basmati Rice', 'ಬಾಸ್ಮತಿ ಅಕ್ಕಿ', 'Grains', 500.000, 'KG', 85.00, 'BR001', 'Premium Basmati Rice - Long grain', 50.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Toor Dal', 'ತೊಗರಿ ಬೇಳೆ', 'Pulses', 200.000, 'KG', 140.00, 'TD001', 'Yellow Toor Dal', 30.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sunflower Oil', 'ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ', 'Oils', 100.000, 'LITER', 160.00, 'SO001', 'Refined Sunflower Oil', 20.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sugar', 'ಸಕ್ಕರೆ', 'Essentials', 300.000, 'KG', 45.00, 'SG001', 'White Sugar', 40.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Milk', 'ಹಾಲು', 'Dairy', 50.000, 'LITER', 55.00, 'MK001', 'Full Cream Milk', 10.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Wheat Flour (Atta)', 'ಗೋಧಿ ಹಿಟ್ಟು', 'Grains', 400.000, 'KG', 42.00, 'WF001', 'Whole Wheat Flour', 50.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Salt', 'ಉಪ್ಪು', 'Essentials', 150.000, 'KG', 22.00, 'SL001', 'Iodized Salt', 20.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tea Powder', 'ಚಹಾ ಪುಡಿ', 'Beverages', 80.000, 'KG', 320.00, 'TP001', 'Premium CTC Tea', 10.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Red Chilli Powder', 'ಕೆಂಪು ಮೆಣಸಿನ ಪುಡಿ', 'Spices', 50.000, 'KG', 280.00, 'RC001', 'Kashmiri Red Chilli Powder', 8.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Turmeric Powder', 'ಅರಿಶಿನ ಪುಡಿ', 'Spices', 40.000, 'KG', 200.00, 'TM001', 'Pure Turmeric Powder', 5.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Coconut Oil', 'ಕೊಬ್ಬರಿ ಎಣ್ಣೆ', 'Oils', 60.000, 'LITER', 220.00, 'CO001', 'Cold pressed coconut oil', 10.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Soap (Lux)', 'ಸಾಬೂನು', 'Personal Care', 200.000, 'PIECE', 35.00, 'SP001', 'Lux Beauty Soap', 30.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Biscuit (Parle-G)', 'ಬಿಸ್ಕೆಟ್', 'Snacks', 300.000, 'PACK', 10.00, 'BG001', 'Parle-G Glucose Biscuit', 50.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Detergent (Surf)', 'ಡಿಟರ್ಜೆಂಟ್', 'Household', 100.000, 'KG', 95.00, 'DT001', 'Surf Excel Detergent Powder', 15.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Coriander Powder', 'ಕೊತ್ತಂಬರಿ ಪುಡಿ', 'Spices', 35.000, 'KG', 180.00, 'CP001', 'Fresh Ground Coriander', 5.000, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
