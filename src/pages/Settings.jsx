import React, { useState, useEffect } from 'react';
import { Save, Clock, Info, CalendarRange } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [schedule, setSchedule] = useState({
    startHour: 9,
    startMinute: 0,
    endHour: 17,
    endMinute: 0
  });
  const [attendanceWindow, setAttendanceWindow] = useState({
    enabled: false,
    startTime: '09:00',
    endTime: '11:00'
  });

  useEffect(() => {
    if (!token) return;
    
    // Fetch schedule
    fetch('http://localhost:5000/api/schedule', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSchedule(data))
      .catch(err => console.error(err));

    // Fetch attendance window settings
    fetch('http://localhost:5000/api/settings/attendance-window', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAttendanceWindow(data))
      .catch(err => console.error(err));
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res1 = await fetch('http://localhost:5000/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...schedule, timezone: 'local' })
      });

      const res2 = await fetch('http://localhost:5000/api/settings/attendance-window', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceWindow)
      });

      if (res1.ok && res2.ok) {
        setSuccessMsg('All settings updated successfully.');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setSuccessMsg('Failed to update some settings. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setSuccessMsg('An error occurred. Please try again.');
    }
    setIsSaving(false);
  };

  return (
    <div className="slide-up">
      <div className="dashboard-header">
        <h1>Global Settings</h1>
        <p className="subtitle">Configure admin controls and global tracker policies.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
        
        {/* Card 1: Tracking Work Hours */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Clock size={24} className="text-muted" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Global Tracking Schedule</h2>
          </div>

          <div className="alert-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe', marginBottom: '2rem', display: 'flex', gap: '0.5rem', padding: '1rem', borderRadius: '8px' }}>
            <Info size={20} color="#2563eb" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.85rem', color: '#1e3a8a', margin: 0 }}>
              Desktop Agents will only capture screenshots and application data during these working hours. Modifying this will automatically update all deployed trackers within 60 seconds.
            </p>
          </div>

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Start Hour (24H)</label>
              <input 
                type="number" 
                min="0" max="23" 
                className="auth-input" 
                value={schedule.startHour}
                onChange={e => setSchedule({...schedule, startHour: parseInt(e.target.value)})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Start Minute</label>
              <input 
                type="number" 
                min="0" max="59" 
                className="auth-input" 
                value={schedule.startMinute}
                onChange={e => setSchedule({...schedule, startMinute: parseInt(e.target.value)})} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>End Hour (24H)</label>
              <input 
                type="number" 
                min="0" max="23" 
                className="auth-input" 
                value={schedule.endHour}
                onChange={e => setSchedule({...schedule, endHour: parseInt(e.target.value)})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>End Minute</label>
              <input 
                type="number" 
                min="0" max="59" 
                className="auth-input" 
                value={schedule.endMinute}
                onChange={e => setSchedule({...schedule, endMinute: parseInt(e.target.value)})} 
                required 
              />
            </div>
          </div>
        </div>

        {/* Card 2: Manual Attendance Window */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <CalendarRange size={24} className="text-muted" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Scheduled Manual Attendance Window</h2>
          </div>

          <div className="alert-card" style={{ background: '#fef3c7', borderColor: '#fde68a', marginBottom: '2rem', display: 'flex', gap: '0.5rem', padding: '1rem', borderRadius: '8px' }}>
            <Info size={20} color="#d97706" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.85rem', color: '#78350f', margin: 0 }}>
              When enabled, employees must manually clock in through their dashboard. They will only be allowed to check in during the specified time window. Desktop Agents will only log hours for employees who have manually checked in.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input 
                type="checkbox" 
                id="attendanceModeToggle"
                checked={attendanceWindow.enabled}
                onChange={e => setAttendanceWindow({...attendanceWindow, enabled: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="attendanceModeToggle" style={{ fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                Enable Scheduled Manual Attendance Mode
              </label>
            </div>

            <div className="form-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1.5rem',
              opacity: attendanceWindow.enabled ? 1 : 0.5,
              pointerEvents: attendanceWindow.enabled ? 'auto' : 'none',
              transition: 'opacity 0.2s ease'
            }}>
              <div className="form-group">
                <label>Attendance Window Start Time</label>
                <input 
                  type="time" 
                  className="auth-input" 
                  value={attendanceWindow.startTime}
                  onChange={e => setAttendanceWindow({...attendanceWindow, startTime: e.target.value})} 
                  required={attendanceWindow.enabled}
                />
              </div>
              <div className="form-group">
                <label>Attendance Window End Time</label>
                <input 
                  type="time" 
                  className="auth-input" 
                  value={attendanceWindow.endTime}
                  onChange={e => setAttendanceWindow({...attendanceWindow, endTime: e.target.value})} 
                  required={attendanceWindow.enabled}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
          <span style={{ color: 'var(--success-color)', fontSize: '0.95rem', fontWeight: 600 }}>{successMsg}</span>
          <button type="submit" className="primary-btn" disabled={isSaving} style={{ minWidth: '160px' }}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
