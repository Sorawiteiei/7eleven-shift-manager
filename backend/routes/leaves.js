/**
 * 7-Eleven Shift Manager - Leaves Routes
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get All Leaves (Manager) or My Leaves (Employee)
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId; // If provided, filter by user (Employee view)
        const status = req.query.status; // Optional filter

        let query = `
            SELECT 
                l.*,
                u.name as employee_name,
                u.avatar as employee_avatar,
                u.employee_id as emp_code,
                au.name as approver_name
            FROM leave_requests l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN users au ON l.approver_id = au.id
            WHERE 1=1
        `;

        const params = [];

        if (userId) {
            query += ` AND l.user_id = ?`;
            params.push(userId);
        }

        if (status) {
            query += ` AND l.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY l.created_at DESC`;

        const leaves = await db.prepare(query).all(...params);
        res.json(leaves);

    } catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
});

// Create Leave Request
router.post('/', async (req, res) => {
    try {
        const { userId, type, startDate, endDate, reason } = req.body;

        if (!userId || !type || !startDate || !endDate) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const result = await db.prepare(`
            INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason)
            VALUES (?, ?, ?, ?, ?)
        `).run(userId, type, startDate, endDate, reason);

        // Notify? In a real app we might trigger a socket event or push notification here.
        // For now, an entry in activity log is enough.
        const employee = await db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
        await db.prepare(`
            INSERT INTO activity_log (user_id, action_type, description)
            VALUES (?, 'leave_request', ?)
        `).run(userId, `${employee.name} ส่งคำขอลา ${type} (${startDate})`);

        res.status(201).json({ success: true, message: 'ส่งใบลาเรียบร้อยแล้ว รอการอนุมัติ' });

    } catch (error) {
        console.error('Create leave error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// Update Status (Approve/Reject)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approverId, comment } = req.body; // status: 'approved' | 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
        }

        await db.prepare(`
            UPDATE leave_requests 
            SET status = ?, approver_id = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(status, approverId, comment, id);

        // Log
        await db.prepare(`
            INSERT INTO activity_log (user_id, action_type, description)
            VALUES (?, 'leave_update', ?)
        `).run(approverId, `ผู้จัดการอัปเดตใบลา #${id} เป็น ${status}`);

        res.json({ success: true, message: `ทำการ${status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}เรียบร้อยแล้ว` });

    } catch (error) {
        console.error('Update leave error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// Get Pending Count (For notification badge)
router.get('/pending-count', async (req, res) => {
    try {
        const result = await db.prepare(`
            SELECT count(*) as count FROM leave_requests WHERE status = 'pending'
        `).get();
        res.json({ count: result.count || result.rows?.[0]?.count || 0 });
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
