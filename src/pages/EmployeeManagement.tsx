/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, User, Search, Download, Calendar } from 'lucide-react';
import EmployeeDetails from '../components/EmployeeDetails';
import AddEmployee from '../components/AddEmployee';
import api from '../lib/axios';
import { format } from 'date-fns';
import { Employee, Department, Company } from '../types/employee';
import { LeaveBalance } from '../types/attendance';
//import { useAuthStore } from '../stores/authStore';

function EmployeeManagement() {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLeaveFormModal, setShowLeaveFormModal] = useState(false);
  const [showAttendanceReportModal, setShowAttendanceReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [employeeLeaveData, setEmployeeLeaveData] = useState<LeaveBalance | null>(null);
  //const { user } = useAuthStore();

  // Fetch companies
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
      return res.data.data;
    }
  });

  // Fetch departments based on selected company
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const res = await api.get(`/departments/company/${selectedCompanyId}`);
      return res.data.data;
    },
    enabled: !!selectedCompanyId
  });

  // Fetch employees
  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data;
    }
  });

  // Fetch employee leave data
  const fetchEmployeeLeaveData = async (employeeId: string) => {
    try {
      const res = await api.get(`/leave/employee/${employeeId}`);
      setEmployeeLeaveData(res.data);
      return res.data.data;
    } catch (error) {
      setEmployeeLeaveData(null);
      return null;
    }
  };

  // Effect to fetch leave data when an employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeLeaveData(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  // Add leave mutation
  const addLeaveMutation = useMutation({
    mutationFn: (leaveData: LeaveBalance) =>
      api.post('/leave', leaveData),
    onSuccess: () => {
      toast.success('Leave data added successfully!');
      if (selectedEmployee) {
        fetchEmployeeLeaveData(selectedEmployee.id);
      }
      setShowLeaveFormModal(false);
    },
    onError: () => toast.error('Failed to add leave data')
  });

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  // Download attendance report mutation
  const downloadAttendanceReportMutation = useMutation({
    mutationFn: (filters: {
      company_id: string;
      employee_id?: string;
      from_date?: string;
      to_date?: string;
    }) => api.post('/attendance/report', filters, { responseType: 'blob' }),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data
      ]));
      const link = document.createElement('a');
      link.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/i);
      const filename = filenameMatch ? filenameMatch[1] : `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Attendance report downloaded successfully');
      setShowAttendanceReportModal(false);
    },
    onError: () => {
      toast.error('Failed to download attendance report');
    }
  });

  const handleDownloadAttendanceReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCompanyId) {
      toast.error('Company selection is required');
      return;
    }

    const filters: {
      company_id: string;
      employee_id?: string;
      from_date?: string;
      to_date?: string;
    } = {
      company_id: selectedCompanyId
    };

    if (selectedEmployeeId) filters.employee_id = selectedEmployeeId;
    if (fromDate) filters.from_date = fromDate + 'T00:00:00Z';
    if (toDate) filters.to_date = toDate + 'T00:00:00Z';

    downloadAttendanceReportMutation.mutate(filters);
  };

  const handleAddLeave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const formData = new FormData(e.currentTarget);
    const leaveData: LeaveBalance = {
      employee_id: selectedEmployee.id,
      casual_leave: parseInt(formData.get('casual_leave') as string) || 0,
      earned_leave: parseInt(formData.get('earned_leave') as string) || 0,
      sick_leave: parseInt(formData.get('sick_leave') as string) || 0,
      maternity_leave: parseInt(formData.get('maternity_leave') as string) || 0
    };

    addLeaveMutation.mutate(leaveData);
  };

  // Filter employees based on search term
  const filteredEmployees = employees?.filter(emp =>
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Employees</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAttendanceReportModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Calendar className="w-5 h-5 mr-2" /> Attendance Report
          </button>
          <button
            onClick={async () => {
              try {
                const response = await api.post('/employees/download', {}, {
                  responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;

                // Get filename from Content-Disposition header or use default
                const contentDisposition = response.headers['content-disposition'];
                const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/i);
                const filename = filenameMatch ? filenameMatch[1] : `employees-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('Employee list downloaded successfully');
              } catch (error) {
                toast.error('Failed to download employee list');
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Download className="w-5 h-5 mr-2" /> Download List
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Employee
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees?.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="bg-white border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                {emp.avatar ? (
                  <img src={emp.avatar} alt={emp.first_name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{emp.first_name} {emp.last_name}</h3>
                  <p className="text-gray-600">{emp.designation}</p>
                  <p className="text-sm text-gray-500">{emp.email}</p>
                  <p className="text-sm text-gray-500">{emp.department_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {showModal && <AddEmployee onClose={() => setShowModal(false)} />}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          leaveData={employeeLeaveData}
          onClose={() => setSelectedEmployee(null)}
          onAddLeave={() => setShowLeaveFormModal(true)}
        />
      )}

      {/* Add Leave Form Modal */}
      {showLeaveFormModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Add Leave Allocation</h2>
              <button
                onClick={() => setShowLeaveFormModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddLeave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Casual Leave</label>
                <input
                  type="number"
                  name="casual_leave"
                  defaultValue="7"
                  min="0"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Earned Leave</label>
                <input
                  type="number"
                  name="earned_leave"
                  defaultValue="7"
                  min="0"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sick Leave</label>
                <input
                  type="number"
                  name="sick_leave"
                  defaultValue="7"
                  min="0"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Maternity Leave</label>
                <input
                  type="number"
                  name="maternity_leave"
                  defaultValue="0"
                  min="0"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveFormModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={addLeaveMutation.isPending}
                >
                  {addLeaveMutation.isPending ? 'Adding...' : 'Add Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Report Modal */}
      {showAttendanceReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Download Attendance Report</h2>
              <button
                onClick={() => setShowAttendanceReportModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleDownloadAttendanceReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company <span className="text-red-500">*</span></label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Company</option>
                  {companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee (Optional)</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees?.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Date (Optional)</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To Date (Optional)</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAttendanceReportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={downloadAttendanceReportMutation.isPending}
                >
                  {downloadAttendanceReportMutation.isPending ? 'Downloading...' : 'Download Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;