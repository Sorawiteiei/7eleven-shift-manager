/**
 * 7-Eleven Shift Manager - Express Server (Updated)
 * Main entry point for the backend API
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ============================================
// Database Initialization
// ============================================

const db = require('./database/db');

async function startServer() {
  try {
    // Initialize database before starting server
    await db.initDatabase();

    // Ensure tables exist (Migration/Setup)
    const { setupDatabase } = require('./database/setup');
    await setupDatabase();

    console.log('✅ Database initialized and tables verified');

    // Import routes after database is ready
    const authRoutes = require('./routes/auth');
    const employeesRoutes = require('./routes/employees');
    const shiftsRoutes = require('./routes/shifts');
    const tasksRoutes = require('./routes/tasks');
    const leavesRoutes = require('./routes/leaves');

    // ============================================
    // API Routes
    // ============================================

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        message: '7-Eleven Shift Manager API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // Debug & Static Files Check
    const frontendPath = path.join(__dirname, '../frontend');
    console.log('📂 Serving frontend from:', frontendPath);

    const indexHtmlPath = path.join(frontendPath, 'index.html');
    console.log('📄 Looking for index.html at:', indexHtmlPath);

    // Explicit Root Route (In-Memory HTML Fallback)
    app.get('/', (req, res) => {
      // Check if file exists first
      if (require('fs').existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        console.error('❌ index.html not found on disk, serving backup HTML');
        // Backup HTML if file not found (Emergency Mode)
        res.send(`
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>เข้าสู่ระบบ (Recovery Mode)</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #00703C; color: white; margin: 0; }
    .card { background: white; color: #333; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
    button { background: #F7941D; color: white; border: none; padding: 12px; width: 100%; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 1rem; }
    h1 { color: #00703C; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>7-ELEVEN</h1>
    <p>System Recovery Mode</p>
    <form id="loginForm">
      <input type="text" id="employeeId" placeholder="รหัสพนักงาน (admin)" required>
      <input type="password" id="password" placeholder="รหัสผ่าน (1234)" required>
      <button type="submit">ข้าสู่ระบบ</button>
    </form>
    <script>
      document.getElementById('loginForm').onsubmit = async (e) => {
        e.preventDefault();
        const empId = document.getElementById('employeeId').value;
        const pass = document.getElementById('password').value;
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ employeeId: empId, password: pass })
          });
          const data = await res.json();
          if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Login Success! Redirecting...');
            window.location.href = '/dashboard.html';
          } else {
            alert('Login Failed: ' + data.error);
          }
        } catch (err) { alert('Error: ' + err.message); }
      };
    </script>
  </div>
</body>
</html>
                `);
      }
    });

    // Auth routes
    app.use('/api/auth', authRoutes);

    // Employee routes
    app.use('/api/employees', employeesRoutes);

    // Shift routes
    app.use('/api/shifts', shiftsRoutes);

    // Task routes
    app.use('/api/tasks', tasksRoutes);

    // Leave routes
    app.use('/api/leaves', leavesRoutes);

    // ============================================
    // Error Handling
    // ============================================

    // 404 handler
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API endpoint not found' });
      } else {
        // For non-API routes, serve the frontend if exists
        const indexPath = path.join(__dirname, '../frontend/index.html');
        if (require('fs').existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('404 Not Found (Frontend build missing)');
        }
      }
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Error:', err.message);
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
      });
    });

    // ============================================
    // Start Server
    // ============================================

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('  7-Eleven Shift Manager Server');
      console.log('='.repeat(50));
      console.log(`  🚀 Server running on http://localhost:${PORT}`);
      console.log(`  📁 Frontend: http://localhost:${PORT}/`);
      console.log(`  🔌 API: http://localhost:${PORT}/api`);
      console.log('='.repeat(50));
    });

  } catch (error) {
    console.error('❌ Failed to start server:');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);

    // Check for common issues
    if (error.message.includes('EADDRINUSE')) {
      console.error('💡 Port 3000 is already in use. Please close other applications using this port.');
    } else if (error.message.includes('database') || error.message.includes('SQL')) {
      console.error('💡 Database connection issue. Please check your database configuration.');
    }

    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
