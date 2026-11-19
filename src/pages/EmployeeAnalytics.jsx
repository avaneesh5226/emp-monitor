import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, Activity, Target, Briefcase, MapPin, Calendar, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import io from 'socket.io-client';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const EmployeeAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [employee, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShotIndex, setSelectedShotIndex] = useState(null);

  useEffect(() => {
    if (!token || !id) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch single employee details
        const empRes = await fetch(`http://localhost:5000/api/employees/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!empRes.ok) throw new Error('Failed to load employee details');
        const empData = await empRes.json();
        setProfile(empData);

        // 2. Fetch employee analytics (apps, productivity score, screenshots)
        const anaRes = await fetch(`http://localhost:5000/api/analytics/employee/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (anaRes.ok) {
          const anaData = await anaRes.json();
          setAnalytics(anaData);
        }

        // 3. Fetch employee attendance history
        const attRes = await fetch(`http://localhost:5000/api/attendance/employee/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendanceHistory(attData);
        }

        // 4. Fetch tasks and filter by employee name
        const taskRes = await fetch('http://localhost:5000/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (taskRes.ok) {
          const allTasks = await taskRes.json();
          const filtered = allTasks.filter(t => t.assignedTo === empData.name);
          setEmployeeTasks(filtered);
        }
      } catch (err) {
        console.error('Error fetching employee profile data:', err);
        setError(err.message || 'Failed to load employee profile');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, token]);

  // Real-Time Screenshot Listener
  useEffect(() => {
    if (!id) return;

    const socket = io('http://localhost:5000');
    
    socket.on('screenshot_uploaded', (data) => {
      if (data.employeeId === id) {
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
  }, [id]);

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

  if (loading) return <div className="slide-up p-8">Loading Employee Profile...</div>;
  if (error || !employee) {
    return (
      <div className="slide-up p-8 text-red" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
        <button className="secondary-btn" onClick={() => navigate('/employees')}><ArrowLeft size={16}/> Back to Directory</button>
        <div>Error loading employee: {error || 'Employee profile not found.'}</div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceHistory.find(log => log.date === today);

  return (
    <div className="slide-up">
      {/* Header back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="secondary-btn" onClick={() => navigate('/employees')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem' }}>
          <ArrowLeft size={16}/>
          Back to Directory
        </button>
      </div>

      {/* Employee Identity Card */}
      <div className="card profile-header-card" style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '2rem', marginBottom: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white', borderRadius: '50%', flexShrink: 0 }}>
          {employee.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 700 }}>{employee.name}</h1>
            <span className={`status-badge ${employee.status.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
              {employee.status.toLowerCase() === 'active' && <span className="live-dot"></span>}
              {employee.status}
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
            {employee.role} | {employee.department} Department
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Briefcase size={16} />
              <span>ID: {employee.id}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={16} />
              <span>{employee.location || 'Remote'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={16} />
              <span>Joined: {employee.joinDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quick Overview */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Productivity score */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--primary-color)', color: 'white' }}>
              <Target size={22} />
            </div>
            <h3 className="stat-title">Productivity Score</h3>
          </div>
          <div className="stat-value">{analytics?.productivityScore ?? 0}%</div>
          <p className="stat-trend positive">Based on active application usage</p>
        </div>

        {/* Clock In Time Today */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Clock size={22} />
            </div>
            <h3 className="stat-title">Today's Clock In</h3>
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {todayAttendance ? todayAttendance.clockIn : '--'}
          </div>
          <p className="stat-trend neutral">Timestamp of check-in</p>
        </div>

        {/* Total Active Hours Today */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Activity size={22} />
            </div>
            <h3 className="stat-title">Active Hours Today</h3>
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {todayAttendance ? todayAttendance.activeHours : '0h 0m'}
          </div>
          <p className="stat-trend neutral">Tracked activity session</p>
        </div>
      </div>

      {/* Profile Details Sections */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
        
        {/* Left Column: Apps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Applications */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Top Applications Used Today</h2>
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
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{app.name}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: app.category === 'Productive' ? '#10b981' : app.category === 'Unproductive' ? '#ef4444' : '#6b7280', fontWeight: 600 }}>
                        {app.category}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted" style={{ margin: 0 }}>No application usage data logged today.</p>
            )}
          </div>
        </div>

        {/* Right Column: Tasks and Attendance History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Assigned Tasks */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Assigned Tasks & Progress</h2>
            {employeeTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {employeeTasks.map((task) => (
                  <div key={task.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{task.title}</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span className="status-badge" style={{ 
                          background: task.status === 'Done' ? '#ecfdf5' : task.status === 'In Progress' ? '#eff6ff' : '#f3f4f6',
                          color: task.status === 'Done' ? '#059669' : task.status === 'In Progress' ? '#2563eb' : '#4b5563',
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem'
                        }}>
                          {task.status}
                        </span>
                        <span className="status-badge" style={{ 
                          background: task.urgency === 'High' ? '#fef2f2' : task.urgency === 'Medium' ? '#fffbeb' : '#f0fdf4',
                          color: task.urgency === 'High' ? '#dc2626' : task.urgency === 'Medium' ? '#d97706' : '#15803d',
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem'
                        }}>
                          {task.urgency}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.description}</p>
                    {task.dueDate && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Due Date: <strong>{task.dueDate}</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ margin: 0 }}>No tasks currently assigned to this employee.</p>
            )}
          </div>

          {/* Historical Attendance logs */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: 600 }}>Attendance History</h2>
            {attendanceHistory.length > 0 ? (
              <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Active Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((log) => (
                      <tr key={log.id}>
                        <td><strong>{log.date}</strong></td>
                        <td>
                          <span className={`status-badge ${log.status.toLowerCase() === 'active' ? 'active' : 'inactive'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                            {log.status}
                          </span>
                        </td>
                        <td>{log.clockIn}</td>
                        <td>{log.clockOut}</td>
                        <td><strong>{log.activeHours}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted" style={{ margin: 0 }}>No attendance logs found in database history.</p>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Timeline - Full Width at the Bottom */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Screenshot Timeline</h2>
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
          <p className="text-muted" style={{ margin: 0 }}>No screenshots captured today.</p>
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

export default EmployeeAnalytics;
