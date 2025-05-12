import React, { useState, useEffect } from 'react';
import { logout } from '../services/apiService'; // Nhập hàm logout từ apiService.js
import { jwtDecode } from 'jwt-decode'; // Named export từ jwt-decode

const TopNav = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('JWT Payload:', decoded); // Debug: In payload để kiểm tra
        // Ưu tiên email, sau đó thử các trường khác
        const email = decoded.email || decoded.gmail || decoded.sub || decoded.username || 'User';
        setUserEmail(email);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserEmail('');
      }
    } else {
      setIsLoggedIn(false);
      setUserEmail('');
    }
  }, []);

  const handleLogout = () => {
    logout(); // Gọi hàm logout từ apiService.js
    setIsLoggedIn(false);
    setUserEmail('');
  };

  return (
    <div className="top-nav">
      <h1>Phân tích AHP</h1>
      <div className="auth-buttons">
        {isLoggedIn ? (
          <>
            <span className="welcome-message">Welcome, {userEmail}</span>
            <button onClick={handleLogout} className="button-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login" className="button-login">
              Login
            </a>
            <a href="/register" className="button-register">
              Register
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default TopNav;