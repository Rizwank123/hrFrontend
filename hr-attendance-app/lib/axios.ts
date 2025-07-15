import axios from 'axios';
import { getAuthState } from '../stores/authStore';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

const api = axios.create({
  baseURL: 'https://local.api.mitrsewa.co/api/v1',
});

api.interceptors.request.use(async (config) => {
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
        const refresh_token = await SecureStore.getItemAsync('refresh_token');
        if (user?.user_id && refresh_token) {
          console.log('Calling refresh endpoint with:', user.user_id, refresh_token);
          const refreshRes = await axios.get(
            `https://local.api.mitrsewa.co/api/v1/users/refresh?user_id=${user.user_id}&token=${refresh_token}`
          );
          if (refreshRes.status === 401) {
            getAuthState().logout();
            return Promise.reject(new Error('Refresh token expired or invalid'));
          }
          const newToken = refreshRes.data?.data?.access_token;
          if (newToken) {
            console.log('Refresh successful, new access token received.');
            await getAuthState().setToken(newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.log('Refresh token request failed:', refreshError);
        getAuthState().logout();
        return Promise.reject(refreshError);
      }
    }
    if (error.response?.status === 401) {
      getAuthState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;