import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgotPassword } from '../../services/apiService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await forgotPassword(email);
      toast.success(response.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(
        error.message.includes('404')
          ? 'Không tìm thấy người dùng với email này.'
          : error.message.includes('400')
          ? 'Email không hợp lệ.'
          : 'Có lỗi khi gửi email đặt lại mật khẩu.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Quên mật khẩu</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            style={{ padding: '5px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '5px 10px',
            width: '100%',
            backgroundColor: isSubmitting ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi link đặt lại'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        <a href="/login" style={{ color: '#007BFF', textDecoration: 'none' }}>Quay lại đăng nhập</a>
      </p>
    </div>
  );
};

export default ForgotPassword;