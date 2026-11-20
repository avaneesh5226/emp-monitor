import React from 'react';

const Alerts = () => {
  return (
    <div className="page">
      <div className="dashboard-header">
        <span className="kicker">Watch</span>
        <h1>Alerts</h1>
        <p className="subtitle">Warnings land here when a rule fires. Nothing is queued.</p>
      </div>
      <section className="panel card">
        <div className="section-head">
          <h2 className="card-title">Open</h2>
          <span className="status-badge">0</span>
        </div>
        <p className="text-muted">The desk is quiet. A late clock-in or a blocked capture will show as a row in this list.</p>
      </section>
    </div>
  );
};

export default Alerts;
