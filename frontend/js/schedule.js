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
/**
 * โหลดข้อมูลตามมุมมองที่เลือก (Async)
 */
async function loadScheduleView() {
    updateDateDisplay();

    // Fetch master data first if not loaded
    if (!window.employeesMap) {
        try {
            const res = await fetch(`${API_BASE_URL}/employees`);
            const emps = await res.json();
            window.employeesMap = {};
            emps.forEach(e => window.employeesMap[e.id] = e);
        } catch (e) { console.error('Load employees failed', e); }
    }

    if (!window.tasksMap) {
        try {
            const res = await fetch(`${API_BASE_URL}/tasks`);
            const tasks = await res.json();
            window.tasksMap = {};
            tasks.forEach(t => window.tasksMap[t.id] = t);
        } catch (e) { console.error('Load tasks failed', e); }
    }

    // Determine date range to fetch
    let start, end;
    if (currentView === 'day') {
        const d = formatDateKey(currentDate);
        start = d; end = d;
    } else if (currentView === 'week') {
        const s = getWeekStart(currentDate);
        start = formatDateKey(s);
        const e = new Date(s); e.setDate(e.getDate() + 6);
        end = formatDateKey(e);
    } else {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        start = formatDateKey(new Date(y, m, 1));
        end = formatDateKey(new Date(y, m + 1, 0));
    }

    // Fetch shifts
    try {
        const res = await fetch(`${API_BASE_URL}/shifts?start=${start}&end=${end}`);
        const shifts = await res.json();

        // Organize shifts by date -> type
        window.scheduleData = {};

        // Ensure the current view date exists at least as empty
        // logic to populate window.scheduleData
        // API returns array of shifts, we must group them
        shifts.forEach(s => {
            const date = s.shift_date.split('T')[0];
            if (!window.scheduleData[date]) {
                window.scheduleData[date] = { morning: [], afternoon: [], night: [], custom: [] };
            }

            // Add to list if valid type (custom included)
            if (window.scheduleData[date][s.shift_type]) {
                // Formatting for frontend usage
                window.scheduleData[date][s.shift_type].push({
                    id: s.id,
                    employeeId: s.user_id,
                    tasks: s.tasks ? s.tasks.map(t => t.id) : [],
                    // Custom fields
                    customName: s.custom_name,
                    startTime: s.start_time,
                    endTime: s.end_time
                });
            }
        });

    } catch (e) {
        console.error('Fetch shifts failed', e);
        window.scheduleData = {};
    }

    // Render logic
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

    // Special / Custom
    const specialContent = document.getElementById('specialShiftContent');
    const specialCount = document.getElementById('specialCount');
    const specialCard = document.getElementById('specialShiftCard');

    if (schedule.custom && schedule.custom.length > 0) {
        specialCard.style.display = 'block';
        renderShiftContent(specialContent, schedule.custom, 'custom');
        specialCount.textContent = `${schedule.custom.length} คน`;
    } else {
        specialCard.style.display = 'none';
        specialContent.innerHTML = '';
    }
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
        // Use loaded map
        const employee = window.employeesMap ? window.employeesMap[item.employeeId] : null;
        if (!employee) return;

        const taskTags = item.tasks.map(taskId => {
            const task = window.tasksMap ? window.tasksMap[taskId] : null;
            if (!task) return '';
            return `<span class="task-tag"><i class="fas fa-check"></i> ${task.name}</span>`;
        }).join('');

        // Custom shift display info
        let subTitle = '';
        if (shiftType === 'custom') {
            subTitle = `<div style="font-size: 0.8em; color: #7c3aed; margin-top: 2px;">
                <strong>${item.customName || 'กะพิเศษ'}</strong> 
                (${item.startTime} - ${item.endTime})
            </div>`;
        }

        html += `
       <div class="shift-employee">
        <div class="avatar">${employee.avatar || employee.name.charAt(0)}</div>
        <div class="shift-employee-info">
          <h4>${employee.name}</h4>
          ${subTitle}
          <div class="shift-employee-tasks">
            ${taskTags || '<span class="text-muted">ไม่มีงานที่ได้รับมอบหมาย</span>'}
          </div>
        </div>
        ${isManager() ? `
          <div class="shift-employee-actions">
            <!-- Pass shift ID for real operations -->
            <button class="btn-edit" onclick="editShift(${item.id})" title="แก้ไข">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" onclick="deleteShift(${item.id})" title="ลบ">
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
                // Use loaded map
                const employee = window.employeesMap ? window.employeesMap[item.employeeId] : null;
                if (!employee) return;

                html += `
          <div class="week-employee ${shift.type}" onclick="showEmployeeDetail(${employee.id}, '${dateStr}', '${shift.type}')">
            <div class="mini-avatar">${employee.avatar || employee.name.charAt(0)}</div>
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
/**
 * Get schedule for a specific date
 */
function getScheduleForDate(dateStr) {
    // Return data from global state if available, otherwise empty
    if (window.scheduleData && window.scheduleData[dateStr]) {
        return window.scheduleData[dateStr];
    }
    return { morning: [], afternoon: [], night: [] };
}

// ============================================
// Modal Functions
// ============================================

/**
 * เปิด Modal เพิ่มกะ
 */
/**
 * เปิด Modal เพิ่มกะ
 */
async function openAddShiftModal() {
    const modal = document.getElementById('addShiftModal');
    modal.classList.add('active');

    // Set default date
    document.getElementById('shiftDate').value = formatDateKey(currentDate);

    // Load employees and tasks from API
    try {
        const [empRes, taskRes] = await Promise.all([
            fetch(`${API_BASE_URL}/employees`),
            fetch(`${API_BASE_URL}/tasks`)
        ]);

        const employees = await empRes.json();
        const tasks = await taskRes.json();

        // Load employees
        const empSelect = document.getElementById('shiftEmployee');
        empSelect.innerHTML = '<option value="">เลือกพนักงาน</option>';

        employees.forEach(emp => {
            // Show all users, or filter if needed. The backend usually returns active users.
            empSelect.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.employee_id})</option>`;
        });

        // Load tasks
        const taskContainer = document.getElementById('taskCheckboxes');
        taskContainer.innerHTML = '';

        tasks.forEach(task => {
            taskContainer.innerHTML += `
            <div class="task-checkbox-item">
                <input type="checkbox" id="task_${task.id}" name="tasks" value="${task.id}">
                <label for="task_${task.id}">${task.name}</label>
            </div>
            `;
        });

    } catch (error) {
        console.error('Error loading modal data:', error);
        alert('ไม่สามารถโหลดข้อมูลพนักงานหรือหน้าที่งานได้');
    }
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
/**
 * Toggle Custom Shift Fields
 */
