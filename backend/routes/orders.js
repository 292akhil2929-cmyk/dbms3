// routes/orders.js
const router = require('express').Router();
const db     = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');

// POST /api/orders/checkout  — calls sp_place_order stored procedure
router.post('/checkout', authenticate, async (req, res) => {
    const { address_id, coupon_code, payment_method = 'cash_on_delivery' } = req.body;
    if (!address_id) return res.status(400).json({ error: 'address_id is required' });

    try {
        const conn = await db.getConnection();
        try {
            // Call stored procedure
            await conn.query('SET @order_id = 0, @msg = ""');
            await conn.query(
                'CALL sp_place_order(?, ?, ?, @order_id, @msg)',
                [req.user.user_id, address_id, coupon_code || null]
            );
            const [[result]] = await conn.query('SELECT @order_id AS order_id, @msg AS message');

            if (result.order_id <= 0) {
                return res.status(400).json({ error: result.message });
            }

            // Create payment record
            const [[order]] = await conn.query(
                'SELECT total_amount FROM ORDERS WHERE order_id = ?',
                [result.order_id]
            );
            await conn.query(
                'INSERT INTO PAYMENTS (order_id, method, status, amount) VALUES (?,?,?,?)',
                [result.order_id, payment_method, 'pending', order.total_amount]
            );

            res.status(201).json({ order_id: result.order_id, message: result.message });
        } finally {
            conn.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders  (user's own orders)
router.get('/', authenticate, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.order_id, o.status, o.total_amount, o.ordered_at,
                   COUNT(oi.item_id) AS item_count
            FROM ORDERS o
            JOIN ORDER_ITEMS oi ON o.order_id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.order_id
            ORDER BY o.ordered_at DESC
        `, [req.user.user_id]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const [[order]] = await db.query(`
            SELECT o.*, a.street, a.city, a.country, a.postal_code,
                   cp.code AS coupon_code, cp.discount_pct,
                   py.method AS payment_method, py.status AS payment_status
            FROM ORDERS o
            JOIN ADDRESSES a ON o.address_id = a.address_id
            LEFT JOIN COUPONS cp ON o.coupon_id = cp.coupon_id
            LEFT JOIN PAYMENTS py ON o.order_id = py.order_id
            WHERE o.order_id = ? AND (o.user_id = ? OR ? = 'admin')
        `, [req.params.id, req.user.user_id, req.user.role]);

        if (!order) return res.status(404).json({ error: 'Order not found' });

        const [items] = await db.query(`
            SELECT oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) AS line_total,
                   p.product_id, p.name, pi.url AS image
            FROM ORDER_ITEMS oi
            JOIN PRODUCTS p ON oi.product_id = p.product_id
            LEFT JOIN PRODUCT_IMAGES pi ON pi.product_id = p.product_id AND pi.is_primary = 1
            WHERE oi.order_id = ?
        `, [req.params.id]);

        res.json({ ...order, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/status  (admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
    const { status } = req.body;
    const valid = ['pending','confirmed','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    try {
        await db.query('UPDATE ORDERS SET status = ? WHERE order_id = ?', [status, req.params.id]);
        // Trigger trg_restore_stock_on_cancel fires automatically if cancelled
        res.json({ message: `Order status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/all  (admin)
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let where = '';
        const params = [];
        if (status) { where = 'WHERE o.status = ?'; params.push(status); }

        const [orders] = await db.query(`
            SELECT o.order_id, o.status, o.total_amount, o.ordered_at,
                   u.full_name AS customer, u.email
            FROM ORDERS o
            JOIN USERS u ON o.user_id = u.user_id
            ${where}
            ORDER BY o.ordered_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
