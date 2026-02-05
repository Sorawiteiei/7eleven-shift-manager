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
 * โหลดข้อมูลพนักงาน
 */
function loadEmployees() {
    updateEmployeeStats();
    renderEmployeeGrid();
}

/**
 * อัพเดทสถิติพนักงาน
 */
function updateEmployeeStats() {
    const total = EMPLOYEES.length;
    const managers = EMPLOYEES.filter(e => e.role === 'manager').length;
    const staff = EMPLOYEES.filter(e => e.role === 'employee').length;

    document.getElementById('totalEmployeesCount').textContent = total;
    document.getElementById('managersCount').textContent = managers;
    document.getElementById('staffCount').textContent = staff;
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
        html += `
      <div class="employee-card-container" onclick="viewEmployee(${emp.id})">
        <div class="employee-card-top">
          <div class="employee-avatar-large ${emp.role}">${emp.avatar}</div>
          <div class="employee-main-info">
            <h4>${emp.name}</h4>
            <span class="employee-role-badge ${emp.role}">
              <i class="fas fa-${emp.role === 'manager' ? 'user-tie' : 'user'}"></i>
              ${emp.role === 'manager' ? 'ผู้จัดการ' : 'พนักงาน'}
            </span>
          </div>
        </div>
        
        <div class="employee-card-info">
          <div class="employee-info-item">
            <i class="fas fa-id-card"></i>
            <span>รหัส: ${emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`}</span>
          </div>
          <div class="employee-info-item">
            <i class="fas fa-phone"></i>
            <span>${emp.phone || '-'}</span>
          </div>
        </div>
        
        ${isManager() ? `
          <div class="employee-card-actions" onclick="event.stopPropagation()">
            <button class="btn-view" onclick="viewEmployee(${emp.id})">
              <i class="fas fa-eye"></i> ดู
            </button>
            <button class="btn-edit-emp" onclick="editEmployee(${emp.id})">
              <i class="fas fa-edit"></i> แก้ไข
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

// ============================================
// Search and Filter
// ============================================

/**
 * ค้นหาพนักงาน
 */
function searchEmployees(query) {
    const roleFilter = document.getElementById('roleFilter').value;

    let filtered = EMPLOYEES;

    // Filter by search query
    if (query) {
        query = query.toLowerCase();
        filtered = filtered.filter(emp =>
            emp.name.toLowerCase().includes(query) ||
            (emp.phone && emp.phone.includes(query)) ||
            (emp.employeeId && emp.employeeId.toLowerCase().includes(query))
        );
    }

    // Filter by role
    if (roleFilter) {
        filtered = filtered.filter(emp => emp.role === roleFilter);
    }

    employeesList = filtered;
    renderEmployeeGrid(filtered);
}

/**
 * กรองตามตำแหน่ง
 */
function filterByRole(role) {
    const query = document.getElementById('searchEmployee').value;
    searchEmployees(query);
}

// ============================================
// CRUD Operations
// ============================================

/**
 * เปิด Modal เพิ่มพนักงาน
 */
function openAddEmployeeModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> เพิ่มพนักงาน';
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeModal').classList.add('active');
}

/**
 * ปิด Modal พนักงาน
 */
function closeEmployeeModal() {
    document.getElementById('employeeModal').classList.remove('active');
}

/**
 * ดูข้อมูลพนักงาน
 */
function viewEmployee(id) {
    const emp = EMPLOYEES.find(e => e.id === id);
    if (!emp) return;

    const detailEl = document.getElementById('employeeDetail');

    detailEl.innerHTML = `
    <div class="detail-avatar ${emp.role}">${emp.avatar}</div>
    <h3 class="detail-name">${emp.name}</h3>
    <span class="detail-role">
      <i class="fas fa-${emp.role === 'manager' ? 'user-tie' : 'user'}"></i>
      ${emp.role === 'manager' ? 'ผู้จัดการร้าน' : 'พนักงาน'}
    </span>
    
    <div class="detail-info-grid">
      <div class="detail-info-row">
        <span class="label"><i class="fas fa-id-card"></i> รหัสพนักงาน</span>
        <span class="value">${emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`}</span>
      </div>
      <div class="detail-info-row">
        <span class="label"><i class="fas fa-phone"></i> เบอร์โทรศัพท์</span>
        <span class="value">${emp.phone || '-'}</span>
      </div>
      <div class="detail-info-row">
        <span class="label"><i class="fas fa-envelope"></i> อีเมล</span>
        <span class="value">${emp.email || '-'}</span>
      </div>
      <div class="detail-info-row">
        <span class="label"><i class="fas fa-calendar"></i> วันที่เริ่มงาน</span>
        <span class="value">${emp.startDate || '-'}</span>
      </div>
    </div>
    
    <div class="detail-stats">
      <div class="detail-stat">
        <h4>24</h4>
        <p>กะเดือนนี้</p>
      </div>
      <div class="detail-stat">
        <h4>192</h4>
        <p>ชั่วโมงงาน</p>
      </div>
      <div class="detail-stat">
        <h4>98%</h4>
        <p>มาตรงเวลา</p>
      </div>
    </div>
  `;

    document.getElementById('viewEmployeeModal').classList.add('active');
}

/**
 * ปิด Modal ดูพนักงาน
 */
function closeViewEmployeeModal() {
    document.getElementById('viewEmployeeModal').classList.remove('active');
}

/**
 * แก้ไขพนักงาน
 */
function editEmployee(id) {
    const emp = EMPLOYEES.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit"></i> แก้ไขพนักงาน';
    document.getElementById('employeeId').value = emp.id;
    document.getElementById('empCode').value = emp.employeeId || '';
    document.getElementById('empPin').value = '';
    document.getElementById('empName').value = emp.name;
    document.getElementById('empPhone').value = emp.phone || '';
    document.getElementById('empRole').value = emp.role;
    document.getElementById('empEmail').value = emp.email || '';
    document.getElementById('empStartDate').value = emp.startDate || '';

    document.getElementById('employeeModal').classList.add('active');
}

/**
 * ลบพนักงาน
 */
function deleteEmployee(id) {
    const emp = EMPLOYEES.find(e => e.id === id);
    if (!emp) return;

    if (confirm(`ต้องการลบพนักงาน "${emp.name}" หรือไม่?`)) {
        // In production, this would call API
        console.log('Delete employee:', id);
        alert('ลบพนักงานเรียบร้อย! (Demo Mode)');
        loadEmployees();
    }
}

/**
 * บันทึกพนักงาน
 */
function saveEmployee(e) {
    e.preventDefault();

    const id = document.getElementById('employeeId').value;
    const data = {
        employeeId: document.getElementById('empCode').value,
        name: document.getElementById('empName').value,
        phone: document.getElementById('empPhone').value,
        role: document.getElementById('empRole').value,
        email: document.getElementById('empEmail').value,
        startDate: document.getElementById('empStartDate').value,
    };

    console.log('Save employee:', id ? 'Edit' : 'Add', data);

    // In production, this would call API
    alert(`${id ? 'แก้ไข' : 'เพิ่ม'}พนักงานเรียบร้อย! (Demo Mode)`);
    closeEmployeeModal();
    loadEmployees();
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
