/**
 * 7-Eleven Shift Manager - Main Application
 * จัดการ dashboard และตารางงาน
 */

// ============================================
// Demo Data (จะย้ายไป database ภายหลัง)
// ============================================

// พนักงานทั้งหมด
const EMPLOYEES = [
    { id: 1, name: 'ผู้จัดการร้าน', role: 'manager', avatar: 'M', phone: '081-234-5678' },
    { id: 2, name: 'สมชาย ใจดี', role: 'employee', avatar: 'ส', phone: '082-345-6789' },
    { id: 3, name: 'สมหญิง รักงาน', role: 'employee', avatar: 'ส', phone: '083-456-7890' },
    { id: 4, name: 'วิชัย มั่นคง', role: 'employee', avatar: 'ว', phone: '084-567-8901' },
    { id: 5, name: 'นิดา สุขใจ', role: 'employee', avatar: 'น', phone: '085-678-9012' },
    { id: 6, name: 'ประสิทธิ์ เก่งงาน', role: 'employee', avatar: 'ป', phone: '086-789-0123' },
];

// ประเภทกะ
const SHIFT_TYPES = {
    morning: { name: 'กะเช้า', time: '06:00 - 14:00', icon: 'sun', color: 'morning' },
    afternoon: { name: 'กะบ่าย', time: '14:00 - 22:00', icon: 'cloud-sun', color: 'afternoon' },
    night: { name: 'กะดึก', time: '22:00 - 06:00', icon: 'moon', color: 'night' }
};

// หน้าที่งาน (จะให้ user กำหนดเพิ่มเติมได้)
const TASK_TYPES = [
    { id: 1, name: 'เปิดร้าน', description: 'เตรียมร้านก่อนเปิดขาย', shift: 'morning' },
    { id: 2, name: 'เช็คสต๊อก', description: 'ตรวจนับสินค้าในร้าน', shift: 'all' },
    { id: 3, name: 'รับของ', description: 'รับสินค้าจาก DC', shift: 'morning' },
    { id: 4, name: 'จัดเรียงสินค้า', description: 'จัดเรียงสินค้าบนชั้นวาง', shift: 'all' },
    { id: 5, name: 'ทำความสะอาด', description: 'ทำความสะอาดพื้นที่ร้าน', shift: 'all' },
    { id: 6, name: 'ปิดร้าน', description: 'ปิดร้านและสรุปยอด', shift: 'night' },
    { id: 7, name: 'แคชเชียร์', description: 'รับชำระเงินที่เคาน์เตอร์', shift: 'all' },
    { id: 8, name: 'ทำอาหาร', description: 'เตรียมอาหารสด เช่น ข้าวกล่อง', shift: 'all' },
    { id: 9, name: 'ชงกาแฟ', description: 'บริการเครื่องดื่ม All Cafe', shift: 'all' },
    { id: 10, name: 'เติมสินค้า', description: 'เติมสินค้าในตู้แช่และชั้นวาง', shift: 'all' },
];

// ตารางงานตัวอย่าง (วันนี้)
const TODAY_SCHEDULE = {
    morning: [
        { employeeId: 2, tasks: [1, 3, 7] },
        { employeeId: 3, tasks: [2, 4, 9] },
    ],
    afternoon: [
        { employeeId: 4, tasks: [7, 8, 10] },
        { employeeId: 5, tasks: [4, 5, 9] },
    ],
    night: [
        { employeeId: 6, tasks: [7, 5, 6] },
        { employeeId: 2, tasks: [10, 6] },
    ]
};

// ============================================
// Dashboard Functions
// ============================================

/**
 * โหลดข้อมูล dashboard
 */
function loadDashboard() {
    loadStats();
    loadTodaySchedule();
    loadMyTasks();
}

/**
 * โหลดสถิติ
 */
function loadStats() {
    // Total employees
    document.getElementById('totalEmployees').textContent = EMPLOYEES.length;

    // Today's shifts count
    const todayShiftsCount =
        TODAY_SCHEDULE.morning.length +
        TODAY_SCHEDULE.afternoon.length +
        TODAY_SCHEDULE.night.length;
    document.getElementById('todayShifts').textContent = todayShiftsCount;

    // Weekly shifts (mock data)
    document.getElementById('weeklyShifts').textContent = todayShiftsCount * 7;

    // Pending tasks
    document.getElementById('pendingTasks').textContent = 3;
}

