import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { localDateString } from '../utils/dates';

const isDone = (status) => status === 'Completed' || status === 'Done';

const nextStatus = (current) => {
  if (current === 'To Do') return 'In Progress';
  if (current === 'In Progress') return 'Completed';
  return 'To Do';
};

const moveLabel = (current) => {
  if (current === 'To Do') return 'Start';
  if (current === 'In Progress') return 'Finish';
  return 'Reopen';
};

const Projects = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    const next = title.trim();
    if (!next) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: next,
          description: 'Added from the task board.',
          status: 'To Do',
          urgency: 'Normal',
          dueDate: localDateString()
        })
      });
      if (res.ok) {
        setTitle('');
        setError('');
        fetchTasks();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'The task did not save.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moveTask = async (task) => {
    const status = nextStatus(task.status);
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status } : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { name: 'To do', items: tasks.filter((task) => task.status === 'To Do') },
    { name: 'In progress', items: tasks.filter((task) => task.status === 'In Progress') },
    { name: 'Done', items: tasks.filter((task) => isDone(task.status)) }
  ];

  return (
    <div className="page">
      <div className="dashboard-header">
        <span className="kicker">Board</span>
        <h1>Tasks</h1>
        <p className="subtitle">Three columns. New work starts on the left.</p>
      </div>

      <form className="composer" onSubmit={handleAddTask}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing"
          aria-label="Task title"
        />
        <button className="primary-btn" type="submit">Add</button>
      </form>
      {error && <p className="text-red">{error}</p>}

      <div className="kanban-board">
        {columns.map((column) => (
          <section className="kanban-col" key={column.name}>
            <div className="col-header">
              <span>{column.name}</span>
              <span className="status-badge">{column.items.length}</span>
            </div>
            {column.items.length === 0 && <p className="text-muted">Nothing here.</p>}
            {column.items.map((task) => (
              <article className={isDone(task.status) ? 'task-card is-done' : 'task-card'} key={task.id}>
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                <div className="task-meta task-actions">
                  <span>{task.dueDate || 'No date'}{task.assignedTo ? ` · ${task.assignedTo}` : ''}</span>
                  <button className="text-btn" type="button" onClick={() => moveTask(task)}>{moveLabel(task.status)}</button>
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
};

export default Projects;
