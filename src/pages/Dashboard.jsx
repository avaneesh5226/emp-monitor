import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, Zap, ShieldAlert, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalEmployees: 0,
    activeToday: 0,
    avgProductivity: '0%',
    alerts: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/analytics/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setAnalytics(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) fetchAnalytics();
  }, [token]);

  return (
    <>
      <div className="dashboard-header slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Overview</h1>
          <p className="subtitle">Welcome back, {user?.username || 'Admin'}. Here is your live productivity report.</p>
        </div>
        <a 
          href="http://localhost:5000/api/download-tracker" 
          className="primary-btn" 
          download
        >
          Download Desktop Tracker (.exe)
        </a>
      </div>

      <div className="stats-grid">
        <div className="card stat-card interactive slide-up stagger-1" onClick={() => navigate('/employees')}>
          <div className="stat-header">
            <h3>Total Employees</h3>
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={20} strokeWidth={2} />
            </div>
          </div>
          <p className="stat-value">{analytics.totalEmployees}</p>
          <p className="stat-trend positive">
            <TrendingUp size={16} />
            Synced from database
          </p>
          <div className="card-hover-indicator">View Directory →</div>
        </div>
        
        <div className="card stat-card interactive slide-up stagger-2" onClick={() => navigate('/attendance')}>
          <div className="stat-header">
            <h3>Active Today</h3>
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Activity size={20} strokeWidth={2} />
            </div>
          </div>
          <p className="stat-value">{analytics.activeToday}</p>
          <p className="stat-trend neutral">
            Employees clocked in today
          </p>
          <div className="card-hover-indicator">Live Tracker →</div>
        </div>
        
        <div className="card stat-card slide-up stagger-3">
          <div className="stat-header">
            <h3>Avg Productivity</h3>
            <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Zap size={20} strokeWidth={2} />
            </div>
          </div>
          <p className="stat-value">{analytics.avgProductivity}</p>
          <p className="stat-trend positive">
            <TrendingUp size={16} />
            Computed score
          </p>
        </div>
        
        <div className="card stat-card interactive alert-card slide-up stagger-4" onClick={() => navigate('/alerts')}>
          <div className="stat-header">
            <h3>Security Alerts</h3>
            <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <ShieldAlert size={20} strokeWidth={2} />
            </div>
          </div>
          <p className="stat-value">{analytics.alerts}</p>
          <p className="stat-trend negative">
            <ArrowDownRight size={16} />
            Requires immediate review
          </p>
          <div className="card-hover-indicator">Resolve Issues →</div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="card main-chart-card slide-up stagger-3">
          <div className="card-header-flex">
            <h2 className="card-title">Productivity Trends</h2>
            <button className="text-btn">Detailed Report</button>
          </div>
          <div className="chart-container">
            {[{day: 'Mon', h: '45%'}, {day: 'Tue', h: '65%'}, {day: 'Wed', h: '85%'}, {day: 'Thu', h: '70%'}, {day: 'Fri', h: '90%', active: true}, {day: 'Sat', h: '30%'}, {day: 'Sun', h: '25%'}].map((item, i) => (
              <div className="chart-bar-group" key={i}>
                <div className={`chart-bar ${item.active ? 'highlight' : ''}`} style={{height: item.h}}></div>
                <span className="chart-label">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card side-card interactive slide-up stagger-4" onClick={() => navigate('/projects')}>
          <div className="card-header-flex">
            <h2 className="card-title">Recent System Activity</h2>
            <button className="text-btn">View All</button>
          </div>
          <ul className="activity-list">
            <li className="activity-item fade-in">
              <span className="activity-dot blue"></span>
              <div className="activity-text">
                <p><strong>Database Sync</strong> completed</p>
                <small>Just now</small>
              </div>
            </li>
            <li className="activity-item fade-in stagger-1">
              <span className="activity-dot green"></span>
              <div className="activity-text">
                <p><strong>Admin Session</strong> started</p>
                <small>2 mins ago</small>
              </div>
            </li>
            <li className="activity-item fade-in stagger-2">
              <span className="activity-dot blue"></span>
              <div className="activity-text">
                <p><strong>Tracker Agent</strong> simulation active</p>
                <small>5 mins ago</small>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
