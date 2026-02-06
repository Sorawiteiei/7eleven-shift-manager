const db = require('./db');
const fs = require('fs');

async function migrateLeaves() {
    console.log('🏖️  Creating leave_requests table...');

    await db.initDatabase();

    const idType = process.env.DATABASE_URL ? 'INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const timestampDefault = 'CURRENT_TIMESTAMP';

    try {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS leave_requests (
                id ${idType},
                user_id INTEGER NOT NULL,
                leave_type TEXT CHECK(leave_type IN ('sick', 'vacation', 'business', 'other')) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason TEXT,
                status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
                approver_id INTEGER,
                comment TEXT,
                created_at TIMESTAMP DEFAULT ${timestampDefault},
                updated_at TIMESTAMP DEFAULT ${timestampDefault},
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (approver_id) REFERENCES users(id)
            )
        `);
        console.log('✅ Table leave_requests created.');

        // Seed some dummy data for notification testing
        // Check if table empty
        const count = await db.prepare('SELECT count(*) as c FROM leave_requests').get();
        if (count.c === 0 || count.count === 0) {
            console.log('🌱 Seeding sample leave requests...');
            const users = await db.prepare('SELECT id FROM users WHERE role = ?').all('employee');
            if (users.length > 0) {
                const u1 = users[0];
                await db.prepare(`
                   INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason)
                   VALUES (?, 'sick', DATE('now', '+1 day'), DATE('now', '+1 day'), 'ปวดศรีษะ ตัวร้อน')
               `).run(u1.id);

                if (users.length > 1) {
                    const u2 = users[1];
                    await db.prepare(`
                       INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason)
                       VALUES (?, 'vacation', DATE('now', '+5 day'), DATE('now', '+7 day'), 'กลับบ้านต่างจังหวัด')
                   `).run(u2.id);
                }
            }
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    }
}

migrateLeaves().catch(console.error);
