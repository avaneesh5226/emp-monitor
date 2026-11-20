import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import UsageChart from '../components/UsageChart';
import ShotLight from '../components/ShotLight';
import { localDateString } from '../utils/dates';

const isDone = (status) => status === 'Completed' || status === 'Done';

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
        const empRes = await fetch(`/api/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!empRes.ok) throw new Error('Failed to load employee details');
        const empData = await empRes.json();
        setProfile(empData);

        const anaRes = await fetch(`/api/analytics/employee/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (anaRes.ok) setAnalytics(await anaRes.json());

        const attRes = await fetch(`/api/attendance/employee/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (attRes.ok) setAttendanceHistory(await attRes.json());

        const taskRes = await fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (taskRes.ok) {
          const allTasks = await taskRes.json();
          setEmployeeTasks(allTasks.filter((task) => task.assignedTo === empData.name));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load employee profile');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, token]);

  useEffect(() => {
    if (!id) return;
    const socket = io();
    socket.on('screenshot_uploaded', (data) => {
      if (data.employeeId !== id) return;
      setAnalytics((prev) => {
        if (!prev) return prev;
        const currentShots = prev.screenshots || [];
        if (currentShots.some((shot) => shot.url === data.screenshot.url)) return prev;
        return { ...prev, screenshots: [data.screenshot, ...currentShots] };
      });
    });
    return () => socket.disconnect();
  }, [id]);

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

  if (loading) return <div className="page-loading">Opening the record</div>;
  if (error || !employee) {
    return (
      <div className="page">
        <button className="secondary-btn" onClick={() => navigate('/employees')}>Back to people</button>
        <p className="text-red">{error || 'This person is not in the directory.'}</p>
      </div>
    );
  }

  const today = localDateString();
  const todayAttendance = attendanceHistory.find((log) => log.date === today);
  const employed = String(employee.status || '').toLowerCase() === 'active';
  const clockedIn = todayAttendance?.status === 'Active';
  const focusLabel = analytics?.topApps?.length ? `${analytics.productivityScore}%` : '—';

  return (
    <div className="page">
      <div className="back-link">
        <button className="secondary-btn" onClick={() => navigate('/employees')}>Back to people</button>
      </div>

      <header className="profile-band">
        <div className="avatar lg">{employee.name.charAt(0)}</div>
        <div>
          <div className="identity">
            <h1>{employee.name}</h1>
            <span className={`status-badge ${employed ? 'active' : 'inactive'}`}>
              {employee.status}
            </span>
            {clockedIn && (
              <span className="status-badge active"><span className="live-dot" />In</span>
            )}
          </div>
          <p className="subtitle">{employee.role} · {employee.department}</p>
          <div className="facts">
            <span>{employee.id}</span>
            <span>{employee.location || 'Remote'}</span>
            <span>Joined {employee.joinDate}</span>
          </div>
        </div>
      </header>

      <section className="ledger cols-3">
        <div className="ledger-cell">
          <span className="kicker">Focus</span>
          <span className="figure">{focusLabel}</span>
          <span className="meta">Today’s application mix</span>
        </div>
        <div className="ledger-cell">
          <span className="kicker">Clock in</span>
          <span className="figure clock-figure">{todayAttendance ? todayAttendance.clockIn : '—'}</span>
          <span className="meta">First stamp today</span>
        </div>
        <div className="ledger-cell">
          <span className="kicker">Hours</span>
          <span className="figure clock-figure">{todayAttendance ? todayAttendance.activeHours : '—'}</span>
          <span className="meta">Counted so far</span>
        </div>
      </section>

      <div className="split">
        <section className="panel card">
          <h2 className="card-title">Applications</h2>
          <UsageChart apps={analytics?.topApps} empty="No application time logged today." />
        </section>

        <div className="stack">
          <section className="panel card">
            <h2 className="card-title">Assigned tasks</h2>
            {employeeTasks.length === 0 && <p className="text-muted">Nothing is assigned by name.</p>}
            {employeeTasks.map((task) => (
              <article className={isDone(task.status) ? 'task-card is-done' : 'task-card'} key={task.id}>
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span className="status-badge">{task.status}</span>
                  {task.urgency ? ` · ${task.urgency}` : ''}
                  {task.dueDate ? ` · due ${task.dueDate}` : ''}
                </div>
              </article>
            ))}
          </section>

          <section className="panel card table-card">
            <div className="section-head" style={{ padding: '16px 16px 0' }}>
              <h2 className="card-title">Attendance</h2>
            </div>
            {attendanceHistory.length === 0 ? (
              <p className="text-muted" style={{ padding: '0 16px 16px' }}>No clock history.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>In</th>
                      <th>Out</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((log) => (
                      <tr key={log.id}>
                        <td>{log.date}</td>
                        <td><span className={`status-badge ${String(log.status).toLowerCase() === 'active' ? 'active' : 'inactive'}`}>{log.status}</span></td>
                        <td>{log.clockIn}</td>
                        <td>{log.clockOut}</td>
                        <td>{log.activeHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="panel card" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2 className="card-title">Screens</h2>
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
          <p className="text-muted">No captures today.</p>
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

export default EmployeeAnalytics;
