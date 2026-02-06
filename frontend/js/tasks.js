/**
 * 7-Eleven Shift Manager - Tasks Module
 * จัดการหน้าที่งาน (Connected to API)
 */

// ============================================
// State Variables
// ============================================

let tasksList = [];
let selectedIcon = 'check';

// ============================================
// Load and Display Tasks
// ============================================

/**
 * โหลดข้อมูลหน้าที่งาน
 */
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหน้าที่งานได้');

        const tasks = await response.json();
        tasksList = tasks;

        updateTaskStats();
        renderTaskList();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดหน้าที่งาน:', error);
        // Show error state in list
        document.getElementById('taskList').innerHTML = `
            <div class="empty-state" style="padding: 3rem; text-align: center; color: var(--red-500);">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h4>เกิดข้อผิดพลาด</h4>
                <p>ไม่สามารถโหลดข้อมูลได้ในขณะนี้</p>
            </div>
        `;
    }
}

/**
 * อัพเดทสถิติหน้าที่งาน
 */
function updateTaskStats() {
    const morning = tasksList.filter(t => t.shift === 'morning').length;
    const afternoon = tasksList.filter(t => t.shift === 'afternoon').length;
    const night = tasksList.filter(t => t.shift === 'night').length;
    const all = tasksList.filter(t => t.shift === 'all').length;

    document.getElementById('morningTaskCount').textContent = `${morning} งาน`;
    document.getElementById('afternoonTaskCount').textContent = `${afternoon} งาน`;
    document.getElementById('nightTaskCount').textContent = `${night} งาน`;
    document.getElementById('allTaskCount').textContent = `${all} งาน`;
}

/**
 * Render task list
 */
function renderTaskList(tasks = tasksList) {
    const listEl = document.getElementById('taskList');
    const countEl = document.getElementById('taskListCount');

    countEl.textContent = `${tasks.length} รายการ`;

    if (tasks.length === 0) {
        listEl.innerHTML = `
      <div class="empty-state" style="padding: 3rem; text-align: center; color: var(--gray-400);">
        <i class="fas fa-clipboard" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <h4 style="color: var(--gray-600);">ไม่พบหน้าที่งาน</h4>
        <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
      </div>
    `;
        return;
    }

    const shiftNames = {
        morning: 'กะเช้า',
        afternoon: 'กะบ่าย',
        night: 'กะดึก',
        all: 'ทุกกะ'
    };

    const shiftIcons = {
        morning: 'sun',
        afternoon: 'cloud-sun',
        night: 'moon',
        all: 'clock'
    };

    let html = '';

    tasks.forEach(task => {
        const icon = task.icon || 'check';
        const shift = task.shift || 'all';

        html += `
      <div class="task-item">
        <div class="task-icon ${shift}">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="task-info">
          <h4>${task.name}</h4>
          <p>${task.description || 'ไม่มีรายละเอียด'}</p>
        </div>
        <span class="task-badge ${shift}">
          <i class="fas fa-${shiftIcons[shift]}"></i>
          ${shiftNames[shift]}
        </span>
        ${isManager() ? `
          <div class="task-actions">
            <button class="btn-edit" onclick="editTask(${task.id})" title="แก้ไข">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" onclick="deleteTask(${task.id})" title="ลบ">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
    });

    listEl.innerHTML = html;
}

// ============================================
// Search and Filter
// ============================================

/**
 * ค้นหาหน้าที่งาน
 */
function searchTasks(query) {
    const shiftFilter = document.getElementById('shiftFilter').value;

    let filtered = tasksList;

    // Filter by search query
    if (query) {
        query = query.toLowerCase();
        filtered = filtered.filter(task =>
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        );
    }

    // Filter by shift
    if (shiftFilter) {
        filtered = filtered.filter(task => task.shift === shiftFilter);
    }

    renderTaskList(filtered);
}

/**
 * กรองตามกะ
 */
