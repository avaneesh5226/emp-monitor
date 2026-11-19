import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const { token } = useAuth();

  // Fetch Attendance Logs on Mount
  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceLogs(data);
        setActiveCount(data.filter(log => log.status === 'Active').length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchLogs();
  }, [token]);

  // Live Clock Simulation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSockets for Real-Time Updates
  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.on('attendance_update', (event) => {
      // Re-fetch the logs from DB to get the most accurate state
      // (in a highly optimized app, we'd manually update the React state)
      fetchLogs();
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="slide-up">
      <div className="page-header-flex">
        <div className="dashboard-header" style={{ marginBottom: 0 }}>
          <h1>Attendance Tracking</h1>
          <p className="subtitle">Real-time attendance logs and active tracking for your workforce.</p>
        </div>
        
        <div className="card live-clock-card">
          <Clock size={16} className="text-muted" />
          <span className="live-time">{currentTime}</span>
        </div>
      </div>
      
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card p-6 border-left-accent">
          <div className="stat-header">
            <h3>Present Today</h3>
            <CheckCircle2 size={18} className="text-muted" />
          </div>
          <p className="stat-value" style={{ fontSize: '2rem' }}>{attendanceLogs.length}</p>
          <p className="stat-trend neutral">Based on live DB records</p>
        </div>
        <div className="card p-6 border-left-green">
          <div className="stat-header">
            <h3>Currently Active</h3>
            <ActivityIcon />
          </div>
          <p className="stat-value" style={{ fontSize: '2rem' }}>{activeCount}</p>
          <p className="stat-trend positive">Stable tracking connection</p>
        </div>
        <div className="card p-6 border-left-warning">
          <div className="stat-header">
            <h3>Late Arrivals</h3>
            <Clock size={18} className="text-muted" />
          </div>
          <p className="stat-value" style={{ fontSize: '2rem' }}>0</p>
          <p className="stat-trend neutral">On time</p>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-toolbar">
          <div className="header-search table-search">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search employee attendance logs..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <button className="secondary-btn"><Filter size={16} /> Filters</button>
            <button className="secondary-btn">Export Log</button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Active Hours</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLogs.length > 0 ? (
                attendanceLogs.filter(log => log.name.toLowerCase().includes(searchTerm.toLowerCase())).map((log, index) => (
                  <tr key={log.id} className={`fade-in stagger-${(index % 4) + 1}`}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar sm" style={{ background: log.status === 'Active' ? 'var(--success-color)' : 'var(--text-muted)' }}>
                          {log.name.charAt(0)}
                        </div>
                        <div className="emp-info">
                          <span className="emp-name">{log.name}</span>
                          <span className="emp-role">{log.role}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${log.status === 'Active' ? 'active' : 'inactive'}`}>
                        {log.status === 'Active' ? <span className="live-dot"></span> : null}
                        {log.status}
                      </span>
                    </td>
                    <td className="time-cell">
                      <LogIn size={14} className="text-muted" />
                      {log.clockIn}
                    </td>
                    <td className="time-cell">
                      <LogOut size={14} className="text-muted" />
                      {log.clockOut}
                    </td>
                    <td><strong>{log.activeHours}</strong></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state sm">
                      <p className="text-muted">No attendance logs available yet. The desktop agent will start tracking soon.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

export default Attendance;
