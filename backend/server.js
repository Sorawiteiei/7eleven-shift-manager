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
        console.log('✅ Database initialized');

        // Import routes after database is ready
        const authRoutes = require('./routes/auth');
        const employeesRoutes = require('./routes/employees');
        const shiftsRoutes = require('./routes/shifts');
        const tasksRoutes = require('./routes/tasks');

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

        // Explicit Root Route
        app.get('/', (req, res) => {
            res.sendFile(indexHtmlPath, (err) => {
                if (err) {
                    console.error('❌ Error serving index.html:', err);
                    res.status(500).send(`Error loading frontend: ${err.message}. Path: ${indexHtmlPath}`);
                }
            });
        });

        // Auth routes
        app.use('/api/auth', authRoutes);

        // Employee routes
        app.use('/api/employees', employeesRoutes);

        // Shift routes
        app.use('/api/shifts', shiftsRoutes);

        // Task routes
        app.use('/api/tasks', tasksRoutes);

        // ============================================
        // Error Handling
        // ============================================

        // 404 handler
        app.use((req, res, next) => {
            if (req.path.startsWith('/api')) {
                res.status(404).json({ error: 'API endpoint not found' });
            } else {
                // For non-API routes, serve the frontend
                res.sendFile(path.join(__dirname, '../frontend/index.html'));
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
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
