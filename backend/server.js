// server.js — ShopSphere Backend
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/users',    require('./routes/users'));

// ── Categories shortcut ─────────────────────────────────────
const db = require('./db/connection');
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT category_id, name, parent_id FROM CATEGORIES ORDER BY parent_id, name'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Coupon validation shortcut (public)
app.get('/api/coupons/validate/:code', async (req, res) => {
    try {
        const [[coupon]] = await db.query(`
            SELECT coupon_id, code, discount_pct
            FROM COUPONS
            WHERE code = ? AND is_active = 1
              AND expires_at >= CURDATE()
              AND used_count < max_uses
        `, [req.params.code]);
        if (!coupon) return res.status(404).json({ valid: false, error: 'Invalid or expired coupon' });
        res.json({ valid: true, ...coupon });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SPA fallback ────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ShopSphere server running at http://localhost:${PORT}`);
    console.log(`   API base: http://localhost:${PORT}/api`);
    console.log(`   Press Ctrl+C to stop\n`);
});
