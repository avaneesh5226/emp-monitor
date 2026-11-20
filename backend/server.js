require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.stack || err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
});

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const { db, initializeDatabase } = require('./database');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_empmonitor_key_2026';

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatClock = (date = new Date()) => date.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
});

const formatHours = (ms) => {
  const total = Math.max(0, Math.round(ms / 60000));
  return `${Math.floor(total / 60)}h ${total % 60}m`;
};

const clockInstant = (dateStr, timeStr) => {
  if (!dateStr || !timeStr || timeStr === '--') return null;
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  const meridiem = (match[4] || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

const elapsedLabel = (row, end = new Date()) => {
  const start = clockInstant(row.date, row.clockIn);
  if (!start) return row.activeHours || '0h 0m';
  const stop = row.status === 'Active' || !row.clockOut || row.clockOut === '--'
    ? end
    : (clockInstant(row.date, row.clockOut) || end);
  return formatHours(stop - start);
};

const withLiveHours = (row) => (
  row && row.status === 'Active' ? { ...row, activeHours: elapsedLabel(row) } : row
);

app.use(cors());
app.use(express.json());
// Serve screenshots statically. DATA_DIR is the persistent disk in production.
const path = require('path');
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : __dirname;
const uploadsDir = path.join(dataDir, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Initialize Database Schemas
initializeDatabase();

// Productivity Categorization Helper
const categorizeApp = (appName, windowTitle = '') => {
  const name = appName.toLowerCase();
  const title = windowTitle.toLowerCase();
  
  const productive = [
    // General developer, office & collaboration tools
    'code', 'visual studio', 'word', 'excel', 'powerpoint', 'slack', 'teams', 'antigravity', 'zoom', 'figma', 'notion', 'trello', 'jira', 'postman',
    // Web pages / tab contents
    'github', 'gitlab', 'stackoverflow', 'stack overflow', 'google meet', 'meet.google', 'google doc', 'google sheet', 'localhost', 'docs.', 'developer', 'mdn', 'w3schools', 'bitbucket', 'copilot', 'chatgpt', 'claude', 'gemini'
  ];
  
  const unproductive = [
    // Entertainment, messaging, social media & games
    'spotify', 'netflix', 'steam', 'game', 'discord', 'whatsapp', 'facebook', 'instagram', 'twitter', 'x.com', 'reddit', 'youtube', 'twitch', 'prime video', 'disney', 'pinterest', 'tiktok'
  ];
  
  // First check unproductive (so YouTube/Netflix in browser is flagged unproductive)
  if (unproductive.some(u => name.includes(u) || title.includes(u))) return 'Unproductive';
  
  // Then check productive
  if (productive.some(p => name.includes(p) || title.includes(p))) return 'Productive';
  
  return 'Neutral';
};

// Clean Grouped Browser Apps Helper
const getCleanAppName = (appName, windowTitle = '') => {
  const appLower = appName.toLowerCase();
  const titleLower = windowTitle.toLowerCase();
  
  const browsers = ['chrome', 'brave', 'firefox', 'edge', 'safari', 'browser'];
  const isBrowser = browsers.some(b => appLower.includes(b));
  
  if (isBrowser) {
    if (titleLower.includes('github')) return `${appName} (GitHub)`;
    if (titleLower.includes('gitlab')) return `${appName} (GitLab)`;
    if (titleLower.includes('stackoverflow') || titleLower.includes('stack overflow')) return `${appName} (Stack Overflow)`;
    if (titleLower.includes('youtube')) return `${appName} (YouTube)`;
    if (titleLower.includes('netflix')) return `${appName} (Netflix)`;
    if (titleLower.includes('slack')) return `${appName} (Slack)`;
    if (titleLower.includes('meet.google') || titleLower.includes('google meet')) return `${appName} (Google Meet)`;
    if (titleLower.includes('chatgpt')) return `${appName} (ChatGPT)`;
    if (titleLower.includes('claude')) return `${appName} (Claude)`;
    if (titleLower.includes('gemini')) return `${appName} (Gemini)`;
    if (titleLower.includes('figma')) return `${appName} (Figma)`;
    if (titleLower.includes('notion')) return `${appName} (Notion)`;
    if (titleLower.includes('localhost')) return `${appName} (Localhost Dev)`;
    
    return `${appName} (Web Browsing)`;
  }
  
  return appName;
};

// --- SOCKET.IO CONFIGURATION ---
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('agent_connected', (data) => {
    console.log(`[Socket] Desktop Agent for ${data.employeeId} connected.`);
  });

  socket.on('activity_log', (data) => {
    console.log(`[Agent Log] ${data.employeeId} | Status: ${data.status} | App: ${data.appName} | Title: ${data.windowTitle || ''}`);
    
    io.emit('attendance_update', { type: 'APP_TRACKING', employee: data.employeeId, status: data.status });

    // Only log active app usage
    if (data.status === 'Active' && data.appName) {
      const today = localDateString();
      const cleanAppName = getCleanAppName(data.appName, data.windowTitle || '');
      const category = categorizeApp(data.appName, data.windowTitle || '');
      
      db.get('SELECT * FROM app_usage WHERE employeeId = ? AND appName = ? AND date = ?', [data.employeeId, cleanAppName, today], (err, row) => {
        if (!row) {
          db.run('INSERT INTO app_usage (employeeId, appName, durationMinutes, category, date) VALUES (?, ?, 1, ?, ?)', [data.employeeId, cleanAppName, category, today]);
        } else {
          db.run('UPDATE app_usage SET durationMinutes = durationMinutes + 1 WHERE id = ?', [row.id]);
        }
      });
    }
  });


  socket.on('screenshot_upload', (data) => {
    console.log(`[Agent Upload] Screenshot received for ${data.employeeId} at ${data.timestamp}`);
    const fs = require('fs');
    const base64Data = data.image.replace(/^data:image\/jpeg;base64,/, "");
    const fileName = `screenshot_${data.employeeId}_${Date.now()}.jpg`;
    const today = localDateString();
    
    const dir = uploadsDir;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFile(path.join(dir, fileName), base64Data, 'base64', (err) => {
      if (err) console.error('Error saving screenshot:', err);
      else {
        // Save to Database
        db.run('INSERT INTO screenshots (employeeId, filename, timestamp, date) VALUES (?, ?, ?, ?)', [data.employeeId, fileName, data.timestamp, today], (dbErr) => {
          if (!dbErr) {
            // Broadcast the new screenshot event in real-time
            io.emit('screenshot_uploaded', {
              employeeId: data.employeeId,
              screenshot: {
                url: `/uploads/${fileName}`,
                time: new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              }
            });
          }
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', (req, res) => {
  const { username, password, employeeId } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const registerUser = (role, empId) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(
      'INSERT INTO users (username, password, role, employeeId) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, empId],
      function(err) {
        if (err) return res.status(err.message.includes('UNIQUE') ? 400 : 500).json({ error: err.message });
        res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
      }
    );
  };

  if (employeeId) {
    // Verify employeeId exists in employees table
    db.get('SELECT * FROM employees WHERE id = ?', [employeeId], (err, emp) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!emp) return res.status(400).json({ error: 'Employee ID not found. Please ask your administrator to create your employee profile first.' });

      // Verify employeeId not already linked to another user
      db.get('SELECT * FROM users WHERE employeeId = ?', [employeeId], (err, existingUser) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existingUser) return res.status(400).json({ error: 'This Employee ID is already registered.' });

        registerUser('employee', employeeId);
      });
    });
  } else {
    // Default signup as admin
    registerUser('admin', null);
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, employeeId: user.employeeId }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, employeeId: user.employeeId } });
  });
});

