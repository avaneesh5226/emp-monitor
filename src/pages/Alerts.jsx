import React from 'react';

const Alerts = () => {
  return (
    <div className="slide-up">
      <div className="dashboard-header">
        <h1>Security Alerts</h1>
        <p className="subtitle">Review and manage recent security warnings and insider threats.</p>
      </div>
      
      <div className="card p-6 border-red">
        <h2 className="card-title text-red">High Priority Alerts</h2>
        <div className="empty-state">
          <p className="text-muted">Security alert module will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
