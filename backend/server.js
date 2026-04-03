// server.js — ShopSphere Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Check if database is configured
const dbConfigured = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;

if (dbConfigured) {
    // ── API Routes (with database) ─────────────────────────────
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/products', require('./routes/products'));
    app.use('/api/cart', require('./routes/cart'));
    app.use('/api/orders', require('./routes/orders'));
    app.use('/api/reviews', require('./routes/reviews'));
    app.use('/api/users', require('./routes/users'));

    // ── Categories ─────────────────────────────────────────────
    const db = require('./db/connection');
    app.get('/api/categories', async (req, res) => {
        try {
            const [rows] = await db.query(
                'SELECT category_id, name, description, icon FROM categories ORDER BY name'
            );
            res.json({ categories: rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
} else {
    // ── Demo Mode (no database) ────────────────────────────────
    console.log('Running in DEMO MODE - no database configured');
    
    const demoCategories = [
        { category_id: 1, name: 'Electronics', icon: 'fa-laptop', description: 'Latest gadgets and devices' },
        { category_id: 2, name: 'Clothing', icon: 'fa-tshirt', description: 'Fashion for everyone' },
        { category_id: 3, name: 'Home & Garden', icon: 'fa-home', description: 'Make your home beautiful' },
        { category_id: 4, name: 'Sports', icon: 'fa-futbol', description: 'Gear up for adventure' }
    ];

    const demoProducts = [
        { product_id: 1, name: 'Wireless Headphones', category_name: 'Electronics', price: 99.99, original_price: 149.99, rating: 4.5, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', description: 'Premium wireless headphones with noise cancellation' },
        { product_id: 2, name: 'Smart Watch', category_name: 'Electronics', price: 199.99, original_price: 249.99, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', description: 'Feature-packed smartwatch for your active lifestyle' },
        { product_id: 3, name: 'Running Shoes', category_name: 'Sports', price: 79.99, original_price: 99.99, rating: 4.3, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', description: 'Comfortable running shoes for all terrains' },
        { product_id: 4, name: 'Denim Jacket', category_name: 'Clothing', price: 59.99, original_price: 89.99, rating: 4.6, image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300', description: 'Classic denim jacket for any occasion' },
        { product_id: 5, name: 'Coffee Maker', category_name: 'Home & Garden', price: 49.99, original_price: 69.99, rating: 4.4, image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300', description: 'Brew perfect coffee every morning' },
        { product_id: 6, name: 'Backpack', category_name: 'Sports', price: 39.99, original_price: 59.99, rating: 4.7, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', description: 'Durable backpack for work and travel' },
        { product_id: 7, name: 'Sunglasses', category_name: 'Clothing', price: 29.99, original_price: 49.99, rating: 4.2, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300', description: 'Stylish sunglasses with UV protection' },
        { product_id: 8, name: 'Plant Pot Set', category_name: 'Home & Garden', price: 24.99, original_price: 34.99, rating: 4.5, image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300', description: 'Beautiful ceramic plant pots for your garden' }
    ];

    app.get('/api/categories', (req, res) => {
        res.json({ categories: demoCategories });
    });

    app.get('/api/products', (req, res) => {
        res.json({ products: demoProducts });
    });

    app.get('/api/products/categories', (req, res) => {
        res.json({ categories: demoCategories });
    });

    app.get('/api/products/:id', (req, res) => {
        const product = demoProducts.find(p => p.product_id === parseInt(req.params.id));
        if (product) {
            res.json({ product });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    });

    app.post('/api/auth/login', (req, res) => {
        const { email, password } = req.body;
        // Demo login
        res.json({
            token: 'demo-token-' + Date.now(),
            user: { user_id: 1, name: 'Demo User', email: email }
        });
    });

    app.post('/api/auth/register', (req, res) => {
        const { name, email } = req.body;
        res.json({
            token: 'demo-token-' + Date.now(),
            user: { user_id: 1, name: name, email: email }
        });
    });

    app.post('/api/orders', (req, res) => {
        res.json({
            order_id: Date.now(),
            message: 'Order placed successfully (demo mode)'
        });
    });

    app.get('/api/orders', (req, res) => {
        res.json({ orders: [] });
    });

    app.get('/api/cart', (req, res) => {
        res.json({ items: [] });
    });
}

// ── SPA fallback ────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start (for local development) ───────────────────────────
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`\nShopSphere server running at http://localhost:${PORT}`);
        console.log(`API base: http://localhost:${PORT}/api`);
        if (!dbConfigured) {
            console.log('Running in DEMO MODE - Connect a MySQL database to enable full functionality');
        }
        console.log('Press Ctrl+C to stop\n');
    });
}

// Export for Vercel serverless
module.exports = app;
