import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  const guestToken = localStorage.getItem('guest_token');
  const token = accessToken || guestToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  console.error('API Error:', error.response?.data || error.message);
  return Promise.reject(error);
});

// Legacy apiFetch using standard fetch (kept for backward compatibility with other files)
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem('access_token');
  const guestToken = localStorage.getItem('guest_token');

  const token = accessToken || guestToken;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}
