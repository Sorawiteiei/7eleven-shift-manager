/**
 * 7-Eleven Shift Manager - Reports Module
 * รายงานและสถิติ
 */

// ============================================
// State Variables
// ============================================

let currentPeriod = 'week';

// ============================================
// Demo Data
// ============================================

const PERFORMANCE_DATA = [
  { id: 2, name: 'สมชาย ใจดี', avatar: 'ส', shifts: 12, hours: 96, tasksCompleted: 98, score: 'excellent' },
  { id: 3, name: 'สมหญิง รักงาน', avatar: 'ส', shifts: 10, hours: 80, tasksCompleted: 95, score: 'excellent' },
  { id: 4, name: 'วิชัย มั่นคง', avatar: 'ว', shifts: 8, hours: 64, tasksCompleted: 92, score: 'good' },
  { id: 5, name: 'นิดา สุขใจ', avatar: 'น', shifts: 7, hours: 56, tasksCompleted: 88, score: 'good' },
  { id: 6, name: 'ประสิทธิ์ เก่งงาน', avatar: 'ป', shifts: 5, hours: 40, tasksCompleted: 85, score: 'average' },
];

const RECENT_ACTIVITIES = [
  { type: 'shift', icon: 'calendar-check', title: 'สมชาย ใจดี เข้ากะเช้า', time: '08:00', date: 'วันนี้' },
  { type: 'task', icon: 'check-circle', title: 'เช็คสต๊อก เสร็จสมบูรณ์', time: '09:30', date: 'วันนี้' },
  { type: 'shift', icon: 'calendar-check', title: 'วิชัย มั่นคง เข้ากะบ่าย', time: '14:00', date: 'วันนี้' },
  { type: 'task', icon: 'check-circle', title: 'รับของจาก DC เสร็จสมบูรณ์', time: '15:30', date: 'วันนี้' },
  { type: 'employee', icon: 'user-plus', title: 'เพิ่มพนักงานใหม่: สุดา รักดี', time: '10:00', date: 'เมื่อวาน' },
  { type: 'shift', icon: 'calendar-times', title: 'นิดา สุขใจ ลางาน', time: '-', date: 'เมื่อวาน' },
];

// ============================================
// Load Report Data
// ============================================

/**
 * โหลดข้อมูลรายงาน
 */
function loadReports() {
  loadPerformanceTable();
  loadActivityList();
}

/**
 * โหลดตารางผลงานพนักงาน
 */
function loadPerformanceTable() {
  const tbody = document.getElementById('performanceTableBody');

  let html = '';

  PERFORMANCE_DATA.forEach(emp => {
    const scoreLabel = {
      excellent: { text: 'ยอดเยี่ยม', icon: 'star' },
      good: { text: 'ดี', icon: 'thumbs-up' },
      average: { text: 'ปานกลาง', icon: 'minus' }
    };

    const score = scoreLabel[emp.score];

    html += `
      <tr>
        <td>
          <div class="table-avatar">${emp.avatar}</div>
          <span>${emp.name}</span>
        </td>
        <td>${emp.shifts} กะ</td>
        <td>${emp.hours} ชม.</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div class="progress-bar" style="width: 100px;">
              <div class="progress-fill ${emp.tasksCompleted >= 95 ? 'green' : 'orange'}" style="width: ${emp.tasksCompleted}%;"></div>
            </div>
            <span>${emp.tasksCompleted}%</span>
          </div>
        </td>
        <td>
          <span class="score-badge ${emp.score}">
            <i class="fas fa-${score.icon}"></i>
            ${score.text}
          </span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * โหลดรายการกิจกรรม
 */
function loadActivityList() {
  const listEl = document.getElementById('activityList');

  let html = '';

  RECENT_ACTIVITIES.forEach(activity => {
    html += `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          <i class="fas fa-${activity.icon}"></i>
        </div>
        <div class="activity-content">
          <h4>${activity.title}</h4>
          <p>${activity.date}</p>
        </div>
        <span class="activity-time">${activity.time}</span>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// ============================================
// Period Selection
// ============================================

/**
 * เปลี่ยนช่วงเวลา
 */
function changePeriod(period) {
  currentPeriod = period;

  // Update tabs
  document.querySelectorAll('.period-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.period === period) {
      tab.classList.add('active');
    }
  });

  // Show/hide custom date range
  const customRange = document.getElementById('customDateRange');
  if (period === 'custom') {
    customRange.classList.remove('hidden');
  } else {
    customRange.classList.add('hidden');
    // Reload data for selected period
    updateReportData(period);
  }
}

/**
 * อัพเดทข้อมูลตามช่วงเวลา
 */
function updateReportData(period) {
  // In production, this would fetch data from API
  console.log('Loading data for period:', period);

  // Update stats based on period (demo values)
  if (period === 'week') {
    document.getElementById('totalShifts').textContent = '42';
    document.getElementById('totalHours').textContent = '336';
    document.getElementById('avgHours').textContent = '48';
    document.getElementById('completedTasks').textContent = '95%';
  } else if (period === 'month') {
    document.getElementById('totalShifts').textContent = '168';
    document.getElementById('totalHours').textContent = '1,344';
    document.getElementById('avgHours').textContent = '192';
    document.getElementById('completedTasks').textContent = '93%';
  }
}

/**
 * ใช้ช่วงวันที่กำหนดเอง
 */
function applyDateRange() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    alert('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    alert('วันที่เริ่มต้นต้องอยู่ก่อนวันที่สิ้นสุด');
    return;
  }

  console.log('Loading data for range:', startDate, 'to', endDate);
  // In production, this would fetch data from API
  alert(`กำลังโหลดข้อมูลตั้งแต่ ${startDate} ถึง ${endDate}`);
}

/**
 * ส่งออกรายงาน
 */
function exportReport() {
  // In production, this would generate an Excel file
  alert('กำลังส่งออกรายงานเป็นไฟล์ Excel... (Demo Mode)');
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('reports.html')) {
    // Period tab click handlers
    document.querySelectorAll('.period-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        changePeriod(tab.dataset.period);
      });
    });

    // Set default dates for custom range
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = lastWeek;

    // Initial load
    loadReports();
  }
});