app.post('/api/auth/google-login', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Google ID token required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload['email'];

    // Find or create user in SQLite
    db.get('SELECT * FROM users WHERE username = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });

      if (user) {
        // User exists, issue token
        const appToken = jwt.sign({ id: user.id, username: user.username, role: user.role, employeeId: user.employeeId }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token: appToken, user: { id: user.id, username: user.username, role: user.role, employeeId: user.employeeId } });
      } else {
        // Auto-register new user with Google email
        // Generate random password placeholder since they will use Google login
        const randomPassword = require('crypto').randomBytes(16).toString('hex');
        const hashedPassword = bcrypt.hashSync(randomPassword, 10);
        db.run('INSERT INTO users (username, password, role, employeeId) VALUES (?, ?, ?, ?)', [email, hashedPassword, 'admin', null], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          const newUserId = this.lastID;
          const appToken = jwt.sign({ id: newUserId, username: email, role: 'admin', employeeId: null }, JWT_SECRET, { expiresIn: '24h' });
          res.status(201).json({ token: appToken, user: { id: newUserId, username: email, role: 'admin', employeeId: null } });
        });
      }
    });
  } catch (error) {
    console.error('Error verifying Google token:', error.message);
    res.status(400).json({ error: 'Invalid Google token' });
  }
});

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- EMPLOYEES ROUTES ---
app.get('/api/employees', authenticateToken, (req, res) => {
  db.all('SELECT * FROM employees', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/employees/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Employee not found' });
    res.json(row);
  });
});