function filterByShift(shift) {
    const query = document.getElementById('searchTask').value;
    searchTasks(query);
}

// ============================================
// CRUD Operations
// ============================================

/**
 * เปิด Modal เพิ่มหน้าที่งาน
 */
function openAddTaskModal() {
    document.getElementById('taskModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> เพิ่มหน้าที่งาน';
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';

    // Reset icon selection
    selectedIcon = 'check';
    document.getElementById('taskIcon').value = 'check';
    document.querySelectorAll('.icon-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.icon === 'check') {
            opt.classList.add('selected');
        }
    });

    document.getElementById('taskModal').classList.add('active');
}

/**
 * ปิด Modal
 */
function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

/**
 * แก้ไขหน้าที่งาน
 */
function editTask(id) {
    const task = tasksList.find(t => t.id === id);
    if (!task) return;

    document.getElementById('taskModalTitle').innerHTML = '<i class="fas fa-edit"></i> แก้ไขหน้าที่งาน';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskShift').value = task.shift || 'all';

    // Set icon selection
    const icon = task.icon || 'check';
    selectedIcon = icon;
    document.getElementById('taskIcon').value = icon;
    document.querySelectorAll('.icon-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.icon === icon) {
            opt.classList.add('selected');
        }
    });

    document.getElementById('taskModal').classList.add('active');
}

/**
 * ลบหน้าที่งาน
 */
async function deleteTask(id) {
    const task = tasksList.find(t => t.id === id);
    if (!task) return;

    if (confirm(`ต้องการลบหน้าที่งาน "${task.name}" หรือไม่?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('ลบหน้าที่งานเรียบร้อย');
                loadTasks(); // Reload list
            } else {
                const data = await response.json();
                alert(`เกิดข้อผิดพลาด: ${data.error}`);
            }
        } catch (error) {
            console.error('Delete task error:', error);
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
    }
}

/**
 * บันทึกหน้าที่งาน
 */
async function saveTask(e) {
    e.preventDefault();

    const id = document.getElementById('taskId').value;
    const data = {
        name: document.getElementById('taskName').value,
        description: document.getElementById('taskDescription').value,
        shift: document.getElementById('taskShift').value,
        icon: selectedIcon
    };

    const url = id
        ? `${API_BASE_URL}/tasks/${id}`
        : `${API_BASE_URL}/tasks`;

    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert(`${id ? 'แก้ไข' : 'เพิ่ม'}หน้าที่งานเรียบร้อย!`);
            closeTaskModal();
            loadTasks();
        } else {
            const resData = await response.json();
            alert(`เกิดข้อผิดพลาด: ${resData.error}`);
        }
    } catch (error) {
        console.error('Save task error:', error);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
}

/**
 * เลือกไอคอน
 */
function selectIcon(iconElement) {
    document.querySelectorAll('.icon-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    iconElement.classList.add('selected');
    selectedIcon = iconElement.dataset.icon;
    document.getElementById('taskIcon').value = selectedIcon;
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('tasks.html')) {
        // Check manager access
        if (isManager()) {
            document.getElementById('managerActions').classList.remove('hidden');
        }

        // Search handler
        document.getElementById('searchTask').addEventListener('input', (e) => {
            searchTasks(e.target.value);
        });

        // Filter handler
        document.getElementById('shiftFilter').addEventListener('change', (e) => {
            filterByShift(e.target.value);
        });

        // Form submission
        document.getElementById('taskForm').addEventListener('submit', saveTask);

        // Icon picker handlers
        document.querySelectorAll('.icon-option').forEach(opt => {
            opt.addEventListener('click', () => selectIcon(opt));
        });

        // Category card click handlers
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const shift = card.classList.contains('morning') ? 'morning' :
                    card.classList.contains('afternoon') ? 'afternoon' :
                        card.classList.contains('night') ? 'night' : 'all';
                document.getElementById('shiftFilter').value = shift;
                filterByShift(shift);
            });
        });

        // Initial load
        loadTasks();
    }
});
