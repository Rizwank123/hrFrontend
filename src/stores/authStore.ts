import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

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
  setToken: (token: string, refreshToken?: string) => void;
  logout: () => void;
}

// Initialize user data from token if available
const initializeFromToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const user = jwtDecode<User>(token);
      return {
        token,
        user,
        role: user.role,
        permissions: user.permissions
      };
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
    }
  }
  return {
    token: null,
    user: null,
    role: null,
    permissions: null
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initializeFromToken(),
  setToken: (token: string, refreshToken?: string) => {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    const user = jwtDecode<User>(token);
    set({ 
      token, 
      user, 
      role: user.role,
      permissions: user.permissions 
    });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    set({ token: null, user: null, role: null, permissions: null });
  },
}));

export const getAuthState = () => useAuthStore.getState();