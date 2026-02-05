# 7-Eleven Shift Manager

ระบบจัดการตารางงานพนักงาน 7-Eleven ประเทศไทย

## 🎯 Features

- 🔐 **ระบบ Login** - รองรับผู้จัดการและพนักงาน
- 📅 **ตารางงาน** - มุมมองรายวัน, สัปดาห์, เดือน
- 👥 **จัดการพนักงาน** - เพิ่ม/แก้ไข/ลบ พนักงาน
- ✅ **หน้าที่งาน** - กำหนดงานในแต่ละกะ
- 📊 **รายงาน** - สรุปชั่วโมงทำงาน, สถิติต่างๆ

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone หรือ download โปรเจค

# ติดตั้ง dependencies
npm install

# สร้างฐานข้อมูล
npm run setup

# รันเซิร์ฟเวอร์
npm start
```

### การใช้งาน

เปิดเบราว์เซอร์ไปที่ http://localhost:3000

#### บัญชีทดสอบ

| รหัสพนักงาน | รหัสผ่าน | บทบาท |
|-------------|----------|-------|
| admin | 1234 | ผู้จัดการ |
| emp001 | 1234 | พนักงาน |
| emp002 | 1234 | พนักงาน |

## 📁 โครงสร้างโปรเจค

```
7eleven-shift-app/
├── frontend/           # Frontend (HTML, CSS, JS)
│   ├── index.html      # หน้า Login
│   ├── dashboard.html  # หน้าหลัก
│   ├── schedule.html   # ตารางงาน
│   ├── employees.html  # จัดการพนักงาน
│   ├── tasks.html      # หน้าที่งาน
│   ├── reports.html    # รายงาน
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript
│
├── backend/            # Backend (Node.js + Express)
│   ├── server.js       # Express server
│   ├── database/       # SQLite database
│   └── routes/         # API routes
│
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Auth
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/verify` - ตรวจสอบ token
- `POST /api/auth/change-password` - เปลี่ยนรหัสผ่าน

### Employees
- `GET /api/employees` - รายชื่อพนักงานทั้งหมด
- `GET /api/employees/:id` - ข้อมูลพนักงาน
- `POST /api/employees` - เพิ่มพนักงาน
- `PUT /api/employees/:id` - แก้ไขพนักงาน
- `DELETE /api/employees/:id` - ลบพนักงาน

### Shifts
- `GET /api/shifts/date/:date` - ตารางงานตามวัน
- `GET /api/shifts/week/:startDate` - ตารางงานรายสัปดาห์
- `GET /api/shifts/employee/:userId` - กะของพนักงาน
- `POST /api/shifts` - เพิ่มกะ
- `PUT /api/shifts/:id` - แก้ไขกะ
- `DELETE /api/shifts/:id` - ลบกะ

### Tasks
- `GET /api/tasks` - รายการหน้าที่งาน
- `POST /api/tasks` - เพิ่มหน้าที่งาน
- `PUT /api/tasks/:id` - แก้ไขหน้าที่งาน
- `DELETE /api/tasks/:id` - ลบหน้าที่งาน

## 🎨 Design

- ธีมสี 7-Eleven (เขียว, ส้ม, แดง)
- ฟอนต์ Prompt (ภาษาไทย)
- Modern UI with Glassmorphism effects
- Responsive Design

## 📝 License

MIT License - Free to use
