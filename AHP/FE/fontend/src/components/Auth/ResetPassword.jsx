import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/apiService';


const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!token) {
            setError('Token không hợp lệ');
            return;
        }
        try {
            const response = await resetPassword(token, newPassword);
            setSuccess(response.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message || 'Đã có lỗi xảy ra');
        }
    };

    return (
        <div className="auth-container">
            <h3 className="text-center mb-4">Đặt lại mật khẩu</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Mật khẩu mới</label>
                    <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100">Đặt lại mật khẩu</button>
            </form>
            <p className="text-center mt-3">
                <a href="/login">Quay lại đăng nhập</a>
            </p>
        </div>
    );
};

export default ResetPassword;