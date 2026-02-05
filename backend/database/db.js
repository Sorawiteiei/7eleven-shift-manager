/**
 * 7-Eleven Shift Manager - Database Connection
 * Supports both SQLite (Local) and PostgreSQL (Production)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if we are in production (uses PostgreSQL) or development (uses SQLite)
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let db;

if (IS_PRODUCTION) {
    // ==========================================
    // PostgreSQL Connection (Production)
    // ==========================================
    const { Pool } = require('pg');
    const pool = new Pool({
        // Hardcoded for immediate fix
        connectionString: 'postgresql://neondb_owner:npg_xUGo1MbQ6HnI@ep-curly-voice-a1999abb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        ssl: {
            rejectUnauthorized: false
        }
    });

    console.log('🔌 Connecting to PostgreSQL...');

    // Adapter to match SQLite API interface
    db = {
        initDatabase: async () => {
            // Tables will be created via setup script or manual execution
            return pool;
        },
        prepare: (sql) => {
            // Convert ? to $1, $2, etc. for Postgres
            let paramCount = 0;
            const pgSql = sql.replace(/\?/g, () => `$${++paramCount}`);

            return {
                run: async (...params) => {
                    const client = await pool.connect();
                    try {
                        const res = await client.query(pgSql, params);
                        return {
                            lastInsertRowid: res.rows[0]?.id || 0,
                            changes: res.rowCount
                        };
                    } finally {
                        client.release();
                    }
                },
                get: async (...params) => {
                    const client = await pool.connect();
                    try {
                        const res = await client.query(pgSql, params);
                        return res.rows[0];
                    } finally {
                        client.release();
                    }
                },
                all: async (...params) => {
                    const client = await pool.connect();
                    try {
                        const res = await client.query(pgSql, params);
                        return res.rows;
                    } finally {
                        client.release();
                    }
                }
            };
        },
        // Helper specifically for our use case wrapper
        exec: async (sql) => {
            const client = await pool.connect();
            try {
                return await client.query(sql);
            } finally {
                client.release();
            }
        }
    };

} else {
    // ==========================================
    // SQLite Connection (Local Development)
    // ==========================================
    const initSqlJs = require('sql.js');

    // Database file path
    const DB_PATH = path.join(__dirname, 'shift_manager.db');
    let sqliteDb = null;

    db = {
        initDatabase: async () => {
            if (sqliteDb) return sqliteDb;

            const SQL = await initSqlJs();

            try {
                if (fs.existsSync(DB_PATH)) {
                    const buffer = fs.readFileSync(DB_PATH);
                    sqliteDb = new SQL.Database(buffer);
                } else {
                    sqliteDb = new SQL.Database();
                    console.log('Created new local database');
                }
                sqliteDb.run('PRAGMA foreign_keys = ON');
                return sqliteDb;
            } catch (error) {
                console.error('Failed to initialize local database:', error.message);
                throw error;
            }
        },
        saveDatabase: () => {
            if (!sqliteDb) return;
            const data = sqliteDb.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(DB_PATH, buffer);
        },
        prepare: (sql) => {
            return {
                run: (...params) => {
                    if (!sqliteDb) throw new Error('DB not initialized');
                    sqliteDb.run(sql, params);
                    db.saveDatabase();

                    let lastId = 0;
                    try {
                        lastId = sqliteDb.exec('SELECT last_insert_rowid()')[0]?.values[0][0] || 0;
                    } catch (e) { }

                    return {
                        lastInsertRowid: lastId,
                        changes: sqliteDb.getRowsModified()
                    };
                },
                get: (...params) => {
                    if (!sqliteDb) throw new Error('DB not initialized');
                    const stmt = sqliteDb.prepare(sql);
                    stmt.bind(params);
                    if (stmt.step()) {
                        const row = stmt.getAsObject();
                        stmt.free();
                        return row;
                    }
                    stmt.free();
                    return null;
                },
                all: (...params) => {
                    if (!sqliteDb) throw new Error('DB not initialized');
                    const stmt = sqliteDb.prepare(sql);
                    stmt.bind(params);
                    const rows = [];
                    while (stmt.step()) {
                        rows.push(stmt.getAsObject());
                    }
                    stmt.free();
                    return rows;
                }
            };
        },
        exec: (sql) => {
            if (!sqliteDb) throw new Error('DB not initialized');
            sqliteDb.run(sql);
            db.saveDatabase();
        }
    };
}

module.exports = db;
