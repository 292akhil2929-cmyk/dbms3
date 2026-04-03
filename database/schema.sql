-- ShopSphere Database Schema
-- MySQL Database

-- Create Database
CREATE DATABASE IF NOT EXISTS shopsphere;
USE shopsphere;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    stock_quantity INT DEFAULT 0,
    category_id INT,
    image_url VARCHAR(500),
    rating DECIMAL(2, 1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Cart Table
CREATE TABLE IF NOT EXISTS cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Product Statistics View
CREATE OR REPLACE VIEW product_stats AS
SELECT 
    p.product_id,
    p.name,
    p.price,
    c.name AS category_name,
    COALESCE(AVG(r.rating), 0) AS avg_rating,
    COUNT(DISTINCT r.review_id) AS review_count,
    COALESCE(SUM(oi.quantity), 0) AS total_sold
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN reviews r ON p.product_id = r.product_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.name, p.price, c.name;

-- Trigger: Update product rating after review
DELIMITER //
CREATE TRIGGER update_product_rating AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET rating = (
        SELECT AVG(rating) FROM reviews WHERE product_id = NEW.product_id
    )
    WHERE product_id = NEW.product_id;
END//
DELIMITER ;

-- Trigger: Update stock after order
DELIMITER //
CREATE TRIGGER update_stock_after_order AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE product_id = NEW.product_id;
END//
DELIMITER ;

-- Stored Procedure: Get user orders
DELIMITER //
CREATE PROCEDURE GetUserOrders(IN p_user_id INT)
BEGIN
    SELECT 
        o.order_id,
        o.total_amount,
        o.status,
        o.created_at,
        GROUP_CONCAT(p.name SEPARATOR ', ') AS products
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE o.user_id = p_user_id
    GROUP BY o.order_id
    ORDER BY o.created_at DESC;
END//
DELIMITER ;

-- Stored Procedure: Calculate order total
DELIMITER //
CREATE PROCEDURE CalculateOrderTotal(IN p_order_id INT, OUT p_total DECIMAL(10,2))
BEGIN
    SELECT SUM(quantity * price) INTO p_total
    FROM order_items
    WHERE order_id = p_order_id;
END//
DELIMITER ;

-- Insert sample categories
INSERT INTO categories (name, description, icon) VALUES
('Electronics', 'Latest gadgets and devices', 'fa-laptop'),
('Clothing', 'Fashion for everyone', 'fa-tshirt'),
('Home & Garden', 'Make your home beautiful', 'fa-home'),
('Sports', 'Gear up for adventure', 'fa-futbol');

-- Insert sample products
INSERT INTO products (name, description, price, original_price, stock_quantity, category_id, image_url, rating) VALUES
('Wireless Headphones', 'Premium wireless headphones with noise cancellation', 99.99, 149.99, 50, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', 4.5),
('Smart Watch', 'Feature-packed smartwatch for your active lifestyle', 199.99, 249.99, 30, 1, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', 4.8),
('Running Shoes', 'Comfortable running shoes for all terrains', 79.99, 99.99, 100, 4, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', 4.3),
('Denim Jacket', 'Classic denim jacket for any occasion', 59.99, 89.99, 40, 2, 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300', 4.6),
('Coffee Maker', 'Brew perfect coffee every morning', 49.99, 69.99, 25, 3, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300', 4.4),
('Backpack', 'Durable backpack for work and travel', 39.99, 59.99, 60, 4, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', 4.7),
('Sunglasses', 'Stylish sunglasses with UV protection', 29.99, 49.99, 80, 2, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300', 4.2),
('Plant Pot Set', 'Beautiful ceramic plant pots for your garden', 24.99, 34.99, 45, 3, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300', 4.5);
