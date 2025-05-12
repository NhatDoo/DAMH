import React, { useState } from 'react';

const AddUserForm = ({ onAdd, onCancel }) => {
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    onAdd(newUser);
  };

  return (
    <div className="add-user-form" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '20px' }}>
      <h3>Thêm người dùng mới</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Tên: </label>
          <input
            type="text"
            name="name"
            value={newUser.name}
            onChange={handleChange}
            style={{ padding: '5px', width: '200px', marginLeft: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email: </label>
          <input
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleChange}
            style={{ padding: '5px', width: '200px', marginLeft: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mật khẩu: </label>
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleChange}
            style={{ padding: '5px', width: '200px', marginLeft: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Vai trò: </label>
          <select
            name="role"
            value={newUser.role}
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
          Thêm
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

export default AddUserForm;