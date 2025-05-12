import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../../services/apiService';
import './AuthPage.css';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/register') {
      setIsLogin(false);
    }
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        console.log('Attempting login with email:', email); // Debug: In thông tin đăng nhập
        const response = await login(email, password, remember);
        console.log('Login successful, response:', response); // Debug: In kết quả đăng nhập
        setSuccess('Đăng nhập thành công!');
        if (onLogin) {
          await onLogin();
        }
        setTimeout(() => navigate('/'), 2000);
      } else {
        const response = await register(email, password);
        setSuccess(response.message || 'Đăng ký thành công!');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err) {
      console.error('Authentication error:', err.message); // Debug: In lỗi chi tiết
      setError(err.message || 'Đã có lỗi xảy ra');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <div
            onClick={() => setIsLogin(true)}
            className={`auth-tab ${isLogin ? 'active' : ''}`}
          >
            Đăng nhập
          </div>
          <div
            onClick={() => setIsLogin(false)}
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
          >
            Đăng ký
          </div>
        </div>
        <div className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isLogin && (
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label htmlFor="remember">Ghi nhớ mật khẩu</label>
              </div>
            )}
            <button type="submit" className="submit-button">
              {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </form>
          {isLogin && (
            <div className="forgot-password">
              <a href="/forgot-password">Quên mật khẩu?</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;