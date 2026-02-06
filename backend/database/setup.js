/**
 * 7-Eleven Shift Manager - Database Setup
 * Works for both SQLite (Local) and PostgreSQL (Production)
 */

const db = require('./db');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('🗄️  Initializing database schema...');

  try {
    await db.initDatabase();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    throw error;
  }

  // ============================================
  // Create Tables
  // ============================================

  // Syntax differences handling
  const autoIncrement = process.env.DATABASE_URL ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT';
  const idType = process.env.DATABASE_URL ? 'INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestampDefault = 'CURRENT_TIMESTAMP';

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id ${idType},
      employee_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('manager', 'employee')) DEFAULT 'employee',
      employment_type TEXT CHECK(employment_type IN ('fulltime', 'parttime')) DEFAULT 'fulltime',
      phone TEXT,
      email TEXT,
      avatar TEXT,
      start_date DATE,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      updated_at TIMESTAMP DEFAULT ${timestampDefault}
    )
  `);

  // Migration: Add employment_type if not exists
  try {
    // Try adding the column (will fail if exists, which is fine)
    await db.exec(`ALTER TABLE users ADD COLUMN employment_type TEXT DEFAULT 'fulltime'`);
    console.log('  - Added column: employment_type');
  } catch (e) {
    // Column likely exists
  }

  // Tasks table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id ${idType},
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'check',
      shift_type TEXT CHECK(shift_type IN ('morning', 'afternoon', 'night', 'all')) DEFAULT 'all',
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )
  `);

  // Shifts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shifts (
      id ${idType},
      user_id INTEGER NOT NULL,
      shift_date DATE NOT NULL,
      shift_type TEXT CHECK(shift_type IN ('morning', 'afternoon', 'night')) NOT NULL,
      status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
      notes TEXT,
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Shift tasks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shift_tasks (
      id ${idType},
      shift_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      is_completed INTEGER DEFAULT 0,
      completed_at TIMESTAMP,
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  // Activity log
  await db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id ${idType},
      user_id INTEGER,
      action_type TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ Tables created successfully');

  // ============================================
  // Seed Initial Data (Only if no users exist)
  // ============================================

  try {
    const existing = await db.prepare('SELECT count(*) as count FROM users').get();
    const count = parseInt(existing?.count || existing?.rows?.[0]?.count || 0);

    if (count === 0) {
      console.log('📝 Seeding initial data...');

      const passwordHash = bcrypt.hashSync('1234', 10);

      // Insert users
      const users = [
        ['admin', passwordHash, 'ผู้จัดการร้าน', 'manager', '081-234-5678', 'ผ'],
        ['emp001', passwordHash, 'สมชาย ใจดี', 'employee', '082-345-6789', 'ส'],
        ['emp002', passwordHash, 'สมหญิง รักงาน', 'employee', '083-456-7890', 'ส'],
      ];

      for (const user of users) {
        await db.prepare(`
          INSERT INTO users (employee_id, password_hash, name, role, phone, avatar)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(...user);
      }

      console.log('  - Users created');

      // Insert tasks
      const tasks = [
        ['เปิดร้าน', 'เตรียมร้านก่อนเปิดขาย', 'door-open', 'morning'],
        ['เช็คสต๊อก', 'ตรวจนับสินค้าในร้าน', 'clipboard-check', 'all'],
        ['ปิดร้าน', 'ปิดร้านและสรุปยอด', 'door-closed', 'night'],
      ];

      for (const task of tasks) {
        await db.prepare(`
          INSERT INTO tasks (name, description, icon, shift_type)
          VALUES (?, ?, ?, ?)
        `).run(...task);
      }
      console.log('  - Tasks created');

      console.log('✅ Seed data created successfully');
    } else {
      console.log('📝 Data already exists, skipping seed.');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }

  console.log('🎉 Database setup complete!');
}

if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