function toggleCustomShiftFields() {
    const type = document.getElementById('shiftType').value;
    const customFields = document.getElementById('customShiftFields');
    const requiredInputs = customFields.querySelectorAll('input');

    if (type === 'custom') {
        customFields.style.display = 'block';
        requiredInputs.forEach(input => input.required = true);
    } else {
        customFields.style.display = 'none';
        requiredInputs.forEach(input => input.required = false);
    }
}

/**
 * บันทึกกะใหม่
 */
async function saveShift(e) {
    e.preventDefault();

    const date = document.getElementById('shiftDate').value; // note: backend expects shiftDate (camelCase) in body? Check route. Route: `const { userId, shiftDate, ... } = req.body;`
    // Front end sends: `body: JSON.stringify({ date, shiftType, employeeId, tasks })`. 
    // Wait, backend expects `shiftDate`.
    // Existing code sent `date`. Let's verify if existing backend code handles `date` or `shiftDate`.
    // Checking previous backend file view: `const { userId, shiftDate, shiftType... } = req.body`.
    // But frontend sends `date`. Mismatch? 
    // Ah, likely I missed something or it was working because I didn't verify backend fully?
    // Let's send `shiftDate: date`.

    const shiftType = document.getElementById('shiftType').value;
    const employeeId = parseInt(document.getElementById('shiftEmployee').value);

    let customName, startTime, endTime;
    if (shiftType === 'custom') {
        customName = document.getElementById('customName').value;
        startTime = document.getElementById('startTime').value;
        endTime = document.getElementById('endTime').value;

        if (!processTime(startTime) || !processTime(endTime)) {
            // validate?
        }
    }

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
        const payload = {
            userId: employeeId,
            shiftDate: date,
            shiftType,
            tasks,
            notes: '', // Added notes field
            customName: customName || null,
            startTime: startTime || null,
            endTime: endTime || null
        };

        console.log('Sending payload:', payload);

        const response = await fetch(`${API_BASE_URL}/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert('บันทึกกะงานเรียบร้อย!');
            closeAddShiftModal();
            loadScheduleView();
        } else {
            console.error('Server error:', result);
            alert('เกิดข้อผิดพลาด: ' + (result.error || result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Save shift error:', error);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
}

function processTime(t) { return t; } // Dummy helper if needed

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
/**
 * ลบกะ
 */
async function deleteShift(shiftId) {
    if (confirm('ต้องการลบกะนี้หรือไม่?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('ลบกะงานเรียบร้อย!');
                loadScheduleView();
            } else {
                const result = await response.json();
                alert('เกิดข้อผิดพลาด: ' + (result.error || 'ไม่สามารถลบได้'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
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
    const employee = window.employeesMap ? window.employeesMap[employeeId] : null;
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
