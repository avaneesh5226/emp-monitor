import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDateString } from '../utils/dates';

const dayKey = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return localDateString(date);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalEmployees: 0,
    activeToday: 0,
    avgProductivity: '—',
    alerts: 0
  });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch('/api/analytics/dashboard', { headers })
      .then((res) => res.json())
      .then((data) => { if (data && !data.error) setAnalytics(data); })
      .catch((err) => console.error(err));
    fetch(`/api/attendance?since=${dayKey(6)}`, { headers })
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setLogs(data); })
      .catch((err) => console.error(err));
  }, [token]);

  const week = [6, 5, 4, 3, 2, 1, 0].map((offset) => {
    const key = dayKey(offset);
    const count = logs.filter((log) => log.date === key).length;
    const label = new Date(`${key}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short' });
    return { key, label, count, today: offset === 0 };
  });
  const peak = Math.max(1, ...week.map((day) => day.count));

  return (
    <div className="page">
      <div className="page-header-flex">
        <div className="dashboard-header">
          <span className="kicker">Overview</span>
          <h1>{user?.username || 'Desk'}</h1>
          <p className="subtitle">Who is in, how the day is scoring, and the latest clock events.</p>
        </div>
        <a href="/api/download-tracker" className="primary-btn" download>Download tracker</a>
      </div>

      <section className="ledger">
        <button className="ledger-cell clickable" onClick={() => navigate('/employees')}>
          <span className="kicker">People</span>
          <span className="figure">{analytics.totalEmployees}</span>
          <span className="meta">In the directory</span>
        </button>
        <button className="ledger-cell clickable" onClick={() => navigate('/attendance')}>
          <span className="kicker">In now</span>
          <span className="figure">{analytics.activeToday}</span>
          <span className="meta">Still clocked in</span>
        </button>
        <div className="ledger-cell">
          <span className="kicker">Focus</span>
          <span className="figure">{analytics.avgProductivity}</span>
          <span className="meta">From today’s app mix</span>
        </div>
        <button className="ledger-cell clickable" onClick={() => navigate('/alerts')}>
          <span className="kicker">Alerts</span>
          <span className="figure">{analytics.alerts}</span>
          <span className="meta">No rule armed</span>
        </button>
      </section>

      <div className="work-grid">
        <section className="panel card">
          <div className="section-head">
            <h2 className="card-title">Seven days of clock-ins</h2>
          </div>
          {logs.length === 0 ? (
            <p className="text-muted">No attendance rows yet. The count appears after the first clock-in.</p>
          ) : (
            <div className="bars" aria-label="Clock-ins over the last seven days">
              {week.map((day, index) => (
                <div className="bar-col" key={day.key}>
                  <div
                    className={`bar${day.today ? ' is-today' : ''}${day.count ? ' has-count' : ''}`}
                    style={{ height: day.count ? `${(day.count / peak) * 100}%` : '0', animationDelay: `${index * 40}ms` }}
                    title={`${day.count} records`}
                  />
                  <span className="bar-label">{day.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel card">
          <div className="section-head">
            <h2 className="card-title">Latest clocks</h2>
            <button className="text-btn" onClick={() => navigate('/attendance')}>All</button>
          </div>
          {logs.length === 0 ? (
            <p className="text-muted">The feed stays empty until someone clocks in.</p>
          ) : (
            <ul className="feed">
              {logs.slice(0, 6).map((log) => (
                <li className="feed-item" key={log.id}>
                  <strong>{log.name}</strong>
                  <span>{log.status === 'Active' ? 'Clocked in' : 'Recorded'} · <time>{log.clockIn}</time> · {log.date}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
