// routes/users.js
const router = require('express').Router();
const db     = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        const [[user]] = await db.query(
            'SELECT user_id, email, full_name, phone, role, created_at FROM USERS WHERE user_id = ?',
            [req.user.user_id]
        );
        const [addresses] = await db.query(
            'SELECT * FROM ADDRESSES WHERE user_id = ? ORDER BY is_default DESC',
            [req.user.user_id]
        );
        res.json({ ...user, addresses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/addresses
router.post('/addresses', authenticate, async (req, res) => {
    const { full_name, street, city, state, country, postal_code, is_default } = req.body;
    if (!full_name || !street || !city) return res.status(400).json({ error: 'full_name, street, city required' });
    try {
        if (is_default) {
            await db.query('UPDATE ADDRESSES SET is_default = 0 WHERE user_id = ?', [req.user.user_id]);
        }
        const [result] = await db.query(
            'INSERT INTO ADDRESSES (user_id, full_name, street, city, state, country, postal_code, is_default) VALUES (?,?,?,?,?,?,?,?)',
            [req.user.user_id, full_name, street, city, state||null, country||'UAE', postal_code||null, is_default?1:0]
        );
        res.status(201).json({ address_id: result.insertId, message: 'Address added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/admin/dashboard  (calls sp_dashboard_stats)
router.get('/admin/dashboard', authenticate, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('CALL sp_dashboard_stats()');
        res.json(rows[0][0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/admin/top-products
router.get('/admin/top-products', authenticate, requireAdmin, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    try {
        const [rows] = await db.query('CALL sp_top_selling_products(?)', [limit]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/admin/revenue-by-category
router.get('/admin/revenue-by-category', authenticate, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM vw_revenue_by_category ORDER BY revenue DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/admin/customers-above-avg  (nested subquery)
router.get('/admin/customers-above-avg', authenticate, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.user_id, u.full_name, u.email,
                   COUNT(o.order_id) AS order_count,
                   SUM(o.total_amount) AS total_spent
            FROM USERS u
            JOIN ORDERS o ON u.user_id = o.user_id
            WHERE o.status = 'delivered'
            GROUP BY u.user_id
            HAVING SUM(o.total_amount) > (
                SELECT AVG(user_total)
                FROM (
                    SELECT SUM(total_amount) AS user_total
                    FROM ORDERS
                    WHERE status = 'delivered'
                    GROUP BY user_id
                ) AS totals
            )
            ORDER BY total_spent DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/admin/validate-coupon/:code
router.get('/admin/validate-coupon/:code', authenticate, async (req, res) => {
    try {
        const [[coupon]] = await db.query(`
            SELECT coupon_id, code, discount_pct, expires_at, max_uses, used_count
            FROM COUPONS
            WHERE code = ? AND is_active = 1 AND expires_at >= CURDATE() AND used_count < max_uses
        `, [req.params.code]);
        if (!coupon) return res.status(404).json({ valid: false, error: 'Invalid or expired coupon' });
        res.json({ valid: true, ...coupon });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