/**
 * โหลดตารางงานวันนี้
 */
function loadTodaySchedule() {
    // Morning shift
    const morningEl = document.getElementById('morningEmployees');
    morningEl.innerHTML = renderShiftEmployees(TODAY_SCHEDULE.morning);

    // Afternoon shift
    const afternoonEl = document.getElementById('afternoonEmployees');
    afternoonEl.innerHTML = renderShiftEmployees(TODAY_SCHEDULE.afternoon);

    // Night shift
    const nightEl = document.getElementById('nightEmployees');
    nightEl.innerHTML = renderShiftEmployees(TODAY_SCHEDULE.night);
}

/**
 * Render พนักงานในแต่ละกะ
 */
function renderShiftEmployees(shiftData) {
    if (!shiftData || shiftData.length === 0) {
        return '<p class="text-center" style="color: #9CA3AF; padding: 1rem;">ไม่มีพนักงานในกะนี้</p>';
    }

    return shiftData.map(item => {
        const employee = EMPLOYEES.find(e => e.id === item.employeeId);
        if (!employee) return '';

        const taskNames = item.tasks.map(taskId => {
            const task = TASK_TYPES.find(t => t.id === taskId);
            return task ? task.name : '';
        }).filter(Boolean).join(', ');

        return `
      <div class="employee-chip" title="งาน: ${taskNames}">
        <div class="avatar">${employee.avatar}</div>
        <span>${employee.name}</span>
      </div>
    `;
    }).join('');
}

/**
 * โหลดงานของฉัน (สำหรับพนักงาน)
 */
function loadMyTasks() {
    const user = getCurrentUser();
    if (!user) return;

    const myTasksEl = document.getElementById('myTasks');
    const myTasksSectionEl = document.getElementById('myTasksSection');

    // หา schedule ของ user ปัจจุบัน
    let mySchedule = [];

    for (const [shiftType, shiftData] of Object.entries(TODAY_SCHEDULE)) {
        const userShift = shiftData.find(s => {
            const emp = EMPLOYEES.find(e => e.id === s.employeeId);
            return emp && emp.name === user.name;
        });

        if (userShift) {
            mySchedule.push({
                shift: SHIFT_TYPES[shiftType],
                tasks: userShift.tasks.map(taskId => TASK_TYPES.find(t => t.id === taskId)).filter(Boolean)
            });
        }
    }

    if (mySchedule.length === 0) {
        myTasksEl.innerHTML = '<p class="text-center" style="color: #9CA3AF; padding: 2rem;">ไม่มีงานที่ได้รับมอบหมายในวันนี้</p>';
        return;
    }

    let html = '';

    mySchedule.forEach(schedule => {
        html += `
      <div class="shift-tasks-section" style="margin-bottom: 1.5rem;">
        <div class="shift-badge ${schedule.shift.color}" style="margin-bottom: 0.75rem; display: inline-block; padding: 0.5rem 1rem;">
          <i class="fas fa-${schedule.shift.icon}"></i>
          ${schedule.shift.name} (${schedule.shift.time})
        </div>
        <div class="task-list">
    `;

        schedule.tasks.forEach((task, index) => {
            html += `
        <div class="task-item">
          <div class="task-checkbox" onclick="toggleTask(this)" data-task-id="${task.id}">
            <i class="fas fa-check" style="display: none;"></i>
          </div>
          <div class="task-info">
            <h4>${task.name}</h4>
            <p>${task.description}</p>
          </div>
          <div class="task-time">
            <i class="fas fa-clock"></i>
            งานที่ ${index + 1}
          </div>
        </div>
      `;
        });

        html += '</div></div>';
    });

    myTasksEl.innerHTML = html;
}

/**
 * Toggle task completion
 */
function toggleTask(element) {
    element.classList.toggle('completed');
    const icon = element.querySelector('i');
    if (element.classList.contains('completed')) {
        icon.style.display = 'block';
    } else {
        icon.style.display = 'none';
    }
}

// ============================================
// Navigation Helpers
// ============================================

/**
 * Set active nav item
 */
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if on a protected page (not login)
    if (!window.location.pathname.includes('index.html')) {
        // Load dashboard if on dashboard page
        if (window.location.pathname.includes('dashboard.html')) {
            loadDashboard();
        }

        // Set active navigation
        setActiveNav();
    }
});
