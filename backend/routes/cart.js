// routes/cart.js
const router = require('express').Router();
const db     = require('../db/connection');
const { authenticate } = require('../middleware/auth');

// GET /api/cart
router.get('/', authenticate, async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT ci.cart_id, ci.quantity, ci.added_at,
                   p.product_id, p.name, p.price, p.stock_qty,
                   pi.url AS image
            FROM CART_ITEMS ci
            JOIN PRODUCTS p ON ci.product_id = p.product_id
            LEFT JOIN PRODUCT_IMAGES pi ON pi.product_id = p.product_id AND pi.is_primary = 1
            WHERE ci.user_id = ?
            ORDER BY ci.added_at DESC
        `, [req.user.user_id]);

        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        res.json({ items, subtotal: parseFloat(subtotal.toFixed(2)) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cart  (add or update quantity)
router.post('/', authenticate, async (req, res) => {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });
    try {
        const [[prod]] = await db.query(
            'SELECT stock_qty FROM PRODUCTS WHERE product_id = ? AND is_active = 1',
            [product_id]
        );
        if (!prod) return res.status(404).json({ error: 'Product not found' });
        if (prod.stock_qty < quantity) return res.status(400).json({ error: 'Insufficient stock' });

        await db.query(`
            INSERT INTO CART_ITEMS (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `, [req.user.user_id, product_id, quantity]);

        res.json({ message: 'Added to cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/cart/:cart_id
router.patch('/:cart_id', authenticate, async (req, res) => {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });
    try {
        const [result] = await db.query(
            'UPDATE CART_ITEMS SET quantity = ? WHERE cart_id = ? AND user_id = ?',
            [quantity, req.params.cart_id, req.user.user_id]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Cart item not found' });
        res.json({ message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cart/:cart_id
router.delete('/:cart_id', authenticate, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM CART_ITEMS WHERE cart_id = ? AND user_id = ?',
            [req.params.cart_id, req.user.user_id]
        );
        res.json({ message: 'Removed from cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cart  (clear cart)
router.delete('/', authenticate, async (req, res) => {
    try {
        await db.query('DELETE FROM CART_ITEMS WHERE user_id = ?', [req.user.user_id]);
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
