import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Projects from './pages/Projects';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import EmployeeAnalytics from './pages/EmployeeAnalytics';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Login from './pages/Login';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AdminRoute = ({ children }) => {
  const { token, user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

const DashboardSelector = () => {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Dashboard /> : <EmployeeDashboard />;
};

const routerBasename = import.meta.env.BASE_URL === '/'
  ? undefined
  : import.meta.env.BASE_URL.replace(/\/$/, '');

function App() {
  return (
    <AuthProvider>
      <Router basename={routerBasename}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Protected Routes wrapped in DashboardLayout */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardSelector /></ProtectedRoute>} />
          <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
          <Route path="/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/alerts" element={<AdminRoute><Alerts /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          <Route path="/analytics/:id" element={<AdminRoute><EmployeeAnalytics /></AdminRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
