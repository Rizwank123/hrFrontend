import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/axios';
import LeaveRequestForm from './LeaveRequestForm';

interface LeaveBalance {
  casual_leave: number;
  earned_leave: number;
  sick_leave: number;
  maternity_leave: number;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  leave_status: string;
  reason?: string;
  request_date?: string;
  department_approval_status?: string;
  hr_approval_status?: string;
}

function LeaveManagement() {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const { user } = useAuthStore();

  // Get employee data
  const { data: employee } = useQuery({
    queryKey: ["employee"],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("User ID not found");
      const response = await api.get(`/employees/user/${user.user_id}`);
      return response.data.data;
    },
    enabled: !!user?.user_id,
  });

  // Fetch leave balance
  const { data: leaveBalance, isLoading: leaveBalanceLoading } = useQuery<LeaveBalance>({
    queryKey: ["leaveBalance", employee?.id],
    queryFn: async () => {
      if (!employee?.id) throw new Error("Employee ID not found");
      const response = await api.get(`/leave/employee/${employee.id}`);
      return response.data.data;
    },
    enabled: !!employee?.id,
  });

  // Fetch leave requests
  const { data: leaveRequests, isLoading: leaveRequestsLoading } = useQuery<LeaveRequest[]>({
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Leave Management</h2>
        <button
          onClick={() => setShowLeaveForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Apply for Leave
        </button>
      </div>

      {showLeaveForm && (
        <LeaveRequestForm
          employeeId={employee?.id || ''}
          departmentId={employee?.department_id || ''}
          onClose={() => setShowLeaveForm(false)}
        />
      )}

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Leave Balance</h3>
        {leaveBalanceLoading ? (
          <p className="text-gray-600">Loading leave balance...</p>
        ) : leaveBalance ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700">Casual Leave</h4>
              <p className="text-2xl font-bold text-blue-900">{leaveBalance.casual_leave}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-700">Earned Leave</h4>
              <p className="text-2xl font-bold text-green-900">{leaveBalance.earned_leave}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-700">Sick Leave</h4>
              <p className="text-2xl font-bold text-yellow-900">{leaveBalance.sick_leave}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-700">Maternity Leave</h4>
              <p className="text-2xl font-bold text-purple-900">{leaveBalance.maternity_leave}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No leave balance data available</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Leave Requests</h3>
        {leaveRequestsLoading ? (
          <p className="text-gray-600">Loading leave requests...</p>
        ) : leaveRequests && leaveRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department Approval
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HR Approval
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {request.leave_type.replace('_', ' ')}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {format(new Date(request.start_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {format(new Date(request.end_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.leave_status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : request.leave_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {request.leave_status}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.department_approval_status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : request.department_approval_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {request.department_approval_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.hr_approval_status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : request.hr_approval_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {request.hr_approval_status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No leave requests found</p>
        )}
      </div>
    </div>
  );
}

export default LeaveManagement;