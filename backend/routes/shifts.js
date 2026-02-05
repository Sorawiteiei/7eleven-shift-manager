/**
 * 7-Eleven Shift Manager - Shifts Routes
 * CRUD operations for shifts/schedules
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get Shifts by Date
router.get('/date/:date', async (req, res) => {
    try {
        const { date } = req.params;

        // Manual helper for sorting to be DB agnostic
        const shifts = await db.prepare(`
      SELECT 
        s.id,
        s.user_id,
        s.shift_date,
        s.shift_type,
        s.status,
        s.notes,
        u.name as employee_name,
        u.avatar as employee_avatar
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.shift_date = ?
    `).all(date);

        // Sort manually
        const shiftOrder = { morning: 1, afternoon: 2, night: 3 };
        shifts.sort((a, b) => shiftOrder[a.shift_type] - shiftOrder[b.shift_type]);

        // Get tasks for each shift
        const shiftsWithTasks = await Promise.all(shifts.map(async (shift) => {
            const tasks = await db.prepare(`
        SELECT t.id, t.name, t.icon, st.is_completed
        FROM shift_tasks st
        JOIN tasks t ON st.task_id = t.id
        WHERE st.shift_id = ?
      `).all(shift.id);

            return { ...shift, tasks };
        }));

        const grouped = {
            morning: shiftsWithTasks.filter(s => s.shift_type === 'morning'),
            afternoon: shiftsWithTasks.filter(s => s.shift_type === 'afternoon'),
            night: shiftsWithTasks.filter(s => s.shift_type === 'night')
        };

        res.json(grouped);

    } catch (error) {
        console.error('Get shifts error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Get Shifts by Week
router.get('/week/:startDate', async (req, res) => {
    try {
        const { startDate } = req.params;

        // Calculate end date for query (start + 7 days)
        const end = new Date(startDate);
        end.setDate(end.getDate() + 7);
        const endDate = end.toISOString().split('T')[0];

        // Using string comparison for dates works in both SQLite and Postgres usually
        const shifts = await db.prepare(`
      SELECT 
        s.id,
        s.user_id,
        s.shift_date,
        s.shift_type,
        s.status,
        u.name as employee_name,
        u.avatar as employee_avatar
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.shift_date >= ? AND s.shift_date < ?
      ORDER BY s.shift_date, s.shift_type
    `).all(startDate, endDate);

        res.json(shifts);

    } catch (error) {
        console.error('Get week shifts error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Get Shifts by Employee
router.get('/employee/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { month } = req.query; // YYYY-MM

        // Base query
        let query = `
      SELECT 
        s.id,
        s.shift_date,
        s.shift_type,
        s.status,
        s.notes
      FROM shifts s
      WHERE s.user_id = ?
    `;

        const params = [userId];

        // Filter by month (doing it in JS for max compatibility is safest without ORM)
        // But let's try a LIKE query which works for string dates
        if (month) {
            // Create a start and end date for the month
            const startOfMonth = `${month}-01`;
            const endDate = new Date(month);
            endDate.setMonth(endDate.getMonth() + 1);
            const endOfMonth = endDate.toISOString().split('T')[0];

            query += ` AND s.shift_date >= ? AND s.shift_date < ?`;
            params.push(startOfMonth, endOfMonth);
        }

        query += ` ORDER BY s.shift_date DESC`;

        const shifts = await db.prepare(query).all(...params);

        const shiftsWithTasks = await Promise.all(shifts.map(async (shift) => {
            const tasks = await db.prepare(`
        SELECT t.id, t.name, st.is_completed
        FROM shift_tasks st
        JOIN tasks t ON st.task_id = t.id
        WHERE st.shift_id = ?
      `).all(shift.id);

            return { ...shift, tasks };
        }));

        res.json(shiftsWithTasks);

    } catch (error) {
        console.error('Get employee shifts error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Create Shift
router.post('/', async (req, res) => {
    try {
        const { userId, shiftDate, shiftType, tasks, notes } = req.body;

        if (!userId || !shiftDate || !shiftType) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const existing = await db.prepare(`
      SELECT id FROM shifts 
      WHERE user_id = ? AND shift_date = ? AND shift_type = ?
    `).get(userId, shiftDate, shiftType);

        if (existing) return res.status(400).json({ error: 'พนักงานมีกะนี้แล้วในวันที่เลือก' });

        const result = await db.prepare(`
      INSERT INTO shifts (user_id, shift_date, shift_type, notes)
      VALUES (?, ?, ?, ?)
    `).run(userId, shiftDate, shiftType, notes);

        const shiftId = result.lastInsertRowid;

        if (tasks && tasks.length > 0) {
            for (const taskId of tasks) {
                await db.prepare(`
          INSERT INTO shift_tasks (shift_id, task_id)
          VALUES (?, ?)
        `).run(shiftId, taskId);
            }
        }

        const employee = await db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
        await db.prepare(`
      INSERT INTO activity_log (user_id, action_type, description)
      VALUES (?, 'shift_created', ?)
    `).run(userId, `เพิ่มกะ ${shiftType} ให้ ${employee.name} วันที่ ${shiftDate}`);

        res.status(201).json({
            success: true,
            id: shiftId,
            message: 'เพิ่มกะงานเรียบร้อย'
        });

    } catch (error) {
        console.error('Create shift error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Update Shift
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { shiftType, tasks, notes, status } = req.body;

        const existing = await db.prepare('SELECT id FROM shifts WHERE id = ?').get(id);
        if (!existing) return res.status(404).json({ error: 'ไม่พบกะงาน' });

        await db.prepare(`
      UPDATE shifts SET 
        shift_type = COALESCE(?, shift_type),
        notes = ?,
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(shiftType, notes, status, id);

        if (tasks) {
            await db.prepare('DELETE FROM shift_tasks WHERE shift_id = ?').run(id);
            for (const taskId of tasks) {
                await db.prepare('INSERT INTO shift_tasks (shift_id, task_id) VALUES (?, ?)').run(id, taskId);
            }
        }

        res.json({ success: true, message: 'แก้ไขกะงานเรียบร้อย' });

    } catch (error) {
        console.error('Update shift error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Delete Shift
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db.prepare('SELECT id FROM shifts WHERE id = ?').get(id);
        if (!existing) return res.status(404).json({ error: 'ไม่พบกะงาน' });

        await db.prepare('DELETE FROM shifts WHERE id = ?').run(id);
        res.json({ success: true, message: 'ลบกะงานเรียบร้อย' });

    } catch (error) {
        console.error('Delete shift error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// Complete Task
router.post('/:shiftId/tasks/:taskId/complete', async (req, res) => {
    try {
        const { shiftId, taskId } = req.params;
        const { completed } = req.body;

        await db.prepare(`
      UPDATE shift_tasks SET 
        is_completed = ?,
        completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE shift_id = ? AND task_id = ?
    `).run(completed ? 1 : 0, completed ? 1 : 0, shiftId, taskId);

        res.json({ success: true, message: completed ? 'ทำงานเสร็จแล้ว' : 'ยกเลิกสถานะเสร็จ' });

    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

module.exports = router;
