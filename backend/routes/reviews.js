// routes/reviews.js
const router = require('express').Router();
const db     = require('../db/connection');
const { authenticate } = require('../middleware/auth');

// GET /api/reviews/:product_id
router.get('/:product_id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.review_id, r.rating, r.comment, r.created_at,
                   u.full_name AS reviewer
            FROM REVIEWS r
            JOIN USERS u ON r.user_id = u.user_id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.product_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reviews
router.post('/', authenticate, async (req, res) => {
    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) return res.status(400).json({ error: 'product_id and rating required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    try {
        // Only allow review if user purchased this product
        const [[bought]] = await db.query(`
            SELECT oi.item_id
            FROM ORDER_ITEMS oi
            JOIN ORDERS o ON oi.order_id = o.order_id
            WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
            LIMIT 1
        `, [req.user.user_id, product_id]);

        if (!bought) {
            return res.status(403).json({ error: 'You can only review products you have purchased and received' });
        }

        await db.query(
            'INSERT INTO REVIEWS (user_id, product_id, rating, comment) VALUES (?,?,?,?)',
            [req.user.user_id, product_id, rating, comment || null]
        );
        // trg_update_avg_rating_insert fires automatically
        res.status(201).json({ message: 'Review submitted' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'You have already reviewed this product' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
