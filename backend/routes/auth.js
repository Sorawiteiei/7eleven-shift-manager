/**
 * 7-Eleven Shift Manager - Auth Routes
 * Login, logout, and authentication
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || '7eleven-shift-manager-secret-key';

// Login
router.post('/login', async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        if (!employeeId || !password) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' });
        }

        const user = await db.prepare(`
      SELECT * FROM users WHERE employee_id = ? AND is_active = 1
    `).get(employeeId);

        if (!user) {
            return res.status(401).json({ error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' });
        }

        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign(
            { id: user.id, employeeId: user.employee_id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        await db.prepare(`
      INSERT INTO activity_log (user_id, action_type, description)
      VALUES (?, 'login', ?)
    `).run(user.id, `${user.name} เข้าสู่ระบบ`);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                employeeId: user.employee_id,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Verify
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'ไม่พบ token' });

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await db.prepare(`
      SELECT id, employee_id, name, role, avatar, phone, email
      FROM users WHERE id = ? AND is_active = 1
    `).get(decoded.id);

        if (!user) return res.status(401).json({ error: 'ไม่พบผู้ใช้' });

        res.json({ valid: true, user });

    } catch (error) {
        res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
});

// Change Password
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { currentPassword, newPassword } = req.body;
        if (!token) return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

        if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

        if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
            return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        const newPasswordHash = bcrypt.hashSync(newPassword, 10);

        await db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPasswordHash, user.id);

        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อย' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Middleware
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

const managerOnly = (req, res, next) => {
    if (req.user?.role !== 'manager') return res.status(403).json({ error: 'ต้องเป็นผู้จัดการเท่านั้น' });
    next();
};

router.authMiddleware = authMiddleware;
router.managerOnly = managerOnly;

module.exports = router;
