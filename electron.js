/**
 * 7-Eleven Shift Manager - Electron Main Process
 * สร้างแอปพลิเคชัน Desktop
 */

const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron');
const path = require('path');

// Keep reference to prevent garbage collection
let mainWindow;
let tray;

// Server
const server = require('./backend/server');

// ============================================
// Create Main Window
// ============================================
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'frontend/icons/icon.svg'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        // Window styling
        backgroundColor: '#00703C',
        show: false, // Don't show until ready
        titleBarStyle: 'default',
        autoHideMenuBar: true
    });

    // Load the app
    mainWindow.loadURL('http://localhost:3000');

    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create application menu
    createMenu();
}

// ============================================
// Create Application Menu
// ============================================
function createMenu() {
    const template = [
        {
            label: 'ไฟล์',
            submenu: [
                {
                    label: 'รีเฟรช',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.reload()
                },
                { type: 'separator' },
                {
                    label: 'ออก',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'แก้ไข',
            submenu: [
                { label: 'ย้อนกลับ', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'ทำซ้ำ', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'ตัด', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'คัดลอก', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'วาง', accelerator: 'CmdOrCtrl+V', role: 'paste' }
            ]
        },
        {
            label: 'มุมมอง',
            submenu: [
                {
                    label: 'ซูมเข้า',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                    }
                },
                {
                    label: 'ซูมออก',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
                    }
                },
                {
                    label: 'รีเซ็ตซูม',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => mainWindow.webContents.setZoomLevel(0)
                },
                { type: 'separator' },
                {
                    label: 'เต็มจอ',
                    accelerator: 'F11',
                    click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
                }
            ]
        },
        {
            label: 'ช่วยเหลือ',
            submenu: [
                {
                    label: 'เกี่ยวกับ',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'เกี่ยวกับ 7-Eleven Shift Manager',
                            message: '7-Eleven Shift Manager',
                            detail: 'เวอร์ชัน 1.0.0\n\nระบบจัดการตารางงานพนักงาน 7-Eleven\n\n© 2026 7-Eleven Thailand'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// ============================================
// App Events
// ============================================

// When Electron is ready
app.whenReady().then(() => {
    createWindow();

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});

console.log('🚀 7-Eleven Shift Manager Desktop App Starting...');
