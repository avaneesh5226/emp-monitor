import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import UsageChart from '../components/UsageChart';
import ShotLight from '../components/ShotLight';
import { localDateString } from '../utils/dates';

const isDone = (status) => status === 'Completed' || status === 'Done';

const nextStatus = (current) => {
  if (current === 'To Do') return 'In Progress';
  if (current === 'In Progress') return 'Completed';
  return 'To Do';
};

const EmployeeDashboard = () => {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShotIndex, setSelectedShotIndex] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [windowSettings, setWindowSettings] = useState({ enabled: false, startTime: '09:00', endTime: '11:00' });
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB'));
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const employeeId = user?.employeeId;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-GB')), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;
    if (!employeeId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const empRes = await fetch('/api/employees', { headers });
        const emps = await empRes.json();
        const myProfile = emps.find((employee) => employee.id === employeeId);
        setProfile(myProfile);

        const anaRes = await fetch(`/api/analytics/employee/${employeeId}`, { headers });
        setAnalytics(await anaRes.json());

        const taskRes = await fetch('/api/tasks', { headers });
        const allTasks = await taskRes.json();
        if (myProfile) setTasks(allTasks.filter((task) => task.assignedTo === myProfile.name));

        const attRes = await fetch('/api/attendance/today', { headers });
        if (attRes.ok) setAttendance(await attRes.json());

        const winRes = await fetch('/api/settings/attendance-window', { headers });
        if (winRes.ok) setWindowSettings(await winRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    const socket = io();
    socket.on('screenshot_uploaded', (data) => {
      if (data.employeeId !== employeeId) return;
      setAnalytics((prev) => {
        if (!prev) return prev;
        const currentShots = prev.screenshots || [];
        if (currentShots.some((shot) => shot.url === data.screenshot.url)) return prev;
        return { ...prev, screenshots: [data.screenshot, ...currentShots] };
      });
    });
    return () => socket.disconnect();
  }, [employeeId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedShotIndex === null) return;
      if (e.key === 'ArrowLeft' && selectedShotIndex > 0) setSelectedShotIndex((prev) => prev - 1);
      else if (e.key === 'ArrowRight' && selectedShotIndex < (analytics?.screenshots?.length - 1)) setSelectedShotIndex((prev) => prev + 1);
      else if (e.key === 'Escape') setSelectedShotIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShotIndex, analytics]);

  const handleTaskStatusChange = async (taskId, currentStatus) => {
    const status = nextStatus(currentStatus);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
    } catch (err) {
      console.error(err);
    }
  };

  const postAttendance = async (path) => {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'That did not save.');
        return null;
      }
      return data;
    } catch (err) {
      console.error(err);
      setActionError('The request failed.');
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockIn = async () => {
    const data = await postAttendance('/api/attendance/clock-in');
    if (!data) return;
    setAttendance({
      clockIn: data.clockIn,
      clockOut: '--',
      status: 'Active',
      date: localDateString()
    });
  };

  const handleClockOut = async () => {
    const data = await postAttendance('/api/attendance/clock-out');
    if (!data) return;
    setAttendance((prev) => ({ ...prev, clockOut: data.clockOut, status: 'Inactive' }));
  };

  const isWithinWindow = () => {
    if (!windowSettings.enabled) return true;
    const now = new Date();
    const [startH, startM] = windowSettings.startTime.split(':').map(Number);
    const [endH, endM] = windowSettings.endTime.split(':').map(Number);
    const curVal = now.getHours() * 60 + now.getMinutes();
    return curVal >= startH * 60 + startM && curVal <= endH * 60 + endM;
  };

  if (loading) return <div className="page-loading">Opening your day</div>;
  if (!profile) return <div className="page"><p className="text-red">Your employee profile is missing. Ask an administrator to attach an ID.</p></div>;

  const outside = windowSettings.enabled && !isWithinWindow();

  return (
    <div className="page">
      <div className="dashboard-header">
        <span className="kicker">{profile.department}</span>
        <h1>{profile.name}</h1>
        <p className="subtitle">{profile.role}. Clock in, then the day is counted.</p>
      </div>

      <div className="split-wide">
        <section className="panel clock-panel">
          <div className="clock-top">
            <div>
              <span className="kicker">Attendance</span>
              <p className="subtitle">Now {currentTime}</p>
            </div>
            <span className={`status-badge ${attendance?.status === 'Active' ? 'active' : attendance ? 'inactive' : 'warning'}`}>
              {attendance?.status === 'Active' && <span className="live-dot" />}
              {attendance?.status === 'Active' ? 'In' : attendance ? 'Out' : 'Not in'}
            </span>
          </div>
          <div className="clock-bottom">
            <div>
              <div className="pair">In <strong>{attendance ? attendance.clockIn : '—'}</strong></div>
              <div className="pair">Out <strong>{attendance ? attendance.clockOut : '—'}</strong></div>
            </div>
            <div>
              {windowSettings.enabled && !attendance && (
                <p className="meta">Window {windowSettings.startTime}–{windowSettings.endTime}</p>
              )}
              {!attendance && (
                <button className="primary-btn btn-good" onClick={handleClockIn} disabled={actionLoading || outside}>
                  {outside ? 'Outside the window' : 'Clock in'}
                </button>
              )}
              {attendance?.status === 'Active' && (
                <button className="primary-btn btn-danger" onClick={handleClockOut} disabled={actionLoading}>Clock out</button>
              )}
              {attendance && attendance.status !== 'Active' && (
                <button className="secondary-btn" disabled>Day closed</button>
              )}
            </div>
          </div>
          {actionError && <p className="text-red">{actionError}</p>}
        </section>

        <section className="panel card">
          <span className="kicker">Focus</span>
          <span className="figure">{analytics?.topApps?.length ? `${analytics.productivityScore}%` : '—'}</span>
          <p className="meta">From the applications open today</p>
        </section>
      </div>

      <div className="split">
        <section className="panel card">
          <h2 className="card-title">Applications</h2>
          <UsageChart apps={analytics?.topApps} empty="No application time yet today." />
        </section>
        <section className="panel card">
          <h2 className="card-title">Your tasks</h2>
          {tasks.length === 0 && <p className="text-muted">Nothing is assigned to you.</p>}
          {tasks.map((task) => (
            <article className={isDone(task.status) ? 'task-card is-done' : 'task-card'} key={task.id}>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <div className="task-meta">
                <button className="text-btn" type="button" onClick={() => handleTaskStatusChange(task.id, task.status)}>
                  {task.status} · advance
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>

      <section className="panel card" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2 className="card-title">Your screens</h2>
          <span className="status-badge">{analytics?.screenshots?.length || 0} today</span>
        </div>
        {analytics?.screenshots?.length ? (
          <div className="shot-grid">
            {analytics.screenshots.map((shot, idx) => (
              <button className="shot-card" type="button" key={shot.url} onClick={() => setSelectedShotIndex(idx)}>
                <img src={shot.url} alt={`Capture at ${shot.time}`} />
                <span className="shot-time">{shot.time}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted">No captures yet today.</p>
        )}
      </section>

      <ShotLight
        shots={analytics?.screenshots}
        index={selectedShotIndex}
        onClose={() => setSelectedShotIndex(null)}
        onIndex={setSelectedShotIndex}
      />
    </div>
  );
};

export default EmployeeDashboard;
