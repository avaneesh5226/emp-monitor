const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'empmonitor.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- Desktop Tracker Simulation Started ---');
console.log('Simulating live attendance updates for employees...');

// Helper to format time (e.g., "08:55 AM")
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Simulation loop
setInterval(() => {
  db.all('SELECT id, name FROM employees WHERE status = "Active"', [], (err, employees) => {
    if (err) return console.error('Database error:', err.message);
    if (employees.length === 0) return;

    // Pick a random employee to update their active time
    const emp = employees[Math.floor(Math.random() * employees.length)];
    const today = new Date().toISOString().split('T')[0];

    db.get('SELECT * FROM attendance WHERE employeeId = ? AND date = ?', [emp.id, today], (err, row) => {
      if (err) return;

      if (!row) {
        // Employee just clocked in
        console.log(`[${formatTime(new Date())}] ${emp.name} clocked in.`);
        db.run(
          'INSERT INTO attendance (employeeId, status, clockIn, clockOut, activeHours, date) VALUES (?, ?, ?, ?, ?, ?)',
          [emp.id, 'Active', formatTime(new Date()), '--', '0h 0m', today]
        );
      } else if (row.status === 'Active') {
        // Update active hours (Mocking an increment)
        console.log(`[${formatTime(new Date())}] ${emp.name} is working. Updating active hours...`);
        // For simulation, we'll just say 1h 30m if it was 0h 0m etc.
        const currentMins = parseInt(row.activeHours.split('h ')[1]) || 0;
        const newMins = currentMins + 5;
        const newHours = newMins >= 60 ? parseInt(row.activeHours.split('h')[0]) + 1 : parseInt(row.activeHours.split('h')[0]);
        const finalMins = newMins % 60;
        
        db.run(
          'UPDATE attendance SET activeHours = ? WHERE id = ?',
          [`${newHours}h ${finalMins}m`, row.id]
        );
      }
    });
  });
}, 10000); // Run every 10 seconds for testing purposes
