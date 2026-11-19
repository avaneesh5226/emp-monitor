import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2, Clock, Target, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let result;
    if (isLogin) {
      result = await login(username, password);
    } else {
      result = await register(username, password, role === 'employee' ? employeeId.trim() : null);
    }

    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    setIsLoading(true);
    setError('');
    const result = await googleLogin(response.credential);
    setIsLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInButton"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="auth-layout fade-in">
      {/* Left Info Panel */}
      <div className="auth-info-panel">
        <div className="auth-info-content">
          <div className="logo-badge">
            <ShieldAlert size={18} style={{ color: '#60a5fa' }} />
            <span>EmpMonitor Enterprise v2.0</span>
          </div>
          <h1 className="auth-title">Workplace productivity, beautifully visualised.</h1>
          <p className="auth-description">
            EmpMonitor provides corporate administrators with transparent, secure, and real-time insights into remote workforce metrics, focus habits, and project logs.
          </p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ color: '#059669', background: '#ecfdf5' }}>
                <Clock size={20} />
              </div>
              <div>
                <h4>Scheduled Attendance Windows</h4>
                <p>Verifiable manual clock-in times custom-tailored by corporate administrators.</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ color: '#2563eb', background: '#eff6ff' }}>
                <Target size={20} />
              </div>
              <div>
                <h4>Focus & Application Insights</h4>
                <p>Detailed application usage metrics categorised dynamically by focus scores.</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ color: '#d97706', background: '#fffbeb' }}>
                <Camera size={20} />
              </div>
              <div>
                <h4>Screen Capture Timeline</h4>
                <p>Automated desktop logs providing an audit trail for payroll transparency.</p>
              </div>
            </div>
          </div>
          <div className="auth-info-footer">
            © 2026 EmpMonitor System. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-card slide-up">
          <div className="auth-header">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="subtitle" style={{ margin: '0.25rem 0 0 0' }}>
              {isLogin ? 'Sign in to access your dashboard' : 'Create your account'}
            </p>
          </div>

          {error && (
            <div className="auth-error fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>Register As</label>
                  <select 
                    className="auth-input" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>

                {role === 'employee' && (
                  <div className="form-group fade-in">
                    <label>Employee ID</label>
                    <input 
                      type="text" 
                      className="auth-input" 
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required={role === 'employee'} 
                      placeholder="EMP-2026-001-XXXX"
                    />
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                className="auth-input" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                placeholder="Enter username"
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="auth-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="Enter password"
              />
            </div>

            <button type="submit" className="primary-btn auth-submit" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isLoading ? <Loader2 className="spinner" size={18} /> : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </form>

          <div className="auth-divider">
            <span>or sign in with</span>
          </div>

          <div id="googleSignInButton" className="google-btn-container"></div>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button className="text-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
