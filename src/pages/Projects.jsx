import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const [tasks, setTasks] = useState([]);
  const { token } = useAuth();

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const handleAddTask = async () => {
    const title = prompt('Enter task title:');
    if (!title) return;
    
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description: 'A new task for the team.',
          status: 'To Do',
          urgency: 'Normal',
          dueDate: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const toDos = tasks.filter(t => t.status === 'To Do');
  const inProgress = tasks.filter(t => t.status === 'In Progress');
  const completed = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="slide-up">
      <div className="page-header-flex">
        <div className="dashboard-header" style={{ marginBottom: 0 }}>
          <h1>Projects & Tasks</h1>
          <p className="subtitle">Track project progress and manage database-synced tasks.</p>
        </div>
        <button className="primary-btn" onClick={handleAddTask}>
          <Plus size={18} />
          New Task
        </button>
      </div>
      
      <div className="kanban-board">
        {/* TO DO Column */}
        <div className="kanban-col">
          <div className="col-header">
            <span>To Do</span>
            <span className="status-badge" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>{toDos.length}</span>
          </div>
          
          {toDos.map(task => (
            <div className="task-card fade-in" key={task.id}>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <div className="task-meta">
                <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} /> <span style={{ fontSize: '0.75rem' }}>{task.dueDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* IN PROGRESS Column */}
        <div className="kanban-col">
          <div className="col-header">
            <span>In Progress</span>
            <span className="status-badge" style={{ background: 'var(--bg-surface)', color: 'var(--accent-color)' }}>{inProgress.length}</span>
          </div>
          
          {inProgress.map(task => (
            <div className="task-card fade-in" key={task.id}>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
            </div>
          ))}
        </div>

        {/* COMPLETED Column */}
        <div className="kanban-col">
          <div className="col-header">
            <span>Completed</span>
            <span className="status-badge" style={{ background: 'var(--bg-surface)', color: 'var(--success-color)' }}>{completed.length}</span>
          </div>
          
          {completed.map(task => (
            <div className="task-card fade-in" key={task.id} style={{ opacity: 0.7 }}>
              <h4 style={{ textDecoration: 'line-through' }}>{task.title}</h4>
              <p>{task.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
