import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDateString } from '../utils/dates';

const emptyForm = () => ({
  name: '',
  role: '',
  department: '',
  location: '',
  joinDate: localDateString()
});

const Employees = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState(emptyForm);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchEmployees();
  }, [token]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormError('');
        setFormData(emptyForm());
        fetchEmployees();
      } else {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || 'Could not add this person.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = employees.filter((emp) =>
    [emp.name, emp.role, emp.department].some((value) =>
      String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const setField = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  return (
    <div className="page">
      <div className="page-header-flex">
        <div className="dashboard-header">
          <span className="kicker">Directory</span>
          <h1>People</h1>
          <p className="subtitle">{employees.length} names on the floor record.</p>
        </div>
        <button className="primary-btn" onClick={() => { setFormError(''); setIsModalOpen(true); }}>Add person</button>
      </div>

      <div className="card table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <input
              className="search-input"
              aria-label="Search people"
              placeholder="Name, role, or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Place</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar sm">{emp.name.charAt(0)}</div>
                      <div className="emp-info">
                        <span className="emp-name">{emp.name}</span>
                        <span className="emp-id">{emp.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="emp-info">
                      <span className="emp-role">{emp.role}</span>
                      <span className="emp-dept">{emp.department}</span>
                    </div>
                  </td>
                  <td className="text-muted">{emp.location || '—'}</td>
                  <td>
                    <span className={`status-badge ${String(emp.status || '').toLowerCase().replace(' ', '-')}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="text-muted">{emp.joinDate}</td>
                  <td>
                    <button className="secondary-btn" onClick={() => navigate(`/analytics/${emp.id}`)}>Open</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6"><div className="empty-state sm">No one matches that search.</div></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add a person</h3>
              <button className="icon-btn" type="button" onClick={() => setIsModalOpen(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleAddEmployee}>
              <div className="modal-body">
                {formError && <p className="text-red">{formError}</p>}
                <div className="form-grid">
                  <div className="form-group form-span">
                    <label htmlFor="person-name">Full name</label>
                    <input id="person-name" className="auth-input" required value={formData.name} onChange={setField('name')} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="person-role">Role</label>
                    <input id="person-role" className="auth-input" required value={formData.role} onChange={setField('role')} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="person-department">Department</label>
                    <input id="person-department" className="auth-input" required value={formData.department} onChange={setField('department')} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="person-location">Location</label>
                    <input id="person-location" className="auth-input" value={formData.location} onChange={setField('location')} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="person-joined">Join date</label>
                    <input id="person-joined" type="date" className="auth-input" required value={formData.joinDate} onChange={setField('joinDate')} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
