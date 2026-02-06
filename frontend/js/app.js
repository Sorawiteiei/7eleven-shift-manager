/**
 * 7-Eleven Shift Manager - Main Application
 * จัดการ dashboard และตารางงาน (Connected to API)
 */

// ============================================
// Constants & State
// ============================================

const SHIFT_TYPES = {
    morning: { name: 'กะเช้า', time: '06:00 - 14:00', icon: 'sun', color: 'morning' },
    afternoon: { name: 'กะบ่าย', time: '14:00 - 22:00', icon: 'cloud-sun', color: 'afternoon' },
    night: { name: 'กะดึก', time: '22:00 - 06:00', icon: 'moon', color: 'night' }
};

let dashboardData = {
    employees: [],
    todayShifts: { morning: [], afternoon: [], night: [] },
    stats: { totalEmployees: 0, todayShiftsPoints: 0, weeklyShiftsPoints: 0, pendingTasks: 0 }
};

// ============================================
// Dashboard Functions
// ============================================

/**
 * โหลดข้อมูล dashboard
 */
async function loadDashboard() {
    try {
        await Promise.all([
            fetchEmployees(),
            fetchTodaySchedule(),
            fetchStats()
        ]);

        renderDashboard();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function fetchEmployees() {
    try {
        const res = await fetch(`${API_BASE_URL}/employees`);
        if (res.ok) dashboardData.employees = await res.json();
    } catch (e) { console.error('Fetch employees failed', e); }
}

async function fetchTodaySchedule() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`${API_BASE_URL}/shifts/date/${today}`);
        if (res.ok) dashboardData.todayShifts = await res.json(); // { morning: [], afternoon: [], night: [] }
    } catch (e) { console.error('Fetch shifts failed', e); }
}

async function fetchStats() {
    // Placeholder for future stats API
}

/**
 * Render Dashboard Elements
 */
function renderDashboard() {
    loadStatsUI();
    loadTodayScheduleUI();
    loadMyTasks();
}

/**
 * แสดงสถิติบนหน้าจอ
 */
function loadStatsUI() {
    // Total employees
    document.getElementById('totalEmployees').textContent = dashboardData.employees.length;

    // Today's shifts count
    const todayCount =
        (dashboardData.todayShifts.morning?.length || 0) +
        (dashboardData.todayShifts.afternoon?.length || 0) +
        (dashboardData.todayShifts.night?.length || 0);
    document.getElementById('todayShifts').textContent = todayCount;

    // Weekly shifts (placeholder)
    document.getElementById('weeklyShifts').textContent = '-';

    // Pending tasks
    document.getElementById('pendingTasks').textContent = '-';
}

/**
 * แสดงตารางงานวันนี้
 */
function loadTodayScheduleUI() {
    // Morning
    const morningEl = document.getElementById('morningEmployees');
    morningEl.innerHTML = renderShiftEmployees(dashboardData.todayShifts.morning);

    // Afternoon
    const afternoonEl = document.getElementById('afternoonEmployees');
    afternoonEl.innerHTML = renderShiftEmployees(dashboardData.todayShifts.afternoon);

    // Night
    const nightEl = document.getElementById('nightEmployees');
    nightEl.innerHTML = renderShiftEmployees(dashboardData.todayShifts.night);
}

/**
 * Render พนักงานในแต่ละกะ
 */
function renderShiftEmployees(shiftList) {
    if (!shiftList || shiftList.length === 0) {
        return '<p class="text-center" style="color: #9CA3AF; padding: 1rem;">ไม่มีพนักงานในกะนี้</p>';
    }

    return shiftList.map(shift => {
        // shift object from API
        const tasks = shift.tasks ? shift.tasks.map(t => t.name).join(', ') : '';
        const avatar = shift.employee_avatar || (shift.employee_name ? shift.employee_name.charAt(0) : '?');

        return `
      <div class="employee-chip" title="งาน: ${tasks}">
        <div class="avatar">${avatar}</div>
        <span>${shift.employee_name}</span>
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

    // Find my shifts in today's data (flatten structure)
    let myShifts = [];
    ['morning', 'afternoon', 'night'].forEach(type => {
        const shifts = dashboardData.todayShifts[type] || [];
        const found = shifts.find(s => s.user_id === user.id || s.employee_name === user.name);
        if (found) {
            found.shiftTypeRaw = type;
            myShifts.push(found);
        }
    });

    if (myShifts.length === 0) {
        myTasksEl.innerHTML = '<p class="text-center" style="color: #9CA3AF; padding: 2rem;">ไม่มีงานที่ได้รับมอบหมายในวันนี้</p>';
        return;
    }

    let html = '';

    myShifts.forEach(shift => {
        const shiftTypeInfo = SHIFT_TYPES[shift.shiftTypeRaw];

        html += `
      <div class="shift-tasks-section" style="margin-bottom: 1.5rem;">
        <div class="shift-badge ${shiftTypeInfo.color}" style="margin-bottom: 0.75rem; display: inline-block; padding: 0.5rem 1rem;">
          <i class="fas fa-${shiftTypeInfo.icon}"></i>
          ${shiftTypeInfo.name} (${shiftTypeInfo.time})
        </div>
        <div class="task-list">
    `;

        if (shift.tasks && shift.tasks.length > 0) {
            shift.tasks.forEach((task, index) => {
                const isCompleted = task.is_completed === 1;
                html += `
            <div class="task-item">
              <div class="task-checkbox ${isCompleted ? 'completed' : ''}" 
                   onclick="toggleTask(this, ${shift.id}, ${task.id})" 
                   data-completed="${isCompleted}">
                <i class="fas fa-check" style="display: ${isCompleted ? 'block' : 'none'};"></i>
              </div>
              <div class="task-info">
                <h4>${task.name}</h4>
                <p>งานที่ได้รับมอบหมาย</p>
              </div>
              <div class="task-time">
                <i class="fas fa-clock"></i>
                #${index + 1}
              </div>
            </div>
            `;
            });
        } else {
            html += `<p style="color:#aaa; padding:10px;">ไม่มีรายการงานย่อย</p>`;
        }

        html += '</div></div>';
    });

    myTasksEl.innerHTML = html;
}

/**
 * Toggle task completion (API connected)
 */
async function toggleTask(element, shiftId, taskId) {
    const isCompleted = element.classList.contains('completed');
    const newState = !isCompleted;

    // Optimistic UI update
    element.classList.toggle('completed');
    const icon = element.querySelector('i');
    icon.style.display = newState ? 'block' : 'none';

    try {
        // Call API
        const res = await fetch(`${API_BASE_URL}/shifts/${shiftId}/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: newState })
        });

        if (!res.ok) {
            // Revert if failed
            element.classList.toggle('completed');
            icon.style.display = isCompleted ? 'block' : 'none';
            console.error('Failed to update task status');
        }
    } catch (e) {
        console.error('Network error:', e);
        // Revert
        element.classList.toggle('completed');
        icon.style.display = isCompleted ? 'block' : 'none';
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
