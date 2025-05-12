const API_BASE_URL = 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const fetchAHPResults = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/ahp_results`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to fetch AHP results: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching AHP results:', error);
    throw error;
  }
};

export const fetchTchiUserAlternatives = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tchi_user/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch tchi_user alternatives: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching tchi_user alternatives:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const addTchiUser = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tchi_user/tchi_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add to tchi_user: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error adding tchi_user:', error);
    throw error;
  }
};


export const deleteTchiUser = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tchi_user/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to delete tchi_user: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error deleting tchi_user:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const updateTchiUser = async (id, data) => {
  try {

    const response = await fetch(`${API_BASE_URL}/tchi_user/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update tchi_user: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error updating tchi_user:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const recalculateScore = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alternatives/recalculate_score`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to recalculate score: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error recalculating score:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const calculateCR = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/criteria/criteria/calculate_cr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to calculate CR: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error calculating CR:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const rankAlternativesDirect = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alternatives/rank_alternatives_direct`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to rank alternatives: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error ranking alternatives:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const register = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(response.statusText || 'Failed to register');
    return response.json();
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

export const login = async (email, password, remember) => {
  try {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('remember', remember);

    const response = await fetch(`${API_BASE_URL}/users/token`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(response.statusText || 'Failed to login');
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error(response.statusText || 'Failed to send reset email');
    return response.json();
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('new_password', newPassword);

    const response = await fetch(`${API_BASE_URL}/users/reset-password/`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(response.statusText || 'Failed to reset password');
    return response.json();
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// Hàm quản lý người dùng cho AdminPanel
export const getUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const addUser = async (user) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error(`Failed to add user: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error adding user:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const updateUser = async (id, user) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error(`Failed to update user: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to delete user: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};