/**
 * 7-Eleven Shift Manager - Schedule Module
 * จัดการตารางงาน
 */

// ============================================
// State Variables
// ============================================

let currentView = 'day'; // 'day', 'week', 'month'
let currentDate = new Date();

// ============================================
// View Switching
// ============================================

/**
 * เปลี่ยนมุมมองตาราง
 */
function switchView(view) {
    currentView = view;

    // Update tab buttons
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.view === view) {
            tab.classList.add('active');
        }
    });

    // Show/hide views
    document.querySelectorAll('.schedule-view').forEach(v => {
        v.classList.add('hidden');
    });

    const viewEl = document.getElementById(`${view}View`);
    if (viewEl) {
        viewEl.classList.remove('hidden');
    }

    // Load appropriate view
    loadScheduleView();
}

/**
 * โหลดข้อมูลตามมุมมองที่เลือก
 */
function loadScheduleView() {
    updateDateDisplay();

    switch (currentView) {
        case 'day':
            loadDayView();
            break;
        case 'week':
            loadWeekView();
            break;
        case 'month':
            loadMonthView();
            break;
    }
}

// ============================================
// Date Navigation
// ============================================

/**
 * ไปวันก่อนหน้า/ถัดไป
 */
function navigateDate(direction) {
    switch (currentView) {
        case 'day':
            currentDate.setDate(currentDate.getDate() + direction);
            break;
        case 'week':
            currentDate.setDate(currentDate.getDate() + (direction * 7));
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() + direction);
            break;
    }
    loadScheduleView();
}

/**
 * กลับไปวันนี้
 */
function goToToday() {
    currentDate = new Date();
    loadScheduleView();
}

/**
 * อัพเดทการแสดงวันที่
 */
function updateDateDisplay() {
    const displayEl = document.getElementById('dateDisplay');
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const day = currentDate.getDate();
    const month = thaiMonths[currentDate.getMonth()];
    const year = currentDate.getFullYear() + 543;

    switch (currentView) {
        case 'day':
            displayEl.textContent = `${day} ${month} ${year}`;
            break;
        case 'week':
            const weekStart = getWeekStart(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            displayEl.textContent = `${weekStart.getDate()} - ${weekEnd.getDate()} ${month} ${year}`;
            break;
        case 'month':
            displayEl.textContent = `${month} ${year}`;
            break;
    }
}

/**
 * หาวันแรกของสัปดาห์
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
}

// ============================================
// Day View
// ============================================

/**
 * โหลดมุมมองรายวัน
 */
function loadDayView() {
    const dateStr = formatDateKey(currentDate);
    const schedule = getScheduleForDate(dateStr);

    // Morning
    const morningContent = document.getElementById('morningShiftContent');
    const morningCount = document.getElementById('morningCount');
    renderShiftContent(morningContent, schedule.morning, 'morning');
    morningCount.textContent = `${schedule.morning.length} คน`;

    // Afternoon
    const afternoonContent = document.getElementById('afternoonShiftContent');
    const afternoonCount = document.getElementById('afternoonCount');
    renderShiftContent(afternoonContent, schedule.afternoon, 'afternoon');
    afternoonCount.textContent = `${schedule.afternoon.length} คน`;

    // Night
    const nightContent = document.getElementById('nightShiftContent');
    const nightCount = document.getElementById('nightCount');
    renderShiftContent(nightContent, schedule.night, 'night');
    nightCount.textContent = `${schedule.night.length} คน`;
}

/**
 * Render เนื้อหาในแต่ละกะ
 */
function renderShiftContent(container, shiftData, shiftType) {
    if (!shiftData || shiftData.length === 0) {
        container.innerHTML = `
      <div class="empty-shift">
        <i class="fas fa-user-slash"></i>
        <p>ยังไม่มีพนักงานในกะนี้</p>
      </div>
    `;
        return;
    }

    let html = '';

    shiftData.forEach(item => {
        const employee = EMPLOYEES.find(e => e.id === item.employeeId);
        if (!employee) return;

        const taskTags = item.tasks.map(taskId => {
            const task = TASK_TYPES.find(t => t.id === taskId);
            if (!task) return '';
            return `<span class="task-tag"><i class="fas fa-check"></i> ${task.name}</span>`;
        }).join('');

        html += `
      <div class="shift-employee">
        <div class="avatar">${employee.avatar}</div>
        <div class="shift-employee-info">
          <h4>${employee.name}</h4>
          <div class="shift-employee-tasks">
            ${taskTags || '<span class="text-muted">ไม่มีงานที่ได้รับมอบหมาย</span>'}
          </div>
        </div>
        ${isManager() ? `
          <div class="shift-employee-actions">
            <button class="btn-edit" onclick="editShift(${employee.id}, '${shiftType}')" title="แก้ไข">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" onclick="deleteShift(${employee.id}, '${shiftType}')" title="ลบ">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
    });

    container.innerHTML = html;
}

// ============================================
// Week View
// ============================================

/**
 * โหลดมุมมองรายสัปดาห์
 */
function loadWeekView() {
    const weekBody = document.getElementById('weekBody');
    const weekStart = getWeekStart(currentDate);
    const today = new Date();

    let html = '';

    // Row for each shift type
    const shifts = [
        { type: 'morning', name: 'กะเช้า', time: '06:00-14:00' },
        { type: 'afternoon', name: 'กะบ่าย', time: '14:00-22:00' },
        { type: 'night', name: 'กะดึก', time: '22:00-06:00' }
    ];

    shifts.forEach(shift => {
        html += `<div class="week-row">`;
        html += `
      <div class="time-col">
        <strong>${shift.name}</strong>
        <span>${shift.time}</span>
      </div>
    `;

        // Each day of the week
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateStr = formatDateKey(date);
            const isToday = isSameDay(date, today);
            const schedule = getScheduleForDate(dateStr);
            const shiftData = schedule[shift.type] || [];

            html += `<div class="week-cell ${isToday ? 'today' : ''}">`;

            shiftData.forEach(item => {
                const employee = EMPLOYEES.find(e => e.id === item.employeeId);
                if (!employee) return;

                html += `
          <div class="week-employee ${shift.type}" onclick="showEmployeeDetail(${employee.id}, '${dateStr}', '${shift.type}')">
            <div class="mini-avatar">${employee.avatar}</div>
            <span>${employee.name.split(' ')[0]}</span>
          </div>
        `;
            });

            html += `</div>`;
        }

        html += `</div>`;
    });

    weekBody.innerHTML = html;
}

// ============================================
// Month View
// ============================================

/**
 * โหลดมุมมองรายเดือน
 */
function loadMonthView() {
    const monthGrid = document.getElementById('monthGrid');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    // Calendar header
    const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    let html = '<div class="month-header">';
    thaiDays.forEach(day => {
        html += `<div>${day}</div>`;
    });
    html += '</div>';

    html += '<div class="month-body">';

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Previous month days
    const prevMonthLast = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLast.getDate() - i;
        html += `<div class="month-day other-month"><div class="month-day-header"><span class="month-day-number">${day}</span></div></div>`;
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDateKey(date);
        const isToday = isSameDay(date, today);
        const schedule = getScheduleForDate(dateStr);

        const hasMorning = schedule.morning && schedule.morning.length > 0;
        const hasAfternoon = schedule.afternoon && schedule.afternoon.length > 0;
        const hasNight = schedule.night && schedule.night.length > 0;

        html += `
      <div class="month-day ${isToday ? 'today' : ''}" onclick="viewDayDetail(${year}, ${month}, ${day})">
        <div class="month-day-header">
          <span class="month-day-number">${day}</span>
          <div class="month-shift-count">
            ${hasMorning ? '<div class="shift-dot morning"></div>' : ''}
            ${hasAfternoon ? '<div class="shift-dot afternoon"></div>' : ''}
            ${hasNight ? '<div class="shift-dot night"></div>' : ''}
          </div>
        </div>
      </div>
    `;
    }

    // Next month days
    const remainingCells = 42 - (startDay + totalDays);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="month-day other-month"><div class="month-day-header"><span class="month-day-number">${day}</span></div></div>`;
    }

    html += '</div>';

    monthGrid.innerHTML = html;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format date key (YYYY-MM-DD)
 */
function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

/**
 * Get schedule for a specific date
 */
function getScheduleForDate(dateStr) {
    // For demo, return TODAY_SCHEDULE for any date
    // In production, this would fetch from API
    const today = formatDateKey(new Date());
    if (dateStr === today) {
        return TODAY_SCHEDULE;
    }

    // Generate random schedule for other dates
    const seed = dateStr.split('-').reduce((a, b) => a + parseInt(b), 0);
    const random = (n) => ((seed * 9301 + 49297) % 233280) / 233280 * n;

    return {
        morning: random(100) > 50 ? [{ employeeId: 2, tasks: [1, 3, 7] }] : [],
        afternoon: random(100) > 40 ? [{ employeeId: 4, tasks: [7, 8] }] : [],
        night: random(100) > 60 ? [{ employeeId: 6, tasks: [5, 6] }] : []
    };
}

// ============================================
// Modal Functions
// ============================================

/**
 * เปิด Modal เพิ่มกะ
 */
function openAddShiftModal() {
    const modal = document.getElementById('addShiftModal');
    modal.classList.add('active');

    // Set default date
    document.getElementById('shiftDate').value = formatDateKey(currentDate);

    // Load employees
    const empSelect = document.getElementById('shiftEmployee');
    empSelect.innerHTML = '<option value="">เลือกพนักงาน</option>';
    EMPLOYEES.filter(e => e.role === 'employee').forEach(emp => {
        empSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
    });

    // Load tasks
    const taskContainer = document.getElementById('taskCheckboxes');
    taskContainer.innerHTML = '';
    TASK_TYPES.forEach(task => {
        taskContainer.innerHTML += `
      <div class="task-checkbox-item">
        <input type="checkbox" id="task_${task.id}" name="tasks" value="${task.id}">
        <label for="task_${task.id}">${task.name}</label>
      </div>
    `;
    });
}

/**
 * ปิด Modal เพิ่มกะ
 */
function closeAddShiftModal() {
    const modal = document.getElementById('addShiftModal');
    modal.classList.remove('active');
    document.getElementById('addShiftForm').reset();
}

/**
 * บันทึกกะใหม่
 */
async function saveShift(e) {
    e.preventDefault();

    const date = document.getElementById('shiftDate').value;
    const shiftType = document.getElementById('shiftType').value;
    const employeeId = parseInt(document.getElementById('shiftEmployee').value);

    // Validate
    if (!employeeId) {
        alert('กรุณาเลือกพนักงาน');
        return;
    }

    const tasks = [];
    document.querySelectorAll('input[name="tasks"]:checked').forEach(cb => {
        tasks.push(parseInt(cb.value));
    });

    try {
        const response = await fetch(`${API_BASE_URL}/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, shiftType, employeeId, tasks })
        });

        const result = await response.json();

        if (response.ok) {
            alert('บันทึกกะงานเรียบร้อย!');
            closeAddShiftModal();
            loadScheduleView();
        } else {
            alert('เกิดข้อผิดพลาด: ' + (result.error || result.message));
        }
    } catch (error) {
        console.error('Save shift error:', error);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
}

