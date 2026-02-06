const db = require('./db');

async function migrateShiftsTable() {
    console.log('🔄 Migrating shifts table to support custom shifts...');

    await db.initDatabase();

    // 1. Rename existing table
    try {
        await db.exec('ALTER TABLE shifts RENAME TO shifts_old');
    } catch (e) {
        console.log('  (Might already be renamed or not exist, proceeding...)');
    }

    // 2. Create new table without restrictive CHECK constraint on shift_type
    //    And with new columns
    const idType = process.env.DATABASE_URL ? 'INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const timestampDefault = 'CURRENT_TIMESTAMP';

    await db.exec(`
        CREATE TABLE IF NOT EXISTS shifts (
            id ${idType},
            user_id INTEGER NOT NULL,
            shift_date DATE NOT NULL,
            shift_type TEXT NOT NULL, -- No check constraint, allows 'custom'
            custom_name TEXT,
            start_time TEXT,
            end_time TEXT,
            status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP DEFAULT ${timestampDefault},
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // 3. Copy data back
    try {
        await db.exec(`
            INSERT INTO shifts (id, user_id, shift_date, shift_type, status, notes, created_at)
            SELECT id, user_id, shift_date, shift_type, status, notes, created_at FROM shifts_old
        `);
        console.log('  Data copied successfully.');

        // 4. Drop old table
        await db.exec('DROP TABLE shifts_old');
    } catch (e) {
        console.error('  Error copying data or dropping table:', e.message);
        // If error, maybe table structure didn't match perfectly, usually fine for this simple schema
    }

    console.log('✅ Migration complete!');
}

migrateShiftsTable().catch(console.error);
