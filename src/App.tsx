/* eslint-disable @typescript-eslint/no-unused-vars */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient();

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user } = useAuthStore();
  
  if (!user) {
    alert("error")
    return <Navigate to="/login" />;
  }
  
  // if (allowedRoles && !allowedRoles.includes(user.role)) {
  //   return <Navigate to="/" />;
  // }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/hr/*"
            element={
              <PrivateRoute allowedRoles={['SUPERADMIN', 'HR', 'ADMIN']}>
                <HRDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/*"
            element={
              <PrivateRoute allowedRoles={['EMPLOYEE']}>
                <EmployeeDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;