app.post('/api/employees', authenticateToken, (req, res) => {
  const { name, role, department, location, status, joinDate } = req.body;
  const crypto = require('crypto');

  db.get('SELECT COUNT(*) as count FROM employees', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row ? row.count : 0;
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(3, '0');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    // Complex Format: EMP-{YEAR}-{SEQ}-{RANDOM} -> e.g., EMP-2026-001-A4F2
    const newId = `EMP-${year}-${seq}-${randomHex}`;
    
    db.run(
      'INSERT INTO employees (id, name, role, department, location, status, joinDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newId, name, role, department, location, status || 'Active', joinDate],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Employee added successfully', id: newId });
      }
    );
  });
});

// --- ATTENDANCE ROUTES ---
app.get('/api/attendance', authenticateToken, (req, res) => {
  const since = /^\d{4}-\d{2}-\d{2}$/.test(req.query.since || '') ? req.query.since : null;
  const query = since
    ? `SELECT a.*, e.name, e.role
       FROM attendance a
       JOIN employees e ON a.employeeId = e.id
       WHERE a.date >= ?
       ORDER BY a.id DESC`
    : `SELECT a.*, e.name, e.role
       FROM attendance a
       JOIN employees e ON a.employeeId = e.id
       ORDER BY a.id DESC LIMIT 50`;
  db.all(query, since ? [since] : [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json((rows || []).map(withLiveHours));
  });
});

app.get('/api/attendance/employee/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT a.*, e.name, e.role 
    FROM attendance a 
    JOIN employees e ON a.employeeId = e.id 
    WHERE a.employeeId = ?
    ORDER BY a.date DESC, a.id DESC
  `;
  db.all(query, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json((rows || []).map(withLiveHours));
  });
});

// --- TASKS (PROJECTS) ROUTES ---
app.get('/api/tasks', authenticateToken, (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, status, urgency, dueDate, assignedTo } = req.body;
  db.run(
    'INSERT INTO tasks (title, description, status, urgency, dueDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, status || 'To Do', urgency, dueDate, assignedTo],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/tasks/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task status updated' });
  });
});

// --- ANALYTICS DASHBOARD ROUTE ---
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
  const today = localDateString();
  const stats = {
    totalEmployees: 0,
    activeToday: 0,
    avgProductivity: '—',
    alerts: 0
  };

  db.get('SELECT COUNT(*) as count FROM employees', [], (err, empRow) => {
    if (!err && empRow) stats.totalEmployees = empRow.count;

    db.get('SELECT COUNT(DISTINCT employeeId) as count FROM attendance WHERE date = ? AND status = ?', [today, 'Active'], (err, attRow) => {
      if (!err && attRow) stats.activeToday = attRow.count;

      db.all('SELECT category, SUM(durationMinutes) as mins FROM app_usage WHERE date = ? GROUP BY category', [today], (err, rows) => {
        if (!err && rows && rows.length) {
          let prod = 0;
          let total = 0;
          rows.forEach((row) => {
            const mins = row.mins || 0;
            total += mins;
            if (row.category === 'Productive') prod += mins;
            else if (row.category === 'Neutral') prod += mins * 0.5;
          });
          stats.avgProductivity = total > 0 ? `${Math.round((prod / total) * 100)}%` : '—';
        }
        res.json(stats);
      });
    });
  });
});

app.get('/api/analytics/employee/:id', authenticateToken, (req, res) => {
  const employeeId = req.params.id;
  const today = localDateString();

  const result = {
    employeeId,
    topApps: [],
    productivityScore: 0,
    screenshots: []
  };

  // Get App Usage
  db.all('SELECT appName, durationMinutes, category FROM app_usage WHERE employeeId = ? AND date = ? ORDER BY durationMinutes DESC', [employeeId, today], (err, apps) => {
    const rows = (!err && apps) ? apps : [];
    result.topApps = rows.slice(0, 5).map(a => ({ name: a.appName, value: a.durationMinutes, category: a.category }));
    let prodScore = 0;
    let total = 0;
    rows.forEach(a => {
      total += a.durationMinutes;
      if (a.category === 'Productive') prodScore += a.durationMinutes;
      else if (a.category === 'Neutral') prodScore += (a.durationMinutes * 0.5);
    });
    result.productivityScore = total > 0 ? Math.round((prodScore / total) * 100) : 0;

    // Get Screenshots
    db.all('SELECT filename, timestamp FROM screenshots WHERE employeeId = ? AND date = ? ORDER BY id DESC', [employeeId, today], (err, shots) => {
      if (!err && shots) {
        result.screenshots = shots.map(s => ({
          url: `/uploads/${s.filename}`,
          time: new Date(s.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }));
      }
      res.json(result);
    });
  });
});

// --- TRACKER DISTRIBUTION & SCHEDULING ---
app.get('/api/schedule', (req, res) => {
  db.get("SELECT value FROM settings WHERE key = 'schedule'", [], (err, row) => {
    if (err || !row) {
      return res.json({ startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, timezone: 'local' });
    }
    res.json(JSON.parse(row.value));
  });
});

app.post('/api/schedule', authenticateToken, (req, res) => {
  const newSchedule = JSON.stringify(req.body);
  db.run("UPDATE settings SET value = ? WHERE key = 'schedule'", [newSchedule], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Schedule updated successfully' });
  });
});

// --- ATTENDANCE WINDOW SETTINGS ---
app.get('/api/settings/attendance-window', authenticateToken, (req, res) => {
  db.get("SELECT value FROM settings WHERE key = 'attendance_window'", [], (err, row) => {
    if (err || !row) {
      return res.json({ enabled: false, startTime: '09:00', endTime: '11:00' });
    }
    res.json(JSON.parse(row.value));
  });
});

app.post('/api/settings/attendance-window', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin only' });
  }
  const newWindowSetting = JSON.stringify(req.body);
  db.run("UPDATE settings SET value = ? WHERE key = 'attendance_window'", [newWindowSetting], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Attendance window updated successfully' });
  });
});

// --- EMPLOYEE MANUAL ATTENDANCE MARKING ---
app.get('/api/attendance/today', authenticateToken, (req, res) => {
  const employeeId = req.user.employeeId;
  if (!employeeId) {
    return res.status(400).json({ error: 'This user is not associated with an employee profile.' });
  }
  const today = localDateString();
  db.get('SELECT * FROM attendance WHERE employeeId = ? AND date = ?', [employeeId, today], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row ? withLiveHours(row) : null);
  });
});

app.post('/api/attendance/clock-in', authenticateToken, (req, res) => {
  const employeeId = req.user.employeeId;
  if (!employeeId) {
    return res.status(400).json({ error: 'This user is not associated with an employee profile.' });
  }

  const today = localDateString();

  // Fetch window settings
  db.get("SELECT value FROM settings WHERE key = 'attendance_window'", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const settings = row ? JSON.parse(row.value) : { enabled: false, startTime: '09:00', endTime: '11:00' };

    if (settings.enabled) {
      // Check current time window
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      const [startH, startM] = settings.startTime.split(':').map(Number);
      const [endH, endM] = settings.endTime.split(':').map(Number);

      const currentVal = currentHours * 60 + currentMinutes;
      const startVal = startH * 60 + startM;
      const endVal = endH * 60 + endM;

      if (currentVal < startVal || currentVal > endVal) {
        return res.status(400).json({
          error: `Outside attendance window. You can only mark attendance between ${settings.startTime} and ${settings.endTime}.`
        });
      }
    }

    // Check if already clocked in today
    db.get('SELECT * FROM attendance WHERE employeeId = ? AND date = ?', [employeeId, today], (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existing) {
        return res.status(400).json({ error: 'You have already marked your attendance for today.' });
      }

      // Create attendance entry
      const nowStr = formatClock();
      db.run(
        'INSERT INTO attendance (employeeId, status, clockIn, clockOut, activeHours, date) VALUES (?, ?, ?, ?, ?, ?)',
        [employeeId, 'Active', nowStr, '--', '0h 0m', today],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });

          // Emit live event via websocket
          db.get('SELECT name FROM employees WHERE id = ?', [employeeId], (err, emp) => {
            const empName = emp ? emp.name : employeeId;
            io.emit('attendance_update', { type: 'CLOCK_IN', employee: empName, time: nowStr });
          });

          res.status(201).json({ message: 'Attendance marked successfully', clockIn: nowStr });
        }
      );
    });
  });
});

app.post('/api/attendance/clock-out', authenticateToken, (req, res) => {
  const employeeId = req.user.employeeId;
  if (!employeeId) {
    return res.status(400).json({ error: 'This user is not associated with an employee profile.' });
  }

  const today = localDateString();

  db.get('SELECT * FROM attendance WHERE employeeId = ? AND date = ?', [employeeId, today], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existing) {
      return res.status(400).json({ error: 'You have not clocked in today yet.' });
    }
    if (existing.status !== 'Active') {
      return res.status(400).json({ error: 'You are already clocked out.' });
    }

    const nowStr = formatClock();
    const activeHours = elapsedLabel({ ...existing, status: 'Inactive', clockOut: nowStr });

    db.run(
      "UPDATE attendance SET status = 'Inactive', clockOut = ?, activeHours = ? WHERE id = ?",
      [nowStr, activeHours, existing.id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        db.get('SELECT name FROM employees WHERE id = ?', [employeeId], (err, emp) => {
          const empName = emp ? emp.name : employeeId;
          io.emit('attendance_update', { type: 'CLOCK_OUT', employee: empName, time: nowStr });
        });

        res.json({ message: 'Clocked out successfully', clockOut: nowStr, activeHours });
      }
    );
  });
});

app.get('/api/download-tracker', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(__dirname, '../desktop-agent/tracker.exe');
  
  if (fs.existsSync(file)) {
    res.download(file, 'EmpMonitor_Tracker.exe');
  } else {
    // Fallback if exe is not built yet
    res.status(404).send('Executable not built yet. Please wait for the packaging step to complete.');
  }
});

// --- HEARTBEAT FOR TASK RETENTION ---
setInterval(() => {
  console.log(`[Heartbeat] Backend server is alive - ${new Date().toISOString()}`);
}, 30000);

// Serve the built React app from the same origin as the API.
const distPath = path.join(__dirname, '../dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- START SERVER ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  console.log(`WebSocket Server listening for live events...`);
});
