/**
 * 7-Eleven Shift Manager - Authentication Module
 * จัดการการเข้าสู่ระบบและ session
 */

// API Base URL Configuration
// ----------------------------------------
// [สำคัญ] ถ้าใช้บนมือถือจริง (Real Device) ให้เปลี่ยน '10.0.2.2' เป็น IPv4 ของคอมฯ (เช่น '192.168.1.X')
// [สำคัญ] ถ้าใช้บน Emulator ให้ใช้ '10.0.2.2' ได้เลย
const LOCAL_SERVER_IP = '10.0.2.2';
const PORT = 3000;

let apiUrl = '/api'; // Default for Web Browser (Localhost/Production)

// Check if running in Capacitor/Cordova/Electron (Not standard web)
if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
    // If on Android Emulator or Device accessing via file protocol
    apiUrl = `http://${LOCAL_SERVER_IP}:${PORT}/api`;
}

// Override if strictly on web browser locally
if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    apiUrl = '/api';
}

window.API_BASE_URL = apiUrl;
const API_BASE_URL = window.API_BASE_URL;

console.log('🔗 Connecting to API at:', API_BASE_URL);

// Demo Users (จะย้ายไป database ภายหลัง)
const DEMO_USERS = [
    {
        id: 1,
        employeeId: 'admin',
        password: '1234',
        name: 'ผู้จัดการร้าน',
        role: 'manager',
        avatar: 'M'
    },
    {
        id: 2,
        employeeId: 'emp001',
        password: '1234',
        name: 'สมชาย ใจดี',
        role: 'employee',
        avatar: 'ส'
    },
    {
        id: 3,
        employeeId: 'emp002',
        password: '1234',
        name: 'สมหญิง รักงาน',
        role: 'employee',
        avatar: 'ส'
    },
    {
        id: 4,
        employeeId: 'emp003',
        password: '1234',
        name: 'วิชัย มั่นคง',
        role: 'employee',
        avatar: 'ว'
    }
];

/**
 * ตรวจสอบว่า user login อยู่หรือไม่
 */
function isLoggedIn() {
    const user = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    return user !== null;
}

/**
 * ดึงข้อมูล current user
 */
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    if (userStr) {
        return JSON.parse(userStr);
    }
    return null;
}

/**
 * ตรวจสอบว่าเป็น manager หรือไม่
 */
function isManager() {
    const user = getCurrentUser();
    return user && user.role === 'manager';
}

/**
 * Login function
 */
/**
 * Login function
 */
async function login(employeeId, password, rememberMe = false) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, password })
        });

        const data = await response.json();

        if (response.ok) {
            const userData = {
                ...data.user,
                token: data.token,
                loginTime: new Date().toISOString()
            };

            // Store session
            if (rememberMe) {
                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('authToken', data.token);
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                sessionStorage.setItem('authToken', data.token);
            }

            return { success: true, user: userData };
        } else {
            return { success: false, message: data.error || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Cannot connect to server' };
    }
}

/**
 * Logout function
 */
function logout() {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

/**
 * Protect page - redirect to login if not authenticated
 */
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

/**
 * Redirect if already logged in
 */
function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
    }
}

/**
 * แสดง alert message
 */
function showAlert(message, type = 'error') {
    const alertEl = document.getElementById('alertMessage');
    if (alertEl) {
        alertEl.className = `alert alert-${type}`;
        alertEl.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      <span>${message}</span>
    `;
        alertEl.classList.remove('hidden');

        // Auto hide after 5 seconds
        setTimeout(() => {
            alertEl.classList.add('hidden');
        }, 5000);
    }
}

/**
 * อัพเดท UI ตาม user info
 */
function updateUserUI() {
    const user = getCurrentUser();
    if (!user) return;

    // Update user name
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = user.name;

    // Update user role
    const userRoleEl = document.getElementById('userRole');
    if (userRoleEl) {
        userRoleEl.textContent = user.role === 'manager' ? 'ผู้จัดการร้าน' : 'พนักงาน';
    }

    // Update avatar
    const userAvatarEl = document.getElementById('userAvatar');
    if (userAvatarEl) userAvatarEl.textContent = user.avatar;

    // Show/hide admin menu
    const adminMenuEl = document.getElementById('adminMenu');
    if (adminMenuEl) {
        if (user.role === 'manager') {
            adminMenuEl.classList.remove('hidden');
        }
    }
}

/**
 * Format วันที่เป็นภาษาไทย
 */
function formatThaiDate(date) {
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const d = new Date(date);
    const dayName = thaiDays[d.getDay()];
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543; // แปลงเป็น พ.ศ.

    return `วัน${dayName}ที่ ${day} ${month} ${year}`;
}

/**
 * อัพเดทวันที่ปัจจุบัน
 */
function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = formatThaiDate(new Date());
    }
}

// ============================================
// Event Listeners for Login Page
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if on login page
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        // Redirect if already logged in
        redirectIfLoggedIn();

        // Handle login form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const employeeId = document.getElementById('employeeId').value.trim();
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            const loginBtn = document.getElementById('loginBtn');

            // Show loading
            loginBtn.innerHTML = '<span class="loading"></span> กำลังเข้าสู่ระบบ...';
            loginBtn.disabled = true;

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const result = await login(employeeId, password, rememberMe);

            if (result.success) {
                showAlert('เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                showAlert(result.message, 'error');
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>เข้าสู่ระบบ</span>';
                loginBtn.disabled = false;
            }
        });
    }

    // If on protected page, check auth and update UI
    if (!loginForm && !window.location.pathname.includes('index.html')) {
        if (requireAuth()) {
            updateUserUI();
            updateCurrentDate();
        }
    }
});
