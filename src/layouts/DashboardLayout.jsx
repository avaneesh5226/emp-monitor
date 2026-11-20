import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

const ADMIN_LINKS = [
  { to: '/dashboard', label: 'Overview', idx: '01' },
  { to: '/employees', label: 'People', idx: '02' },
  { to: '/attendance', label: 'Attendance', idx: '03' },
  { to: '/projects', label: 'Tasks', idx: '04' },
  { to: '/alerts', label: 'Alerts', idx: '05' },
  { to: '/settings', label: 'Hours', idx: '06' },
];

const STAFF_LINKS = [
  { to: '/dashboard', label: 'Today', idx: '01' },
  { to: '/projects', label: 'Tasks', idx: '02' },
];

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const links = user?.role === 'admin' ? ADMIN_LINKS : STAFF_LINKS;
  const dateLabel = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark">em</div>
          <div>
            <h2 className="brand-name">EmpMonitor</h2>
            <span className="brand-sub">Floor record</span>
          </div>
        </div>
        <nav className="rail-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'rail-link active' : 'rail-link')}
            >
              <span className="rail-idx">{link.idx}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="rail-foot">
          <p className="who-name">{user?.username || 'Signed in'}</p>
          <p className="who-role">{user?.role === 'admin' ? 'Administrator' : 'Employee'}</p>
          <button
            className="signout"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="stage">
        <header className="stage-bar">
          <span className="stage-kicker">{dateLabel}</span>
          <span className="clock-read">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </header>
        <main className="stage-body">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
