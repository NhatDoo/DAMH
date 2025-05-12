import React, { useState } from 'react';
import AddUserForm from './AddUserForm';
import * as apiService from '../../services/apiService';

const AdminPanel = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [users, setUsers] = useState([]);

  const handleAddUser = async (newUser) => {
    try {
      const response = await apiService.addUser(newUser);
      setUsers([...users, response]);
      setShowAddForm(false);
      alert('Thêm người dùng thành công!');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Có lỗi khi thêm người dùng.');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Panel</h1>
      <p>Welcome to the admin dashboard!</p>
      <button
        onClick={() => setShowAddForm(true)}
        style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', marginBottom: '20px' }}
      >
        Thêm người dùng
      </button>
      {showAddForm && (
        <AddUserForm onAdd={handleAddUser} onCancel={handleCancel} />
      )}
      <h3>Danh sách người dùng</h3>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.name} ({user.email}) - {user.role}</li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPanel;