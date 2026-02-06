const db = require('./db');

async function seedTasks() {
    console.log('📋 Seeding real 7-Eleven tasks...');

    await db.initDatabase();

    // Clear existing tasks to avoid duplicates? Or just insert new ones?
    // Let's truncate and re-seed for clean state as requested
    try {
        await db.exec('DELETE FROM tasks');
        console.log('🗑️  Cleared old tasks'); // Demo safe only
    } catch (e) { console.error(e); }

    const realTasks = [
        // General / All Shifts
        { name: 'ยืนเครื่องแคชเชียร์', desc: 'บริการคิดเงินและเสนอสินค้าโปรโมชั่น', icon: 'cash-register', shift: 'all' },
        { name: 'เติมสินค้า (Front Face)', desc: 'ดึงสินค้ามาด้านหน้าและเติมสินค้าที่ขาด', icon: 'boxes', shift: 'all' },
        { name: 'ดูแลความสะอาดร้าน', desc: 'กวาดถูพื้น เช็ดกระจก และเทขยะ', icon: 'broom', shift: 'all' },

        // Morning (06:00 - 14:00)
        { name: 'ตรวจสอบสินค้าหมดอายุ', desc: 'เช็คสินค้ากลุ่ม Fresh Food ที่หมดอายุช่วงเช้า', icon: 'search-minus', shift: 'morning' },
        { name: 'รับสินค้า DC', desc: 'ตรวจนับและรับเข้าสินค้าจากรถส่งของ (สาย)', icon: 'truck', shift: 'morning' },
        { name: 'เตรียมอาหารเช้า/อุ่นร้อน', desc: 'เตรียมจุดอุ่นร้อน ซาลาเปา ไส้กรอก', icon: 'utensils', shift: 'morning' },
        { name: 'เปิดร้าน/ชง All Café', desc: 'เตรียมเครื่องชงกาแฟและวัตถุดิบ', icon: 'coffee', shift: 'morning' },

        // Afternoon (14:00 - 22:00)
        { name: 'เติมตู้ Walk-in', desc: 'เติมน้ำเครื่องดื่มในตู้แช่เย็นด้านหลัง', icon: 'snowflake', shift: 'afternoon' },
        { name: 'เคลียร์ยอดเงิน/ส่งยอด', desc: 'รวบรวมเงิน ส่งยอดขายรายผลัด', icon: 'file-invoice-dollar', shift: 'afternoon' },
        { name: 'รับสินค้าช่วงบ่าย', desc: 'รับสินค้าประเภทนม/ขนมปัง (ถ้ามี)', icon: 'truck-loading', shift: 'afternoon' },

        // Night (22:00 - 06:00)
        { name: 'ตรวจนับสต็อก (Cycle Count)', desc: 'นับสต็อกสินค้าตามหมวดหมู่ประจำวัน', icon: 'clipboard-list', shift: 'night' },
        { name: 'ล้างเครื่อง All Café/Slurpee', desc: 'ถอดล้างทำความสะอาดเครื่องกดน้ำ/กาแฟ', icon: 'tint', shift: 'night' },
        { name: 'ทำความสะอาดใหญ่ (Deep Clean)', desc: 'ขัดพื้น ล้างถังขยะ เช็ดเชลฟ์', icon: 'soap', shift: 'night' },
        { name: 'เตรียมร้านรอบเช้า', desc: 'เตรียมแก้ว ถุง หลอด ให้พร้อมขายเช้า', icon: 'check-double', shift: 'night' }
    ];

    for (const task of realTasks) {
        try {
            await db.prepare(`
                INSERT INTO tasks (name, description, icon, shift_type)
                VALUES (?, ?, ?, ?)
            `).run(task.name, task.desc, task.icon, task.shift);
            console.log(`✅ Added task: ${task.name}`);
        } catch (e) {
            console.error(`Failed to add ${task.name}`, e);
        }
    }

    console.log('🎉 Tasks updated effectively!');
}

seedTasks().catch(console.error);
