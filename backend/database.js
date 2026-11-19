const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'empmonitor.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const initializeDatabase = () => {
  db.serialize(() => {
    // Users Table (for Authentication)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      employeeId TEXT UNIQUE,
      FOREIGN KEY (employeeId) REFERENCES employees (id)
    )`);

    // Employees Table
    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'Active',
      joinDate TEXT
    )`);

    // Attendance Table
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId TEXT NOT NULL,
      status TEXT,
      clockIn TEXT,
      clockOut TEXT,
      activeHours TEXT,
      date TEXT,
      FOREIGN KEY (employeeId) REFERENCES employees (id)
    )`);

    // Projects / Tasks Table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'To Do',
      urgency TEXT,
      dueDate TEXT,
      assignedTo TEXT
    )`);

    // Settings Table (for Admin Controls like Scheduling)
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`, () => {
      // Initialize default schedule if not exists
      db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('schedule', '{"startHour":9,"startMinute":0,"endHour":17,"endMinute":0,"timezone":"local"}')`);
      db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('attendance_window', '{"enabled":false,"startTime":"09:00","endTime":"11:00"}')`);
    });

    // App Usage Table
    db.run(`CREATE TABLE IF NOT EXISTS app_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId TEXT NOT NULL,
      appName TEXT NOT NULL,
      durationMinutes INTEGER DEFAULT 0,
      category TEXT DEFAULT 'Neutral',
      date TEXT NOT NULL
    )`);

    // Screenshots Table
    db.run(`CREATE TABLE IF NOT EXISTS screenshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId TEXT NOT NULL,
      filename TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL
    )`);

    console.log('Database tables initialized.');
  });
};

module.exports = { db, initializeDatabase };
