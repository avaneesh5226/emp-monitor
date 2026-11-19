import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Target, CheckCircle2, Circle, LogIn, LogOut, AlertCircle, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import io from 'socket.io-client';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const EmployeeDashboard = () => {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShotIndex, setSelectedShotIndex] = useState(null);

  // Attendance states
  const [attendance, setAttendance] = useState(null);
  const [windowSettings, setWindowSettings] = useState({ enabled: false, startTime: '09:00', endTime: '11:00' });
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US'));
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const employeeId = user?.employeeId;

  // Live clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token || !employeeId) return;

    const fetchData = async () => {
      try {
        // 1. Fetch all employees to find current profile
        const empRes = await fetch('http://localhost:5000/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const emps = await empRes.json();
        const myProfile = emps.find(e => e.id === employeeId);
        setProfile(myProfile);

        // 2. Fetch personal analytics
        const anaRes = await fetch(`http://localhost:5000/api/analytics/employee/${employeeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const anaData = await anaRes.json();
        setAnalytics(anaData);

        // 3. Fetch all tasks and filter
        const taskRes = await fetch('http://localhost:5000/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const allTasks = await taskRes.json();
        if (myProfile) {
          const myTasks = allTasks.filter(t => t.assignedTo === myProfile.name);
          setTasks(myTasks);
        }

        // 4. Fetch today's attendance status
        const attRes = await fetch('http://localhost:5000/api/attendance/today', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendance(attData);
        }

        // 5. Fetch attendance window settings
        const winRes = await fetch('http://localhost:5000/api/settings/attendance-window', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (winRes.ok) {
          const winData = await winRes.json();
          setWindowSettings(winData);
        }
      } catch (err) {
        console.error('Error fetching employee dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, employeeId]);

  // Real-Time Screenshot Listener
  useEffect(() => {
    if (!employeeId) return;

    const socket = io('http://localhost:5000');
    
    socket.on('screenshot_uploaded', (data) => {
      if (data.employeeId === employeeId) {
        setAnalytics(prev => {
          if (!prev) return prev;
          const currentShots = prev.screenshots || [];
          if (currentShots.some(s => s.url === data.screenshot.url)) return prev;
          return {
            ...prev,
            screenshots: [data.screenshot, ...currentShots]
          };
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [employeeId]);

  // Lightbox keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedShotIndex === null) return;
      if (e.key === 'ArrowLeft' && selectedShotIndex > 0) {
        setSelectedShotIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && selectedShotIndex < (analytics?.screenshots?.length - 1)) {
        setSelectedShotIndex(prev => prev + 1);
      } else if (e.key === 'Escape') {
        setSelectedShotIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShotIndex, analytics]);

  const handleTaskStatusChange = async (taskId, currentStatus) => {
    let newStatus = 'To Do';
    if (currentStatus === 'To Do') newStatus = 'In Progress';
    else if (currentStatus === 'In Progress') newStatus = 'Done';
    else newStatus = 'To Do';

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Update local tasks state
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch('http://localhost:5000/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAttendance({
          clockIn: data.clockIn,
          clockOut: '--',
          status: 'Active',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        setActionError(data.error || 'Failed to clock in.');
      }
    } catch (err) {
      console.error(err);
      setActionError('An error occurred during clock-in.');
    }
    setActionLoading(false);
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch('http://localhost:5000/api/attendance/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAttendance(prev => ({
          ...prev,
          clockOut: data.clockOut,
          status: 'Inactive'
        }));
      } else {
        setActionError(data.error || 'Failed to clock out.');
      }
    } catch (err) {
      console.error(err);
      setActionError('An error occurred during clock-out.');
    }
    setActionLoading(false);
  };

  const isWithinWindow = () => {
    if (!windowSettings.enabled) return true;
    const now = new Date();
    const [startH, startM] = windowSettings.startTime.split(':').map(Number);
    const [endH, endM] = windowSettings.endTime.split(':').map(Number);
    
    const curVal = now.getHours() * 60 + now.getMinutes();
    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;
    
    return curVal >= startVal && curVal <= endVal;
  };

  if (loading) return <div className="slide-up p-8">Loading Dashboard...</div>;
  if (!profile) return <div className="slide-up p-8 text-red">Employee profile not found. Please contact administrator.</div>;

  return (
    <div className="slide-up">
      <div className="dashboard-header">
        <h1>Welcome, {profile.name}</h1>
        <p className="subtitle">{profile.role} | {profile.department} Department</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Attendance Control Card */}
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', height: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="stat-icon" style={{ 
                background: attendance?.status === 'Active' ? '#ecfdf5' : attendance?.status === 'Inactive' ? '#f3f4f6' : '#fffbeb', 
                color: attendance?.status === 'Active' ? '#059669' : attendance?.status === 'Inactive' ? '#4b5563' : '#d97706' 
              }}>
                <Clock size={22} />
              </div>
              <div>
                <h3 className="stat-title" style={{ fontSize: '0.9rem', marginBottom: '0.15rem' }}>Daily Attendance</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                  Current Time: <strong>{currentTime}</strong>
                </p>
              </div>
            </div>
            
            <div>
              {attendance?.status === 'Active' ? (
                <span className="status-badge active">
                  <span className="live-dot"></span>
                  Present / Clocked In
                </span>
              ) : attendance?.status === 'Inactive' ? (
                <span className="status-badge" style={{ background: '#e5e7eb', color: '#374151' }}>
                  Clocked Out
                </span>
              ) : (
                <span className="status-badge warning" style={{ background: '#fef3c7', color: '#92400e' }}>
                  Absent / Not Clocked In
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Clock In: <strong style={{ color: 'var(--text-primary)' }}>{attendance ? attendance.clockIn : '--'}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Clock Out: <strong style={{ color: 'var(--text-primary)' }}>{attendance ? attendance.clockOut : '--'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
              {windowSettings.enabled && !attendance && (
                <span style={{ fontSize: '0.75rem', color: '#b45309', background: '#fffbeb', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #fde68a', marginBottom: '0.25rem' }}>
                  Required Window: {windowSettings.startTime} - {windowSettings.endTime}
                </span>
              )}
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {!attendance ? (
                  <button
                    onClick={handleClockIn}
                    disabled={actionLoading || (windowSettings.enabled && !isWithinWindow())}
                    className="primary-btn"
                    style={{ 
                      background: (windowSettings.enabled && !isWithinWindow()) ? 'var(--text-muted)' : '#059669',
                      borderColor: (windowSettings.enabled && !isWithinWindow()) ? 'var(--border-color)' : '#059669',
                      padding: '0.5rem 1.25rem',
                      cursor: (windowSettings.enabled && !isWithinWindow()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <LogIn size={16} />
                    {windowSettings.enabled && !isWithinWindow() ? 'Outside Window' : 'Clock In'}
                  </button>
                ) : attendance.status === 'Active' ? (
                  <button
                    onClick={handleClockOut}
                    disabled={actionLoading}
                    className="primary-btn"
                    style={{ background: '#dc2626', borderColor: '#dc2626', padding: '0.5rem 1.25rem' }}
                  >
                    <LogOut size={16} />
                    Clock Out
                  </button>
                ) : (
                  <button
                    disabled
                    className="secondary-btn"
                    style={{ padding: '0.5rem 1.25rem', color: 'var(--text-muted)' }}
                  >
                    Completed
                  </button>
                )}
              </div>
            </div>
          </div>

          {actionError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', background: '#fef2f2', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #fecaca' }}>
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* Productivity Score */}
        <div className="stat-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--primary-color)', color: 'white' }}>
              <Target size={24} />
            </div>
            <h3 className="stat-title">Productivity Score</h3>
          </div>
          <div className="stat-value">{analytics?.productivityScore ?? 0}%</div>
          <p className="stat-trend positive">Based on your activity today</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        {/* App Usage */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Your Top Applications</h2>
          {analytics?.topApps && analytics.topApps.length > 0 ? (
            <>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.topApps} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                      {analytics.topApps.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginTop: '1rem' }}>
                {analytics.topApps.map((app, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{app.name}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: app.category === 'Productive' ? '#10b981' : app.category === 'Unproductive' ? '#ef4444' : '#6b7280', fontWeight: 600 }}>
                      {app.category}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted">No app tracking data received yet today.</p>
          )}
        </div>

        {/* Tasks */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Your Tasks</h2>
          {tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tasks.map((task) => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <button 
                    onClick={() => handleTaskStatusChange(task.id, task.status)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: task.status === 'Done' ? '#10b981' : 'var(--text-muted)', marginTop: '0.2rem' }}
                  >
                    {task.status === 'Done' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ textDecoration: task.status === 'Done' ? 'line-through' : 'none', color: task.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)', margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                      {task.title}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <span className="status-badge" style={{ 
                        background: task.status === 'Done' ? '#ecfdf5' : task.status === 'In Progress' ? '#eff6ff' : '#f3f4f6',
                        color: task.status === 'Done' ? '#059669' : task.status === 'In Progress' ? '#2563eb' : '#4b5563'
                      }}>
                        {task.status}
                      </span>
                      <span className="status-badge" style={{ 
                        background: task.urgency === 'High' ? '#fef2f2' : task.urgency === 'Medium' ? '#fffbeb' : '#f0fdf4',
                        color: task.urgency === 'High' ? '#dc2626' : task.urgency === 'Medium' ? '#d97706' : '#15803d'
                      }}>
                        {task.urgency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No tasks assigned to you.</p>
          )}
        </div>
      </div>

      {/* Screenshot Timeline */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Your Screenshot Timeline</h2>
            <span className="status-badge" style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
              {analytics?.screenshots ? analytics.screenshots.length : 0} captures today
            </span>
          </div>
        </div>

        {analytics?.screenshots && analytics.screenshots.length > 0 ? (
          <div 
            className="screenshot-scroll-container"
            style={{ 
              maxHeight: '420px', 
              overflowY: 'auto', 
              paddingRight: '0.5rem', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: '1rem' 
            }}
          >
            {analytics.screenshots.map((shot, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedShotIndex(idx)}
                className="screenshot-card"
                style={{ 
                  borderRadius: '10px', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--bg-surface)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', height: '110px' }}>
                  <img 
                    src={shot.url} 
                    alt="Screenshot" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                  />
                  <div className="screenshot-overlay">
                    <Search size={20} color="white" />
                  </div>
                </div>
                <div style={{ padding: '0.6rem 0.5rem', background: 'var(--bg-surface)', fontSize: '0.78rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {shot.time}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No screenshots captured yet today.</p>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedShotIndex !== null && analytics?.screenshots && (
        <div 
          className="modal-overlay" 
          style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          onClick={() => setSelectedShotIndex(null)}
        >
          <div 
            className="modal-content" 
            style={{ 
              background: 'none', 
              border: 'none', 
              boxShadow: 'none', 
              position: 'relative', 
              maxWidth: '90vw', 
              maxHeight: '85vh', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem' 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedShotIndex(null)}
              style={{ 
                position: 'absolute', 
                top: '-3.5rem', 
                right: 0, 
                background: 'rgba(255,255,255,0.1)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                color: 'white', 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px', 
                fontSize: '1.5rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              &times;
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', justifyContent: 'center' }}>
              {/* Previous Button */}
              <button 
                disabled={selectedShotIndex === 0}
                onClick={() => setSelectedShotIndex(prev => Math.max(0, prev - 1))}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '48px', 
                  height: '48px', 
                  cursor: selectedShotIndex === 0 ? 'not-allowed' : 'pointer', 
                  opacity: selectedShotIndex === 0 ? 0.3 : 1,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}
              >
                &#10094;
              </button>

              {/* Screenshot Image Container */}
              <div style={{ position: 'relative', border: '4px solid rgba(255,255,255,0.15)', borderRadius: '12px', overflow: 'hidden', background: '#000', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <img 
                  src={analytics.screenshots[selectedShotIndex].url} 
                  alt="Screenshot Full" 
                  style={{ maxWidth: '75vw', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} 
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))', 
                  color: 'white', 
                  padding: '2rem 1rem 1.25rem 1rem', 
                  textAlign: 'center', 
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}>
                  Captured at {analytics.screenshots[selectedShotIndex].time}
                </div>
              </div>

              {/* Next Button */}
              <button 
                disabled={selectedShotIndex === analytics.screenshots.length - 1}
                onClick={() => setSelectedShotIndex(prev => Math.min(analytics.screenshots.length - 1, prev + 1))}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '48px', 
                  height: '48px', 
                  cursor: selectedShotIndex === analytics.screenshots.length - 1 ? 'not-allowed' : 'pointer', 
                  opacity: selectedShotIndex === analytics.screenshots.length - 1 ? 0.3 : 1,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}
              >
                &#10095;
              </button>
            </div>

            {/* Counter */}
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.5px' }}>
              {selectedShotIndex + 1} of {analytics.screenshots.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
