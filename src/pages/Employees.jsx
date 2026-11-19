import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreVertical, Plus, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Employees = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth();
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', role: '', department: '', location: '', joinDate: new Date().toISOString().split('T')[0]
  });

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const res = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchEmployees();
        setFormData({ name: '', role: '', department: '', location: '', joinDate: new Date().toISOString().split('T')[0] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="slide-up">
      <div className="page-header-flex">
        <div className="dashboard-header" style={{ marginBottom: 0 }}>
          <h1>Employee Directory</h1>
          <p className="subtitle">Manage and view details of all {employees.length} employees in your organization.</p>
        </div>
        <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          Add Employee
        </button>
      </div>
      
      <div className="card table-card">
        <div className="table-toolbar">
          <div className="header-search table-search">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, role, or department..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <button className="secondary-btn"><Filter size={16} /> Filters</button>
            <button className="secondary-btn">Export</button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Role & Department</th>
                <th>Location</th>
                <th>Status</th>
                <th>Join Date</th>
                <th className="action-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp, index) => (
                  <tr key={emp.id} className={`fade-in stagger-${(index % 4) + 1}`}>
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
                    <td className="text-muted">{emp.location}</td>
                    <td>
                      <span className={`status-badge ${emp.status.toLowerCase().replace(' ', '-')}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="text-muted">{emp.joinDate}</td>
                    <td className="action-cell">
                      <button className="secondary-btn" onClick={() => navigate(`/analytics/${emp.id}`)} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state sm">
                      <p className="text-muted">No employees found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content slide-up">
            <div className="modal-header">
              <h3>Add New Employee</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="auth-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" className="auth-input" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" className="auth-input" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" className="auth-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Join Date</label>
                  <input type="date" className="auth-input" required value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
