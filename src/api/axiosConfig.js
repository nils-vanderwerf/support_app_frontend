import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:9292/api', // Set your Rails API base URL here
  withCredentials: true, // Include cookies
});

// Attach stored auth token to every request
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export const setAuthToken = token => {
  if (token) localStorage.setItem('auth_token', token);
  else localStorage.removeItem('auth_token');
};

export default axiosInstance;
