import React, { useState } from 'react';

const EditUserForm = ({ user, onUpdate, onCancel }) => {
  const [updatedUser, setUpdatedUser] = useState({
    id: user.id,
    email: user.email,
    password: user.password || '', // Mật khẩu có thể để trống nếu không muốn cập nhật
    role: user.role || 'User',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser({ ...updatedUser, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!updatedUser.email) {
      alert('Vui lòng điền email.');
      return;
    }
    onUpdate(updatedUser);
  };

  return (
    <div className="edit-user-form" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '20px' }}>
      <h3>Chỉnh sửa người dùng</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email: </label>
          <input
            type="email"
            name="email"
            value={updatedUser.email}
            onChange={handleChange}
            style={{ padding: '5px', width: '200px', marginLeft: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mật khẩu (để trống nếu không muốn thay đổi): </label>
          <input
            type="password"
            name="password"
            value={updatedUser.password}
            onChange={handleChange}
            style={{ padding: '5px', width: '200px', marginLeft: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Vai trò: </label>
          <select
            name="role"
            value={updatedUser.role}
            onChange={handleChange}
            style={{ padding: '5px', marginLeft: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}
        >
          Lưu
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '5px 10px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Hủy
        </button>
      </form>
    </div>
  );
};

export default EditUserForm;