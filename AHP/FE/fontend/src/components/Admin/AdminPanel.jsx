import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AddUserForm from './AddUserForm';
import EditUserForm from './EditUserForm';
import * as apiService from '../../services/apiService';

const AdminPanel = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const fetchedUsers = await apiService.getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Có lỗi khi tải danh sách người dùng.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAddUser = async (newUser) => {
    try {
      const response = await apiService.addUser(newUser);
      setUsers([...users, response]);
      setShowAddForm(false);
      toast.success('Thêm người dùng thành công!');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(
        error.message.includes('400')
          ? 'Email đã được đăng ký hoặc dữ liệu không hợp lệ.'
          : 'Có lỗi khi thêm người dùng.'
      );
    }
  };

  const handleEditUser = async (updatedUser) => {
    try {
      const { id, ...userData } = updatedUser;
      const response = await apiService.updateUser(id, userData);
      setUsers(users.map((user) => (user.id === id ? response : user)));
      setShowEditForm(false);
      setEditingUser(null);
      toast.success('Cập nhật người dùng thành công!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(
        error.message.includes('404')
          ? 'Người dùng không tồn tại.'
          : error.message.includes('400')
          ? 'Dữ liệu không hợp lệ.'
          : 'Có lỗi khi cập nhật người dùng.'
      );
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
      await apiService.deleteUser(id);
      setUsers(users.filter((user) => user.id !== id));
      toast.success('Xóa người dùng thành công!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(
        error.message.includes('404')
          ? 'Người dùng không tồn tại.'
          : error.message.includes('400')
          ? 'ID người dùng không hợp lệ.'
          : 'Có lỗi khi xóa người dùng.'
      );
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingUser(null);
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleLogout = () => {
    apiService.logout();
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Panel</h1>
        <button
          onClick={handleLogout}
          style={{ padding: '5px 10px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Đăng xuất
        </button>
      </div>
      <p>Welcome to the admin dashboard!</p>
      <button
        onClick={() => {
          setShowAddForm(true);
          setShowEditForm(false);
          setEditingUser(null);
        }}
        style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', marginBottom: '20px' }}
      >
        Thêm người dùng
      </button>
      {(showAddForm || showEditForm) && (
        <div>
          {showAddForm ? (
            <AddUserForm onAdd={handleAddUser} onCancel={handleCancel} />
          ) : (
            <EditUserForm user={editingUser} onUpdate={handleEditUser} onCancel={handleCancel} />
          )}
        </div>
      )}
      <h3>Danh sách người dùng</h3>
      {isLoading ? (
        <div>Đang tải danh sách người dùng...</div>
      ) : users.length > 0 ? (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.email} - {user.role}
              <button
                onClick={() => startEditUser(user)}
                style={{ marginLeft: '10px', padding: '5px 10px', padding: '5px 10px', backgroundColor: '#FFC107', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Sửa
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#DC3545', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div>Không có người dùng nào.</div>
      )}
    </div>
  );
};

export default AdminPanel;