const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedDemoData() {
    console.log('🌱 Seeding demo data (10 employees + shifts)...');

    // Initialize DB connection
    await db.initDatabase();

    const passwordHash = bcrypt.hashSync('1234', 10);

    // 1. Add "Assistant Manager" role support (if needed, currently we use 'role' column)
    // We will map: 
    // Manager -> 'manager'
    // Assistant -> 'assistant' (New) - need to check if table allows this or just use title
    // Employee -> 'employee'

    // First, let's allow 'assistant' in check constraint if it was strict, 
    // but SQLite/Postgres check constraints are hard to alter. 
    // For simplicity in this app, we might store role='manager' or 'employee' mostly.
    // However, the user wants "Assistant Manager" POSITION (Title).
    // The schema has `role` check IN ('manager', 'employee'). 
    // So for Assistant Manager, we will use role='manager' (access level) 
    // but set their name/title accordingly, OR just use 'employee' role with a specific title?
    // Let's assume they want the title. Since there is no 'title' column other than 'name', I will start by adding 'position' column?
    // Or just put it in the name for now?
    // Looking at schema: role is strictly 'manager' or 'employee'.

    // **Decision**: Use role='manager' for Assistant Manager so they can manage shifts too.

    const newEmployees = [
        { id: 'asst001', name: 'วิชัย (ผช.ผจก)', role: 'manager', phone: '089-111-1111' },
        { id: 'emp003', name: 'นภา (พนักงาน)', role: 'employee', phone: '089-222-2222' },
        { id: 'emp004', name: 'ศักดิ์ (พนักงาน)', role: 'employee', phone: '089-333-3333' },
        { id: 'emp005', name: 'ดาว (พนักงาน)', role: 'employee', phone: '089-444-4444' },
        { id: 'emp006', name: 'เดือน (พนักงาน)', role: 'employee', phone: '089-555-5555' },
        { id: 'emp007', name: 'เสาร์ (พนักงาน)', role: 'employee', phone: '089-666-6666' },
        { id: 'emp008', name: 'อาทิตย์ (พนักงาน)', role: 'employee', phone: '089-777-7777' },
        { id: 'emp009', name: 'จันทร์ (พนักงาน)', role: 'employee', phone: '089-888-8888' },
        { id: 'emp010', name: 'อังคาร (พนักงาน)', role: 'employee', phone: '089-999-9999' },
        { id: 'emp011', name: 'พุธ (พนักงาน)', role: 'employee', phone: '089-000-0000' }
    ];

    let createdUsers = [];

    // Insert Users
    for (const emp of newEmployees) {
        try {
            // Check if exists
            const existing = await db.prepare('SELECT id FROM users WHERE employee_id = ?').get(emp.id);
            let userId;

            if (!existing) {
                const res = await db.prepare(`
                    INSERT INTO users (employee_id, password_hash, name, role, phone, avatar)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(emp.id, passwordHash, emp.name, emp.role, emp.phone, emp.name.charAt(0));

                userId = res.lastInsertRowid;
                console.log(`✅ Added user: ${emp.name}`);

                // If using Postgres, run returns slightly different structure, need handle that in db.js adapter wrapper? 
                // db.js wrapper returns { lastInsertRowid, changes }. 
                // But for postgres using RETURNING id is better. 
                // Re-query to be safe if ID missing.
                if (!userId) {
                    const u = await db.prepare('SELECT id FROM users WHERE employee_id = ?').get(emp.id);
                    userId = u.id;
                }
            } else {
                console.log(`ℹ️ User ${emp.name} already exists`);
                userId = existing.id;
            }
            createdUsers.push(userId);
        } catch (e) {
            console.error(`❌ Failed to add ${emp.name}:`, e.message);
        }
    }

    // Assign Shifts for TODAY
    const today = new Date().toISOString().split('T')[0];
    const shiftTypes = ['morning', 'afternoon', 'night'];

    console.log('📅 Assigning shifts...');

    // Clear existing shifts for today to avoid duplicates/mess
    await db.exec(`DELETE FROM shifts WHERE shift_date = '${today}'`);

    let userIndex = 0;
    // Get all users (including old ones)
    const allUsers = await db.prepare('SELECT id, name FROM users').all();

    // Distribute 4-4-remaining
    for (let i = 0; i < allUsers.length; i++) {
        const user = allUsers[i];
        const type = shiftTypes[i % 3]; // Rotate shift types

        try {
            const res = await db.prepare(`
                INSERT INTO shifts (user_id, shift_date, shift_type, status)
                VALUES (?, ?, ?, 'scheduled')
            `).run(user.id, today, type);

            const shiftId = res.lastInsertRowid || (await db.prepare('SELECT id FROM shifts WHERE user_id = ? AND shift_date = ?').get(user.id, today)).id;

            // Assign random tasks
            const tasks = await db.prepare('SELECT id FROM tasks').all();
            const randomTasks = tasks.sort(() => 0.5 - Math.random()).slice(0, 2); // 2 random tasks

            for (const t of randomTasks) {
                await db.prepare(`
                    INSERT INTO shift_tasks (shift_id, task_id) VALUES (?, ?)
                `).run(shiftId, t.id);
            }
            console.log(`  - Assigned ${user.name} to ${type}`);
        } catch (e) {
            console.error(`  Failed to assign shift for ${user.name}`, e);
        }
    }

    console.log('🎉 Demo data seeded successfully!');
}

seedDemoData().catch(console.error);
