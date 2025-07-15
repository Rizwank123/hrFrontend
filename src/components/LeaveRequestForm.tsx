/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../lib/axios';

interface LeaveRequestFormProps {
  onClose: () => void;
  employeeId: string;
}

const LEAVE_CATEGORIES = [
  { id: 'CASUAL_LEAVE', name: 'Casual Leave' },
  { id: 'SICK_LEAVE', name: 'Sick Leave' },
  { id: 'EARNED_LEAVE', name: 'Earned Leave' },
  { id: 'MATERNITY_LEAVE', name: 'Maternity Leave' }
];

const REQUEST_TYPES = [
  { id: 'LEAVE', name: 'Leave' },
  { id: 'OD', name: 'OD (Out Duty)' }
];

const LEAVE_TYPES = [
  { id: 'FULL_DAY', name: 'Full Day' },
  { id: 'HALF_DAY', name: 'Half Day' }
];

function LeaveRequestForm({ onClose, employeeId }: LeaveRequestFormProps) {
  const [requestType, setRequestType] = useState('');
  const [leaveCategory, setLeaveCategory] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [departmentApprovedBy, setDepartmentApprovedBy] = useState('');

  const queryClient = useQueryClient();

  // Fetch employee profile
  const { data: employeeProfile } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}`);
      return res.data.data;
    },
    enabled: !!employeeId
  });

  // Fetch employees for the same department as the logged-in user
  const { data: departmentEmployees } = useQuery({
    queryKey: ['employees', employeeProfile?.company_id, employeeProfile?.department_id],
    queryFn: async () => {
      if (!employeeProfile?.company_id || !employeeProfile?.department_id) return [];
      const res = await api.post('/employees/filter', {
        company_id: employeeProfile.company_id,
        department_id: employeeProfile.department_id
      });
      return res.data.data;
    },
    enabled: !!employeeProfile?.company_id && !!employeeProfile?.department_id
  });

  const submitLeaveRequest = useMutation({
    mutationFn: (data: any) => api.post('/leave/apply', data),
    onSuccess: () => {
      toast.success('Leave request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', employeeId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestType || !startDate || !endDate || !departmentApprovedBy || !duration) {
      toast.error('Please fill all required fields');
      return;
    }

    // Additional validation for LEAVE type
    if (requestType === 'LEAVE' && (!leaveCategory || !leaveType)) {
      toast.error('Please select leave category and leave type for leave requests');
      return;
    }

    if (isNaN(Number(duration)) || Number(duration) <= 0) {
      toast.error('Duration must be a positive number');
      return;
    }

    // Make sure all data is included in the request
    const leaveRequest = {
      employee_id: employeeId,
      request_type: requestType,
      leave_category: requestType === 'LEAVE' ? leaveCategory : null,
      leave_type: requestType === 'LEAVE' ? leaveType : null,
      duration: Number(duration),
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      department_approved_by: departmentApprovedBy,
      leave_status: 'PENDING',
      reason: comment
    };
    submitLeaveRequest.mutate(leaveRequest);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Apply for Leave</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Remove company and department selectors */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Department Approval By *</label>
            <select
              value={departmentApprovedBy}
              onChange={e => setDepartmentApprovedBy(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!departmentEmployees}
            >
              <option value="">Select Employee</option>
              {departmentEmployees?.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Request Type *</label>
            <select
              value={requestType}
              onChange={(e) => {
                setRequestType(e.target.value);
                if (e.target.value !== 'LEAVE') {
                  setLeaveCategory('');
                  setLeaveType('');
                }
              }}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Request Type</option>
              {REQUEST_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {requestType === 'LEAVE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Leave Category *</label>
                <select
                  value={leaveCategory}
                  onChange={(e) => setLeaveCategory(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Leave Category</option>
                  {LEAVE_CATEGORIES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Leave Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Leave Type</option>
                  {LEAVE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter duration (e.g., 1, 0.5, 1.5)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              min={format(new Date(), 'yyyy-MM-dd')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              min={startDate || format(new Date(), 'yyyy-MM-dd')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Briefly describe your reason for leave"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={submitLeaveRequest.isPending}
            >
              {submitLeaveRequest.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveRequestForm;