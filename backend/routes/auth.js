// routes/auth.js
const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db/connection');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password, full_name, phone } = req.body;
    if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'email, password and full_name are required' });
    }
    try {
        const [existing] = await db.query('SELECT user_id FROM USERS WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO USERS (email, password_hash, full_name, phone) VALUES (?,?,?,?)',
            [email, hash, full_name, phone || null]
        );
        const token = jwt.sign(
            { user_id: result.insertId, email, full_name, role: 'customer' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(201).json({ message: 'Registered successfully', token, user_id: result.insertId, full_name, email, role: 'customer' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }
    try {
        const [rows] = await db.query(
            'SELECT user_id, email, password_hash, full_name, role, is_active FROM USERS WHERE email = ?',
            [email]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = rows[0];
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, full_name: user.full_name, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token, user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
