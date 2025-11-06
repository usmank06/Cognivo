// Frontend API client - calls the Express API instead of importing MongoDB directly

const API_URL = 'http://localhost:3001/api';

export async function registerUser(email: string, username: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to connect to server' };
  }
}

export async function loginUser(username: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to connect to server' };
  }
}

export async function getUserData(username: string) {
  try {
    const response = await fetch(`${API_URL}/user/${username}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to connect to server' };
  }
}

export async function changePassword(username: string, currentPassword: string, newPassword: string) {
  try {
    const response = await fetch(`${API_URL}/user/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, currentPassword, newPassword }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to connect to server' };
  }
}

export async function deleteUserAccount(username: string) {
  try {
    const response = await fetch(`${API_URL}/user/${username}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to connect to server' };
  }
}

export async function updateTokenUsage(username: string, tokens: number, cost: number) {
  try {
    const response = await fetch(`${API_URL}/user/track-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, tokens, cost }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to connect to server' };
  }
}
