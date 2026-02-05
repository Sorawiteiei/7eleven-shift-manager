/**
 * 7-Eleven Shift Manager - Employees Routes
 * CRUD operations for employees
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Get All Employees
router.get('/', async (req, res) => {
    try {
        const employees = await db.prepare(`
      SELECT id, employee_id, name, role, phone, email, avatar, start_date, is_active, created_at
      FROM users
      WHERE is_active = 1
      ORDER BY name
    `).all();

        // Map snake_case to camelCase for frontend
        res.json(employees.map(emp => ({
            id: emp.id,
            employeeId: emp.employee_id,
            name: emp.name,
            role: emp.role,
            phone: emp.phone,
            email: emp.email,
            avatar: emp.avatar,
            startDate: emp.start_date,
            createdAt: emp.created_at
        })));

    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Get Single Employee
router.get('/:id', async (req, res) => {
    try {
        const employee = await db.prepare(`
      SELECT id, employee_id, name, role, phone, email, avatar, start_date, created_at
      FROM users
      WHERE id = ? AND is_active = 1
    `).get(req.params.id);

        if (!employee) return res.status(404).json({ error: 'ไม่พบพนักงาน' });

        // Stats query needs to be compatible with both DBs
        // SQLite: date('now', '-30 days')
        // Postgres: NOW() - INTERVAL '30 days'

        // Simplification: Let's fetch shifts and count in JS for cross-db compatibility comfort
        const shifts = await db.prepare(`
      SELECT shift_type 
      FROM shifts 
      WHERE user_id = ? 
    `).all(req.params.id);

        const stats = {
            totalShifts: shifts.length,
            morningShifts: shifts.filter(s => s.shift_type === 'morning').length,
            afternoonShifts: shifts.filter(s => s.shift_type === 'afternoon').length,
            nightShifts: shifts.filter(s => s.shift_type === 'night').length
        };

        res.json({
            id: employee.id,
            employeeId: employee.employee_id,
            name: employee.name,
            role: employee.role,
            phone: employee.phone,
            email: employee.email,
            avatar: employee.avatar,
            startDate: employee.start_date,
            createdAt: employee.created_at,
            statistics: stats
        });

    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Create Employee
router.post('/', async (req, res) => {
    try {
        const { employeeId, password, name, role, phone, email, startDate } = req.body;

        if (!employeeId || !password || !name) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const existing = await db.prepare('SELECT id FROM users WHERE employee_id = ?').get(employeeId);
        if (existing) return res.status(400).json({ error: 'รหัสพนักงานนี้มีอยู่แล้ว' });

        const passwordHash = bcrypt.hashSync(password, 10);
        const avatar = name.charAt(0);

        const result = await db.prepare(`
      INSERT INTO users (employee_id, password_hash, name, role, phone, email, avatar, start_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(employeeId, passwordHash, name, role || 'employee', phone, email, avatar, startDate);

        res.status(201).json({
            success: true,
            id: result.lastInsertRowid,
            message: 'เพิ่มพนักงานเรียบร้อย'
        });

    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Update Employee
router.put('/:id', async (req, res) => {
    try {
        const { employeeId, name, role, phone, email, startDate, password } = req.body;
        const id = req.params.id;

        const existing = await db.prepare('SELECT id FROM users WHERE id = ?').get(id);
        if (!existing) return res.status(404).json({ error: 'ไม่พบพนักงาน' });

        if (employeeId) {
            const conflict = await db.prepare('SELECT id FROM users WHERE employee_id = ? AND id != ?').get(employeeId, id);
            if (conflict) return res.status(400).json({ error: 'รหัสพนักงานนี้มีผู้ใช้อื่นแล้ว' });
        }

        await db.prepare(`
      UPDATE users SET 
        employee_id = COALESCE(?, employee_id),
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        phone = ?,
        email = ?,
        start_date = ?,
        avatar = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(employeeId, name, role, phone, email, startDate, name ? name.charAt(0) : null, id);

        if (password) {
            const passwordHash = bcrypt.hashSync(password, 10);
            await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
        }

        res.json({ success: true, message: 'แก้ไขข้อมูลพนักงานเรียบร้อย' });

    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Delete Employee
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db.prepare('SELECT id, name FROM users WHERE id = ? AND is_active = 1').get(id);
        if (!existing) return res.status(404).json({ error: 'ไม่พบพนักงาน' });

        await db.prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
        res.json({ success: true, message: `ลบพนักงาน ${existing.name} เรียบร้อย` });

    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

module.exports = router;
