import React from 'react';

const UserList = ({ users, onEdit, onDelete }) => {
  return (
    <div className="user-list">
      <h3>Danh sách người dùng</h3>
      {users.length === 0 ? (
        <p>Không có người dùng nào.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: '#f4f4f4' }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: '#f4f4f4' }}>Tên</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: '#f4f4f4' }}>Email</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: '#f4f4f4' }}>Vai trò</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: '#f4f4f4' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.name || 'N/A'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.email}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.role}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <button
                    onClick={() => onEdit(user)}
                    style={{ padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', marginRight: '5px' }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserList;