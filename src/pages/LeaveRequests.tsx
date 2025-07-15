import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Download, Filter, X } from 'lucide-react';
import api from '../lib/axios';
import { format } from 'date-fns';

interface LeaveRequest {
  department_approval_status: string;
  department_approved_at: string;
  department_approved_by: string;
  department_rejection_reason: string;
  employee_name: string;
  end_date: string;
  hr_approval_status: string;
  hr_approved_at: string;
  hr_approved_by: string;
  hr_rejection_reason: string;
  id: string;
  leave_id: string;
  leave_type: string;
  reason: string;
  request_date: string;
  start_date: string;
}
interface FilterParams {
  department_approval_status?: string;
  employee_id?: string;
  from_date?: string;
  hr_approval_status?: string;
  leave_type?: string;
  to_date?: string;
}

const LEAVE_TYPES = [
  { id: 'CASUAL_LEAVE', name: 'Casual Leave' },
  { id: 'SICK_LEAVE', name: 'Sick Leave' },
  { id: 'EARNED_LEAVE', name: 'Earned Leave' },
  { id: 'MATERNITY_LEAVE', name: 'Maternity Leave' }
];

const APPROVAL_STATUS = [
  { id: 'PENDING', name: 'Pending' },
  { id: 'APPROVED', name: 'Approved' },
  { id: 'REJECTED', name: 'Rejected' }
];

// Update the component props
function LeaveRequests({ approvalType = 'hr', managerId }: { approvalType: string; managerId?: string }) {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});

  // State for rejection modal
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  // State for approval modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveRequestId, setApproveRequestId] = useState<string | null>(null);
  const [approveLeaveType, setApproveLeaveType] = useState('');

  // Update the useQuery hook
  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['leaveRequests', filters, approvalType, managerId],
    queryFn: async () => {
      const endpoint =
        approvalType === 'department'
          ? '/leave/department/approval'
          : '/leave/requests';

      const payload =
        approvalType === 'department'
          ? {
            department_approval_status: 'PENDING',
            employee_id: managerId, // Use managerId instead of employeeId
          }
          : filters;

      const response = await api.post(endpoint, payload);
      return response.data.data;
    },
    enabled: !!approvalType && (approvalType !== 'department' || !!managerId), // Only enable if managerId is present for department view
  });

  // Update leave request status
  const updateLeaveStatus = useMutation({
    mutationFn: async ({ id, status, reason, leave_category }: { id: string; status: string; reason?: string; leave_category?: string }) => {
      // Create the appropriate payload based on the approval type
      const payload = approvalType === 'department'
        ? {
          department_approval_status: status,
          department_approved_at: new Date().toISOString(),
          department_approved_by: managerId,
          ...(reason && { department_rejection_reason: reason })
          , ...(leave_category && { leave_category })
        }
        : {
          hr_approval_status: status,
          hr_approved_at: new Date().toISOString(),
          hr_approved_by: filters.employee_id,
          ...(reason && { hr_rejection_reason: reason })
          , ...(leave_category && { leave_category })
        };

      return api.patch(`/leave/requests/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      toast.success('Leave request updated successfully');
      handleCloseRejectionModal();
    },
    onError: () => {
      toast.error('Failed to update leave request');
    }
  });

  // Handle rejection button click
  const handleReject = (id: string) => {
    setCurrentRequestId(id);
    setShowRejectionModal(true);
  };

  // Handle rejection submission
  const handleSubmitRejection = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    if (currentRequestId) {
      updateLeaveStatus.mutate({
        id: currentRequestId,
        status: 'REJECTED',
        reason: rejectionReason
      });
    }
  };

  // Handle approve button click
  const handleApprove = (id: string) => {
    setApproveRequestId(id);
    setApproveLeaveType('');
    setShowApproveModal(true);
  };

  // Handle approval submission
  const handleSubmitApprove = () => {
    if (!approveLeaveType) {
      toast.error('Please select a leave category');
      return;
    }
    if (approveRequestId) {
      updateLeaveStatus.mutate({
        id: approveRequestId,
        status: 'APPROVED',
        leave_category: approveLeaveType,
      });
      setShowApproveModal(false);
      setApproveRequestId(null);
      setApproveLeaveType('');
    }
  };

  // Close rejection modal and reset state
  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
    setCurrentRequestId(null);
  };

  // Download leave requests
  const handleDownload = async () => {
    try {
      const response = await api.post('/leave/report', filters, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leave-requests-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to download leave requests');
    }
  };

  const handleFilterChange = (key: keyof FilterParams, value: string) => {
    if (value) {
      setFilters(prev => ({ ...prev, [key]: value }));
    } else {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Approval Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select Leave Category</h3>
              <button onClick={() => setShowApproveModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Category</label>
              <select
                value={approveLeaveType}
                onChange={e => setApproveLeaveType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {LEAVE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                disabled={updateLeaveStatus.isPending}
              >
                {updateLeaveStatus.isPending ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Provide {approvalType === 'department' ? 'Department' : 'HR'} Rejection Reason
              </h3>
              <button onClick={handleCloseRejectionModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={4}
                placeholder={`Enter ${approvalType === 'department' ? 'department' : 'HR'} rejection reason`}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseRejectionModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRejection}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                disabled={updateLeaveStatus.isPending}
              >
                {updateLeaveStatus.isPending ? 'Submitting...' : 'Submit Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Leave Requests</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filter Leave Requests</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={filters.employee_id || ''}
                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter employee ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type
              </label>
              <select
                value={filters.leave_type || ''}
                onChange={(e) => handleFilterChange('leave_type', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {LEAVE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Status
              </label>
              <select
                value={filters.department_approval_status || ''}
                onChange={(e) => handleFilterChange('department_approval_status', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {APPROVAL_STATUS.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HR Status
              </label>
              <select
                value={filters.hr_approval_status || ''}
                onChange={(e) => handleFilterChange('hr_approval_status', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {APPROVAL_STATUS.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.from_date?.split('T')[0] || ''}
                onChange={(e) => handleFilterChange('from_date', e.target.value ? `${e.target.value}T00:00:00Z` : '')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.to_date?.split('T')[0] || ''}
                onChange={(e) => handleFilterChange('to_date', e.target.value ? `${e.target.value}T00:00:00Z` : '')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading leave requests...</p>
        </div>
      ) : leaveRequests?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HR Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.map((request: LeaveRequest) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.employee_name}
                    </div>
                    {/* <div className="text-sm text-gray-500">
                      {format(new Date(request.request_date), 'MMM dd, yyyy')}
                    </div> */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {request.leave_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.department_approval_status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        request.department_approval_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {request.department_approval_status}
                    </span>
                    {request.department_approval_status === 'REJECTED' && request.department_rejection_reason && (
                      <div className="text-xs text-gray-500 mt-1">
                        Reason: {request.department_rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.hr_approval_status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        request.hr_approval_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {request.hr_approval_status}
                    </span>
                    {request.hr_approval_status === 'REJECTED' && request.hr_rejection_reason && (
                      <div className="text-xs text-gray-500 mt-1">
                        Reason: {request.hr_rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {approvalType === 'department' ? (
                      request.department_approval_status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )
                    ) : (
                      request.hr_approval_status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No leave requests found.
        </div>
      )}
    </div>
  );
}

export default LeaveRequests;