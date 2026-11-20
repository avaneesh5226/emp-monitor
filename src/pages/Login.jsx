import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleReady = Boolean(googleClientId) && !googleClientId.includes('YOUR_GOOGLE');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = isLogin
      ? await login(username, password)
      : await register(username, password, role === 'employee' ? employeeId.trim() : null);

    setIsLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  const handleGoogleCredentialResponse = async (response) => {
    setIsLoading(true);
    setError('');
    const result = await googleLogin(response.credential);
    setIsLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  useEffect(() => {
    if (!googleReady) return undefined;
    let cancelled = false;

    const initializeGoogle = () => {
      if (cancelled || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse
      });
      const node = document.getElementById('googleSignInButton');
      if (node) {
        node.innerHTML = '';
        window.google.accounts.id.renderButton(node, { theme: 'outline', size: 'large', width: 320 });
      }
    };

    if (window.google) initializeGoogle();
    else if (!document.querySelector('script[data-gsi]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.gsi = '1';
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }

    return () => { cancelled = true; };
  }, [isLogin, googleReady, googleClientId]);

  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <div className="auth-mark">EmpMonitor</div>
        <h1>The floor, as it is.</h1>
        <p>Clock-ins, the applications in front of people, and the screens behind the hours.</p>
        <ol className="auth-list">
          <li>
            <em>01</em>
            <div>
              <strong>Attendance window</strong>
              <span>Clock-in only inside the hours you set.</span>
            </div>
          </li>
          <li>
            <em>02</em>
            <div>
              <strong>Application mix</strong>
              <span>What stayed in front, and whether it counted as work.</span>
            </div>
          </li>
          <li>
            <em>03</em>
            <div>
              <strong>Screen record</strong>
              <span>A timed strip of captures, not a live camera.</span>
            </div>
          </li>
        </ol>
        <footer>Desk record · {new Date().getFullYear()}</footer>
      </aside>

      <main className="auth-main">
        <div className="auth-card slide-up">
          <span className="kicker">{isLogin ? 'Sign in' : 'New account'}</span>
          <h2>{isLogin ? 'Open the record' : 'Create a login'}</h2>
          <p className="subtitle">{isLogin ? 'Use the account an administrator issued.' : 'Employees need an ID that already exists in the directory.'}</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="auth-role">Register as</label>
                  <select id="auth-role" className="auth-input" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                {role === 'employee' && (
                  <div className="form-group">
                    <label htmlFor="auth-employee-id">Employee ID</label>
                    <input
                      id="auth-employee-id"
                      type="text"
                      className="auth-input"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                      placeholder="EMP-2026-001"
                    />
                  </div>
                )}
              </>
            )}
            <div className="form-group">
              <label htmlFor="auth-username">Username</label>
              <input id="auth-username" className="auth-input" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            </div>
            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input id="auth-password" type="password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isLogin ? 'current-password' : 'new-password'} />
            </div>
            <button type="submit" className="primary-btn auth-submit" disabled={isLoading}>
              {isLoading ? 'Checking…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {googleReady && (
            <>
              <div className="auth-divider"><span>or</span></div>
              <div id="googleSignInButton" className="google-btn-container" />
            </>
          )}
          <p className="auth-footer">
            {isLogin ? 'Need an account? ' : 'Already registered? '}
            <button className="text-btn" type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
