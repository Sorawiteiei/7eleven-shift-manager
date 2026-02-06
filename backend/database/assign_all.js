const db = require('./db');

async function assignTasksToEveryone() {
    console.log('👷 Assigning realistic tasks to all active shifts...');

    await db.initDatabase();

    const today = new Date().toISOString().split('T')[0];

    // Get all shifts for today
    const shifts = await db.prepare(`
        SELECT s.id, s.shift_type, u.name, u.role 
        FROM shifts s
        JOIN users u ON s.user_id = u.id
        WHERE s.shift_date = ?
    `).all(today);

    console.log(`Found ${shifts.length} shifts to update.`);

    // Helper to get tasks by shift type
    const getTasksByShift = async (shiftType) => {
        return await db.prepare(`
            SELECT id FROM tasks 
            WHERE shift_type = ? OR shift_type = 'all'
        `).all(shiftType);
    };

    for (const shift of shifts) {
        // Clear old tasks first
        await db.prepare('DELETE FROM shift_tasks WHERE shift_id = ?').run(shift.id);

        // Get available tasks for this shift type
        let availableTasks = await getTasksByShift(shift.shift_type);

        // Filter/Prioritize tasks based on Role
        let selectedTasks = [];

        if (shift.role === 'manager') {
            // Managers do 'Money', 'Stock', 'Check Expiry' mostly
            // Let's pick specific ones if possible, or just random heavy ones
            // For simplicity, we randomly pick 3-4 tasks
            selectedTasks = availableTasks.sort(() => 0.5 - Math.random()).slice(0, 4);
        } else {
            // Employees get general operational tasks
            selectedTasks = availableTasks.sort(() => 0.5 - Math.random()).slice(0, 3);
        }

        // Assign
        for (const t of selectedTasks) {
            await db.prepare(`
                INSERT INTO shift_tasks (shift_id, task_id) VALUES (?, ?)
            `).run(shift.id, t.id);
        }

        console.log(`  ✅ Assigned ${selectedTasks.length} tasks to ${shift.name} (${shift.shift_type})`);
    }

    console.log('🎉 All personnel updated with new tasks!');
}

assignTasksToEveryone().catch(console.error);
