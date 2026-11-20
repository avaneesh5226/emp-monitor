import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB'));
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const { token } = useAuth();

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAttendanceLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchLogs();
  }, [token]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-GB')), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = io();
    socket.on('attendance_update', () => fetchLogs());
    return () => socket.disconnect();
  }, [token]);

  const visible = attendanceLogs.filter((log) =>
    String(log.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeCount = attendanceLogs.filter((log) => log.status === 'Active').length;

  return (
    <div className="page">
      <div className="page-header-flex">
        <div className="dashboard-header">
          <span className="kicker">Live</span>
          <h1>Attendance</h1>
          <p className="subtitle">Clock events as they land. The list refreshes when the tracker reports in.</p>
        </div>
        <div className="live-clock-card">{currentTime}</div>
      </div>

      <section className="ledger cols-3">
        <div className="ledger-cell">
          <span className="kicker">Rows</span>
          <span className="figure">{attendanceLogs.length}</span>
          <span className="meta">Latest records</span>
        </div>
        <div className="ledger-cell">
          <span className="kicker">Active</span>
          <span className="figure">{activeCount}</span>
          <span className="meta">Still clocked in</span>
        </div>
        <div className="ledger-cell">
          <span className="kicker">Closed</span>
          <span className="figure">{attendanceLogs.length - activeCount}</span>
          <span className="meta">Out, in this list</span>
        </div>
      </section>

      <div className="card table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <input
              className="search-input"
              aria-label="Find a name"
              placeholder="Find a name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Status</th>
                <th>In</th>
                <th>Out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {visible.length > 0 ? visible.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar sm">{log.name.charAt(0)}</div>
                      <div className="emp-info">
                        <span className="emp-name">{log.name}</span>
                        <span className="emp-dept">{log.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${log.status === 'Active' ? 'active' : 'inactive'}`}>
                      {log.status === 'Active' && <span className="live-dot" />}
                      {log.status}
                    </span>
                  </td>
                  <td>{log.clockIn}</td>
                  <td>{log.clockOut}</td>
                  <td><strong>{log.activeHours}</strong></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state sm">No attendance yet. The desktop agent writes the first row.</div>
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

export default Attendance;
