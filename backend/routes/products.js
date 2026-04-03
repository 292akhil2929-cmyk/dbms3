// routes/products.js
const router = require('express').Router();
const db     = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/products  (with search, filter, sort, pagination)
router.get('/', async (req, res) => {
    try {
        let { search, category_id, min_price, max_price, sort, page, limit } = req.query;
        page  = parseInt(page)  || 1;
        limit = parseInt(limit) || 12;
        const offset = (page - 1) * limit;

        let conditions = ['p.is_active = 1'];
        const params   = [];

        if (search) {
            conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (category_id) {
            conditions.push('p.category_id = ?');
            params.push(category_id);
        }
        if (min_price) { conditions.push('p.price >= ?'); params.push(min_price); }
        if (max_price) { conditions.push('p.price <= ?'); params.push(max_price); }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const sortMap = {
            'price_asc':    'p.price ASC',
            'price_desc':   'p.price DESC',
            'rating':       'p.avg_rating DESC',
            'newest':       'p.created_at DESC',
            'name':         'p.name ASC'
        };
        const orderBy = sortMap[sort] || 'p.created_at DESC';

        const countSql = `SELECT COUNT(*) AS total FROM PRODUCTS p ${where}`;
        const [[{ total }]] = await db.query(countSql, params);

        const dataSql = `
            SELECT p.product_id, p.name, p.price, p.stock_qty, p.avg_rating,
                   c.name AS category_name, pi.url AS primary_image
            FROM PRODUCTS p
            JOIN CATEGORIES c ON p.category_id = c.category_id
            LEFT JOIN PRODUCT_IMAGES pi ON pi.product_id = p.product_id AND pi.is_primary = 1
            ${where}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?`;

        const [products] = await db.query(dataSql, [...params, limit, offset]);

        res.json({
            products,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/:id  (single product with images and reviews)
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.name AS category_name
            FROM PRODUCTS p
            JOIN CATEGORIES c ON p.category_id = c.category_id
            WHERE p.product_id = ? AND p.is_active = 1
        `, [req.params.id]);

        if (!rows.length) return res.status(404).json({ error: 'Product not found' });

        const product = rows[0];

        const [images] = await db.query(
            'SELECT url, is_primary FROM PRODUCT_IMAGES WHERE product_id = ? ORDER BY is_primary DESC',
            [product.product_id]
        );

        const [reviews] = await db.query(`
            SELECT r.rating, r.comment, r.created_at, u.full_name AS reviewer
            FROM REVIEWS r
            JOIN USERS u ON r.user_id = u.user_id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
            LIMIT 20
        `, [product.product_id]);

        // Correlated subquery: products in same category above same price
        const [similar] = await db.query(`
            SELECT p2.product_id, p2.name, p2.price, p2.avg_rating, pi.url AS primary_image
            FROM PRODUCTS p2
            LEFT JOIN PRODUCT_IMAGES pi ON pi.product_id = p2.product_id AND pi.is_primary = 1
            WHERE p2.category_id = ?
              AND p2.product_id  != ?
              AND p2.is_active    = 1
            LIMIT 4
        `, [product.category_id, product.product_id]);

        res.json({ ...product, images, reviews, similar });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products  (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    const { category_id, name, description, price, stock_qty } = req.body;
    if (!category_id || !name || price == null) {
        return res.status(400).json({ error: 'category_id, name and price are required' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO PRODUCTS (category_id, name, description, price, stock_qty) VALUES (?,?,?,?,?)',
            [category_id, name, description || '', price, stock_qty || 0]
        );
        res.status(201).json({ product_id: result.insertId, message: 'Product created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/products/:id  (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
    const fields  = ['name','description','price','stock_qty','category_id','is_active'];
    const updates = [];
    const vals    = [];
    for (const f of fields) {
        if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); }
    }
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    try {
        vals.push(req.params.id);
        await db.query(`UPDATE PRODUCTS SET ${updates.join(', ')} WHERE product_id = ?`, vals);
        res.json({ message: 'Product updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/:id  (soft delete)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        await db.query('UPDATE PRODUCTS SET is_active = 0 WHERE product_id = ?', [req.params.id]);
        res.json({ message: 'Product deactivated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
