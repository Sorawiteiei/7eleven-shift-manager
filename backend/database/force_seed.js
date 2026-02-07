const db = require('./db');
const { setupDatabase } = require('./setup');
const fs = require('fs');
const path = require('path');

async function forceSeed() {
    console.log('🔄 Starting Force Seed Operation...');

    try {
        // 1. Init DB
        await db.initDatabase();

        // 2. Clear existing users (Action: Execute SQL)
        console.log('⚡ Clearing existing users...');

        // Check if users table exists before trying to delete
        try {
            await db.exec('DELETE FROM users');
            console.log('✅ Users table cleared.');
        } catch (e) {
            console.log('ℹ️  Users table might not exist yet, skipping update.');
        }

        // 3. Re-run setup (which will seed because count is now 0)
        console.log('🌱 Reseeding database...');
        await setupDatabase();

        console.log('🎉 Force seed complete! You now have 10 users.');
    } catch (error) {
        console.error('❌ Error during force seed:', error);
    }
}

forceSeed();
