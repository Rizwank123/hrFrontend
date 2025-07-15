/* eslint-disable @typescript-eslint/no-require-imports */
import axios from 'axios';
import { getAuthState } from '../stores/authStore';

const api = axios.create({
  baseURL: 'https://local.api.mitrsewa.co/api/v1',
});

api.interceptors.request.use((config) => {
  const { token } = getAuthState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._isRetry) {
      console.log('403 detected, attempting token refresh...', originalRequest.url);
      originalRequest._isRetry = true;
      try {
        const { user } = getAuthState();
        const refresh_token = localStorage.getItem('refresh_token');
        if (user?.user_id && refresh_token) {
          console.log('Calling refresh endpoint with:', user.user_id, refresh_token);
          const refreshRes = await axios.get(
            `https://local.api.mitrsewa.co/api/v1/users/refresh?user_id=${user.user_id}&token=${refresh_token}`
          );
          if (refreshRes.status === 401) {
            // Refresh token is invalid/expired, logout immediately
            getAuthState().logout();
            window.location.href = '/login';
            return Promise.reject(new Error('Refresh token expired or invalid'));
          }
          const newToken = refreshRes.data?.data?.access_token;
          if (newToken) {
            console.log('Refresh successful, new access token received.');
            getAuthState().setToken(newToken);
            localStorage.setItem('token', newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            console.log('Refresh endpoint did not return a new access token.');
          }
        } else {
          console.log('No user_id or refresh_token found for refresh.');
        }
      } catch (refreshError) {
        console.log('Refresh token request failed:', refreshError);
        getAuthState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    if (error.response?.status === 401) {
      getAuthState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;