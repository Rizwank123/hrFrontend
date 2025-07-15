import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, Building2, CalendarClock, LogOut, Menu, X, Clock, CalendarRange, History } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import EmployeeManagement from './EmployeeManagement';
import DepartmentManagement from './DepartmentManagement';
import LeaveRequests from './LeaveRequests';
import HRPolicyScreen from '../components/HrPolicies';
import Holidays from '../components/Holidays';
import AttendanceManagement from '../components/AttendanceManagement';
import AttendanceHistory from '../components/AttendanceHistory';
import LeaveManagement from '../components/LeaveManagement';

function HRDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuthStore();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/employees')) return 'Employee Management';
    if (path.includes('/departments')) return 'Department Management';
    if (path.includes('/leave-requests')) return 'Leave Requests';
    if (path.includes('/attendance')) return 'Attendance Management';
    if (path.includes('/leave-management')) return 'Leave Management';
    return 'HR Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">{getPageTitle()}</h1>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop (fixed) and Mobile (slide-in) */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800">HR Dashboard</h1>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/hr/employees"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <Users className="w-5 h-5 mr-3" />
                  Employees
                </Link>
              </li>
              <li>
                <Link
                  to="/hr/departments"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <Building2 className="w-5 h-5 mr-3" />
                  Departments
                </Link>
              </li>
              <li>
                <Link
                  to="/hr/attendance"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <Clock className="w-5 h-5 mr-3" />
                  Attendance
                </Link>
              </li>
              <li>
                <Link
                  to="/hr/attendance-history"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <History className="w-5 h-5 mr-3" />
                  Attendance History
                </Link>
              </li>
              <li>
                <Link
                  to="/hr/leave-management"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <CalendarRange className="w-5 h-5 mr-3" />
                  Leave Management
                </Link>
              </li>
              <li>
                <Link
                  to="/hr/leave-requests"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <CalendarClock className="w-5 h-5 mr-3" />
                  Leave Requests
                </Link>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t mt-auto">
            <button
              onClick={logout}
              className="flex items-center w-full p-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-8 pt-4">
         <Holidays />
        <Routes>
          {/* Home Route */}
          <Route path="/" element={
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to HR Dashboard</h2>
              <p className="text-gray-600">Manage your organization's employees, departments, and leave requests.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Link to="/hr/employees" className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition">
                  <Users className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold text-lg">Employees</h3>
                  <p className="text-sm text-gray-600">Manage employee information</p>
                </Link>
                <Link to="/hr/departments" className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition">
                  <Building2 className="w-8 h-8 text-green-500 mb-2" />
                  <h3 className="font-semibold text-lg">Departments</h3>
                  <p className="text-sm text-gray-600">Organize company structure</p>
                </Link>
                <Link to="/hr/attendance" className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition">
                  <Clock className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold text-lg">Attendance</h3>
                  <p className="text-sm text-gray-600">Monitor employee attendance</p>
                </Link>
                <Link to="/hr/leave-management" className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition">
                  <CalendarRange className="w-8 h-8 text-green-500 mb-2" />
                  <h3 className="font-semibold text-lg">Leave Management</h3>
                  <p className="text-sm text-gray-600">Manage employee leaves</p>
                </Link>
                <Link to="/hr/leave-requests" className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition">
                  <CalendarClock className="w-8 h-8 text-purple-500 mb-2" />
                  <h3 className="font-semibold text-lg">Leave Requests</h3>
                  <p className="text-sm text-gray-600">Approve or reject leave applications</p>
                </Link>
              </div>
            </div>
          } />
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/departments" element={<DepartmentManagement />} />
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/attendance-history" element={<AttendanceHistory />} />
          <Route path="/leave-management" element={<LeaveManagement />} />
          <Route path="/leave-requests" element={<LeaveRequests approvalType="hr"  />} />
        </Routes>
        <HRPolicyScreen />
      </div>
    </div>
  );
}

export default HRDashboard;