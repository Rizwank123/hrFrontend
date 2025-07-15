/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import {
  Clock,
  CalendarRange,
  UserCircle,
  LogOut,
  Menu,
  X,
  CalendarClock,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import api from "../lib/axios";
import { toast } from "react-hot-toast";
import HrPolicies from "../components/HrPolicies";
import Holidays from "../components/Holidays";
import AttendanceManagement from '../components/AttendanceManagement';
import LeaveManagement from '../components/LeaveManagement';
import Profile from '../components/Profile';

import { Employee } from '../types/employee';
import { Attendance, LeaveBalance, LeaveRequest } from '../types/attendance';


import LeaveRequestsComponent from './LeaveRequests';

function EmployeeDashboard() {
  // Fix useState - add the missing variable
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/attendance")) return "Attendance";
    if (path.includes("/leave")) return "Leave Management";
    if (path.includes("/profile")) return "Profile";
    if (path.includes('/leave-requests')) return 'Leave Requests';
    return "Employee Dashboard";
  };

  // Employee query with proper type
  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ["employee"],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("User ID not found");
      const response = await api.get(`/employees/user/${user.user_id}`);
      return response.data.data;
    },
    enabled: !!user?.user_id,
    retry: 1,
    // Remove onError from query options and use onSettled instead
  });

  // Fetch attendance data - fix the type error by removing onError
  const { data: attendanceData } = useQuery<Attendance[]>({
    queryKey: ["attendance", employee?.id],
    queryFn: async () => {
      if (!employee?.id) throw new Error("Employee ID not found");

      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 15);

      const response = await api.post("/attendance/employee/", {
        employee_id: employee.id,
        from_date: format(sevenDaysAgo, "yyyy-MM-dd") + "T00:00:00Z",
        to_date: format(today, "yyyy-MM-dd") + "T23:59:59Z",
      });
      return response.data.data;
    },
    enabled: !!employee?.id,
    retry: 1,
    // Remove onError from query options
  });

  // Fetch leave balance
  const { data: leaveBalance } = useQuery<LeaveBalance>({
    queryKey: ["leaveBalance", employee?.id],
    queryFn: async () => {
      if (!employee?.id) throw new Error("Employee ID not found");
      const response = await api.get(`/leave/employee/${employee.id}`);
      return response.data.data;
    },
    enabled: !!employee?.id,
  });

  // Fetch leave requests
  const { data: leaveRequests } = useQuery<LeaveRequest[]>({
    queryKey: ["leaveRequests", employee?.id],
    queryFn: async () => {
      if (!employee?.id) throw new Error("Employee ID not found");
      const response = await api.post("/leave/requests", {
        employee_id: employee.id,
      });

      return response.data.data;
    },
    enabled: !!employee?.id,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: () =>
      api.post("/attendance/check-in", { employee_id: employee?.id }),
    onSuccess: () => {
      toast.success("Clocked in successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance", employee?.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to clock in");
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!todayAttendance?.id) {
        throw new Error('No attendance record found for today');
      }
      return api.post('/attendance/check-out', {
        id: todayAttendance.id,
        check_out_time: new Date(new Date().getTime() + (5 * 60 + 30) * 60000).toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Clocked out successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance', employee?.id] });
    },
    onError: (error: any) => {
      console.error('Clock out error:', error);
      toast.error(error.response?.data?.message || 'Failed to clock out');
    }
  });

  // Get today's attendance
  const todayAttendance = attendanceData?.find(
    (record: Attendance) =>
      new Date(record.attendance_date).toDateString() ===
      new Date().toDateString()
  );

  // Handle clock in
  const handleClockIn = () => {
    if (todayAttendance?.check_in_time) {
      toast.error("Already clocked in");
      return;
    }
    setShowCheckInModal(true);
  };

  // Define handleClockOut function properly
  const handleClockOut = () => {
    console.log('Clock out initiated');
    if (!todayAttendance?.id) {
      toast.error('No attendance record found for today');
      return;
    }
    if (!todayAttendance?.check_in_time) {
      toast.error('You need to clock in first');
      return;
    }
    console.log('Proceeding with clock out', todayAttendance);
    clockOutMutation.mutate();
  };

  // Check if user has manager role - case insensitive check
  const isManager = user?.permissions?.includes("manager");

  if (employeeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">{getPageTitle()}</h1>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar - Desktop (fixed) and Mobile (slide-in) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800">
              Employee Dashboard
            </h1>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/employee/attendance"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <Clock className="w-5 h-5 mr-3" />
                  Attendance
                </Link>
              </li>
              <li>
                <Link
                  to="/employee/leave"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <CalendarRange className="w-5 h-5 mr-3" />
                  Leave Management
                </Link>
              </li>
              {isManager && (
                <li>
                  <Link
                    to="/employee/leave-requests"
                    className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                    onClick={closeSidebar}
                  >
                    <CalendarClock className="w-5 h-5 mr-3" />
                    Leave Requests
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/employee/profile"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={closeSidebar}
                >
                  <UserCircle className="w-5 h-5 mr-3" />
                  Profile
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
          <Route
            path="/"
            element={
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Welcome, {employee?.first_name || "Employee"}
                </h2>
                <p className="text-gray-600">
                  Manage your attendance, leave requests, and profile
                  information.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Link
                    to="/employee/attendance"
                    className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Clock className="w-8 h-8 text-blue-500 mb-2" />
                    <h3 className="font-semibold text-lg">Attendance</h3>
                    <p className="text-sm text-gray-600">
                      Track your daily attendance
                    </p>
                  </Link>
                  <Link
                    to="/employee/leave"
                    className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition"
                  >
                    <CalendarRange className="w-8 h-8 text-green-500 mb-2" />
                    <h3 className="font-semibold text-lg">Leave Management</h3>
                    <p className="text-sm text-gray-600">
                      Apply for and track leave requests
                    </p>
                  </Link>
                  {isManager && (
                    <Link
                      to="/employee/leave-requests"
                      className="bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition"
                    >
                      <CalendarClock className="w-8 h-8 text-amber-500 mb-2" />
                      <h3 className="font-semibold text-lg">Leave Requests</h3>
                      <p className="text-sm text-gray-600">
                        Review department leave requests
                      </p>
                    </Link>
                  )}
                  <Link
                    to="/employee/profile"
                    className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition"
                  >
                    <UserCircle className="w-8 h-8 text-purple-500 mb-2" />
                    <h3 className="font-semibold text-lg">Profile</h3>
                    <p className="text-sm text-gray-600">
                      View and update your information
                    </p>
                  </Link>
                </div>
              </div>
            }
          />
          <Route
            path="/attendance"
            element={<AttendanceManagement key={employee?.id} {...{ employeeId: employee?.id || '' }} />}
          />
          <Route
            path="/leave"
            element={
              <LeaveManagement
                employeeId={employee?.id || ''}
                departmentId={employee?.department_id || ''}
              />
            }
          />
          {/* Fixed Route for Leave Requests */}
          <Route
            path="/leave-requests"
            element={
              isManager ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">Department Leave Requests</h2>
                  <LeaveRequestsComponent
                    approvalType="department"
                    managerId={employee?.id}
                  />
                </div>
              ) : (
                <Navigate to="/employee" replace />
              )
            }
          />

          <Route
            path="/profile"
            element={<Profile employee={employee} />}
          />
        </Routes>

        {/* HR Policies Section - Visible on all pages */}
        <div className="mt-8">
          <HrPolicies />
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;