/**
 * แก้ไขกะ
 */
function editShift(employeeId, shiftType) {
    console.log('Edit shift:', employeeId, shiftType);
    openAddShiftModal();
    document.getElementById('shiftType').value = shiftType;
    document.getElementById('shiftEmployee').value = employeeId;
}

/**
 * ลบกะ
 */
function deleteShift(employeeId, shiftType) {
    if (confirm('ต้องการลบกะนี้หรือไม่?')) {
        console.log('Delete shift:', employeeId, shiftType);
        alert('ลบกะงานเรียบร้อย! (Demo Mode)');
        loadScheduleView();
    }
}

/**
 * ดูรายละเอียดวัน (จาก Month View)
 */
function viewDayDetail(year, month, day) {
    currentDate = new Date(year, month, day);
    switchView('day');
}

/**
 * แสดงรายละเอียดพนักงาน (จาก Week View)
 */
function showEmployeeDetail(employeeId, dateStr, shiftType) {
    const employee = EMPLOYEES.find(e => e.id === employeeId);
    if (employee) {
        alert(`${employee.name}\nกะ: ${shiftType}\nวันที่: ${dateStr}`);
    }
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('schedule.html')) {
        // Check manager access
        if (isManager()) {
            document.getElementById('managerActions').classList.remove('hidden');
        }

        // View tab click handlers
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                switchView(tab.dataset.view);
            });
        });

        // Date navigation handlers
        document.getElementById('prevDate').addEventListener('click', () => navigateDate(-1));
        document.getElementById('nextDate').addEventListener('click', () => navigateDate(1));
        document.getElementById('todayBtn').addEventListener('click', goToToday);

        // Form submission
        document.getElementById('addShiftForm').addEventListener('submit', saveShift);

        // Initial load
        loadScheduleView();
    }
});
