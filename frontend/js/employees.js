/**
 * 7-Eleven Shift Manager - Employees Module
 * จัดการพนักงาน
 */

// ============================================
// State Variables
// ============================================

let employeesList = [...EMPLOYEES]; // Copy of employees for manipulation

// ============================================
// Load and Display Employees
// ============================================

/**
 * โหลดข้อมูลพนักงาน (จาก API)
 */
async function loadEmployees() {
  try {
    const response = await fetch(`${API_URL}/employees`);
    const data = await response.json();

    if (response.ok) {
      EMPLOYEES = data; // Update global store
      employeesList = [...EMPLOYEES];
      updateEmployeeStats();
      renderEmployeeGrid();
    } else {
      console.error('Failed to load employees:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

/**
 * อัพเดทสถิติพนักงาน
 */
function updateEmployeeStats() {
  const total = EMPLOYEES.length;
  const managers = EMPLOYEES.filter(e => e.role === 'manager').length;
  const staff = EMPLOYEES.filter(e => e.role === 'employee').length;

  // Additional stat: Part-time
  const partTime = EMPLOYEES.filter(e => e.employmentType === 'parttime').length;

  document.getElementById('totalEmployeesCount').textContent = total;
  document.getElementById('managersCount').textContent = managers;
  document.getElementById('staffCount').textContent = staff;

  // ถ้ามี element แสดงจำนวน Part-time
  // document.getElementById('partTimeCount').textContent = partTime; 
}

/**
 * Render employee grid
 */
function renderEmployeeGrid(employees = employeesList) {
  const grid = document.getElementById('employeeGrid');
  const countEl = document.getElementById('employeeListCount');

  countEl.textContent = `${employees.length} คน`;

  if (employees.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-user-slash"></i>
        <h4>ไม่พบพนักงาน</h4>
        <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
      </div>
    `;
    return;
  }

  let html = '';

  employees.forEach(emp => {
    // Employment Type Badge
    const isPartTime = emp.employmentType === 'parttime';
    const empTypeBadge = isPartTime
      ? `<span class="badge badge-warning" style="background:#ffc107; color:#333; font-size:10px; padding:2px 6px; border-radius:10px; margin-left:5px;">PART-TIME</span>`
      : '';

    html += `
      <div class="employee-card-container" onclick="viewEmployee(${emp.id})">
        <div class="employee-card-top">
          <div class="employee-avatar-large ${emp.role}">${emp.avatar || emp.name.charAt(0)}</div>
          <div class="employee-main-info">
            <h4>${emp.name} ${empTypeBadge}</h4>
            <span class="employee-role-badge ${emp.role}">
              <i class="fas fa-${emp.role === 'manager' ? 'user-tie' : 'user'}"></i>
              ${emp.role === 'manager' ? 'ผู้จัดการ' : 'พนักงาน'}
            </span>
          </div>
        </div>
        
        <div class="employee-card-info">
          <div class="employee-info-item">
            <i class="fas fa-id-card"></i>
            <span>รหัส: ${emp.employeeId || 'EMP---'}</span>
          </div>
          <div class="employee-info-item">
            <i class="fas fa-phone"></i>
            <span>${emp.phone || '-'}</span>
          </div>
        </div>
        
        ${isManager() ? `
          <div class="employee-card-actions" onclick="event.stopPropagation()">
            <button class="btn-view" onclick="viewEmployee(${emp.id})">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-edit-emp" onclick="editEmployee(${emp.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete-emp" onclick="deleteEmployee(${emp.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        ` : `
          <div class="employee-card-actions">
            <button class="btn-view" onclick="viewEmployee(${emp.id})" style="width: 100%;">
              <i class="fas fa-eye"></i> ดูข้อมูล
            </button>
          </div>
        `}
      </div>
    `;
  });

  grid.innerHTML = html;
}

// ... Search functions remain same ...

/**
 * เปิด Modal เพิ่มพนักงาน
 */
function openAddEmployeeModal() {
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> เพิ่มพนักงาน';
  document.getElementById('employeeForm').reset();
  document.getElementById('employeeId').value = '';
  // Default to fulltime
  if (document.getElementById('empEmploymentType')) {
    document.getElementById('empEmploymentType').value = 'fulltime';
  }
  document.getElementById('employeeModal').classList.add('active');
}

// ... viewEmployee remains same but can be enhanced to show stats from API ...

/**
 * แก้ไขพนักงาน
 */
function editEmployee(id) {
  const emp = EMPLOYEES.find(e => e.id === id);
  if (!emp) return;

  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit"></i> แก้ไขพนักงาน';
  document.getElementById('employeeId').value = emp.id;
  document.getElementById('empCode').value = emp.employeeId || '';
  document.getElementById('empPin').value = ''; // Don't show password
  document.getElementById('empPin').placeholder = 'เว้นว่างถ้าไม่เปลี่ยน';
  document.getElementById('empPin').required = false; // Not required on edit

  document.getElementById('empName').value = emp.name;
  document.getElementById('empPhone').value = emp.phone || '';
  document.getElementById('empRole').value = emp.role;

  if (document.getElementById('empEmploymentType')) {
    document.getElementById('empEmploymentType').value = emp.employmentType || 'fulltime';
  }

  document.getElementById('empEmail').value = emp.email || '';
  document.getElementById('empStartDate').value = emp.startDate ? emp.startDate.split('T')[0] : '';

  document.getElementById('employeeModal').classList.add('active');
}

/**
 * ลบพนักงาน
 */
async function deleteEmployee(id) {
  const emp = EMPLOYEES.find(e => e.id === id);
  if (!emp) return;

  if (confirm(`ต้องการลบพนักงาน "${emp.name}" หรือไม่?`)) {
    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('ลบพนักงานเรียบร้อย');
        loadEmployees();
      } else {
        const data = await response.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  }
}

/**
 * บันทึกพนักงาน
 */
async function saveEmployee(e) {
  e.preventDefault();

  const id = document.getElementById('employeeId').value;
  const isEdit = !!id;

  const pin = document.getElementById('empPin').value;

  // Validation for CREATE
  if (!isEdit && !pin) {
    alert('กรุณากรอกรหัส PIN');
    return;
  }

  const data = {
    employeeId: document.getElementById('empCode').value,
    name: document.getElementById('empName').value,
    phone: document.getElementById('empPhone').value,
    role: document.getElementById('empRole').value,
    employmentType: document.getElementById('empEmploymentType') ? document.getElementById('empEmploymentType').value : 'fulltime',
    email: document.getElementById('empEmail').value,
    startDate: document.getElementById('empStartDate').value,
  };

  // Only send password if provided
  if (pin) {
    data.password = pin;
  }

  try {
    const url = isEdit ? `${API_URL}/employees/${id}` : `${API_URL}/employees`;
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      alert(`${isEdit ? 'แก้ไข' : 'เพิ่ม'}พนักงานเรียบร้อย!`);
      closeEmployeeModal();
      loadEmployees();
    } else {
      alert('เกิดข้อผิดพลาด: ' + result.error);
    }
  } catch (error) {
    console.error('Save error:', error);
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
  }
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('employees.html')) {
    // Check manager access
    if (isManager()) {
      document.getElementById('managerActions').classList.remove('hidden');
    }

    // Search handler
    document.getElementById('searchEmployee').addEventListener('input', (e) => {
      searchEmployees(e.target.value);
    });

    // Filter handler
    document.getElementById('roleFilter').addEventListener('change', (e) => {
      filterByRole(e.target.value);
    });

    // Form submission
    document.getElementById('employeeForm').addEventListener('submit', saveEmployee);

    // Initial load
    loadEmployees();
  }
});
