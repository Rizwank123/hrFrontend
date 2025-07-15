import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  username: string;
  user_id: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: string | null;
  permissions: string[] | null;
  setToken: (token: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

// Initialize user data from token if available
const initializeFromToken = async () => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      const user = jwtDecode<User>(token);
      return {
        token,
        user,
        role: user.role,
        permissions: user.permissions
      };
    }
  } catch (error) {
    console.error('Invalid token:', error);
    await SecureStore.deleteItemAsync('token');
  }
  return {
    token: null,
    user: null,
    role: null,
    permissions: null
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  role: null,
  permissions: null,
  
  initializeAuth: async () => {
    const authData = await initializeFromToken();
    set(authData);
  },
  
  setToken: async (token: string, refreshToken?: string) => {
    await SecureStore.setItemAsync('token', token);
    if (refreshToken) {
      await SecureStore.setItemAsync('refresh_token', refreshToken);
    }
    const user = jwtDecode<User>(token);
    set({ 
      token, 
      user, 
      role: user.role,
      permissions: user.permissions 
    });
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ token: null, user: null, role: null, permissions: null });
  },
}));

export const getAuthState = () => useAuthStore.getState();