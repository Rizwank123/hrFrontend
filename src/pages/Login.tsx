/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Lock, User } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

interface LoginForm {
  username: string;
  password: string;
}

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const response = await api.post('/users/login', {
        username: data.username.trim(),
        password: data.password
      });

      if (response.data.data.access_token) {
        setToken(response.data.data.access_token, response.data.data.refresh_token);

        const Permissions = useAuthStore.getState().user?.permissions;


        if (Permissions?.includes('superadmin') || Permissions?.includes("hr")) {
          navigate('/hr');
        } else {
          navigate('/employee');
        }

        toast.success('Login successful!');
      } else {
        toast.error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Welcome Back</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="e.g., MSFD001"
                {...register('username', {
                  required: 'Username is required',
                  pattern: {
                    value: /^[A-Z0-9&]+$/,
                    message: 'Username must be in uppercase with numbers only'
                  }
                })}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <User className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-indigo-600 hover:text-indigo-500"
              onClick={() => toast.error('Feature coming soon!')}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;