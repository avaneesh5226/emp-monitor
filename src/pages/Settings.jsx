import React, { useEffect, useState } from 'react';
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
    const headers = { Authorization: `Bearer ${token}` };
    fetch('/api/schedule', { headers })
      .then((res) => res.json())
      .then((data) => setSchedule(data))
      .catch((err) => console.error(err));
    fetch('/api/settings/attendance-window', { headers })
      .then((res) => res.json())
      .then((data) => setAttendanceWindow(data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nextSchedule = {
      startHour: Number(data.get('startHour')),
      startMinute: Number(data.get('startMinute')),
      endHour: Number(data.get('endHour')),
      endMinute: Number(data.get('endMinute')),
      timezone: 'local'
    };
    const nextWindow = {
      enabled: data.get('manualClockIn') === 'on',
      startTime: String(data.get('startTime') || '09:00'),
      endTime: String(data.get('endTime') || '11:00')
    };
    setSchedule(nextSchedule);
    setAttendanceWindow(nextWindow);
    setSuccessMsg('');
    setIsSaving(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      const res1 = await fetch('/api/schedule', {
        method: 'POST',
        headers,
        body: JSON.stringify(nextSchedule)
      });
      const res2 = await fetch('/api/settings/attendance-window', {
        method: 'POST',
        headers,
        body: JSON.stringify(nextWindow)
      });
      setSuccessMsg(res1.ok && res2.ok ? 'Hours saved. Trackers pick this up within a minute.' : 'One of the saves failed.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setSuccessMsg('The save did not go through.');
    }
    setIsSaving(false);
  };

  const setHour = (key) => (e) => {
    const value = parseInt(e.target.value, 10);
    setSchedule({ ...schedule, [key]: Number.isNaN(value) ? 0 : value });
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <span className="kicker">Policy</span>
        <h1>Hours</h1>
        <p className="subtitle">When the desktop agent may record, and when people may clock in by hand.</p>
      </div>

      <form onSubmit={handleSave} className="settings-form">
        <section className="panel card">
          <h2 className="card-title">Capture window</h2>
          <div className="note">
            <p>Screenshots and application names are taken only between these times. Agents read the change within a minute.</p>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="start-hour">Start hour</label>
              <input id="start-hour" name="startHour" type="number" min="0" max="23" className="auth-input" value={schedule.startHour} onChange={setHour('startHour')} required />
            </div>
            <div className="form-group">
              <label htmlFor="start-minute">Start minute</label>
              <input id="start-minute" name="startMinute" type="number" min="0" max="59" className="auth-input" value={schedule.startMinute} onChange={setHour('startMinute')} required />
            </div>
            <div className="form-group">
              <label htmlFor="end-hour">End hour</label>
              <input id="end-hour" name="endHour" type="number" min="0" max="23" className="auth-input" value={schedule.endHour} onChange={setHour('endHour')} required />
            </div>
            <div className="form-group">
              <label htmlFor="end-minute">End minute</label>
              <input id="end-minute" name="endMinute" type="number" min="0" max="59" className="auth-input" value={schedule.endMinute} onChange={setHour('endMinute')} required />
            </div>
          </div>
        </section>

        <section className="panel card">
          <h2 className="card-title">Manual clock-in</h2>
          <div className="note warn">
            <p>When this is on, people clock in from their own page, and only inside the window below. The agent counts hours after that clock-in.</p>
          </div>
          <div className="switch-row">
            <input
              type="checkbox"
              id="attendanceModeToggle"
              name="manualClockIn"
              checked={attendanceWindow.enabled}
              onChange={(e) => setAttendanceWindow({ ...attendanceWindow, enabled: e.target.checked })}
            />
            <label htmlFor="attendanceModeToggle">Require a manual clock-in</label>
          </div>
          <div className={`form-grid ${attendanceWindow.enabled ? '' : 'dimmed'}`}>
            <div className="form-group">
              <label htmlFor="window-opens">Window opens</label>
              <input id="window-opens" name="startTime" type="time" className="auth-input" value={attendanceWindow.startTime} onChange={(e) => setAttendanceWindow({ ...attendanceWindow, startTime: e.target.value })} required={attendanceWindow.enabled} />
            </div>
            <div className="form-group">
              <label htmlFor="window-closes">Window closes</label>
              <input id="window-closes" name="endTime" type="time" className="auth-input" value={attendanceWindow.endTime} onChange={(e) => setAttendanceWindow({ ...attendanceWindow, endTime: e.target.value })} required={attendanceWindow.enabled} />
            </div>
          </div>
        </section>

        <div className="settings-actions">
          <span className="save-note">{successMsg}</span>
          <button type="submit" className="primary-btn" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save hours'}</button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
