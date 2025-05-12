import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/apiService';


const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const response = await forgotPassword(email);
            setSuccess(response.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message || 'Đã có lỗi xảy ra');
        }
    };

    return (
        <div className="auth-container">
            <h3 className="text-center mb-4">Quên mật khẩu</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100">Gửi link đặt lại</button>
            </form>
            <p className="text-center mt-3">
                <a href="/login">Quay lại đăng nhập</a>
            </p>
        </div>
    );
};

export default ForgotPassword;