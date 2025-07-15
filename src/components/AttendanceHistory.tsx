import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';

interface Attendance {
  id: string;
  attendance_date: string;
  attendance_status: string;
  check_in_time: string;
  check_out_time: string;
  check_in_type: string;
  company_id: string;
  employee_id: string;
  images: string[];
  duration: string;
}

interface Company {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

function AttendanceHistory() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Fetch companies
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
      return res.data.data;
    }
  });

  // Fetch employees based on selected company
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const res = await api.post('/employees/filter', {
        company_id: selectedCompanyId,
      });
      return res.data.data;
    },
    enabled: !!selectedCompanyId
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading } = useQuery<Attendance[]>({
    queryKey: ['attendance', selectedCompanyId, selectedEmployeeId, fromDate, toDate],
    queryFn: async () => {
      if (!selectedCompanyId) return [];

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
      if (toDate) filters.to_date = toDate + 'T23:59:59Z';

      const res = await api.post('/attendance', filters);
      return res.data.data;
    },
    enabled: !!selectedCompanyId,
    onError: () => toast.error('Failed to fetch attendance data')
  });

  const formatDateTime = (dateString: string, isCheckout: boolean = false, status: string = '') => {
    if (isCheckout && status === 'CHECKED_IN') {
      return '--';
    }
    try {
      return format(new Date(dateString), 'hh:mm a');
    } catch {
      return '--';
    }
  };



  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Attendance History</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={!selectedCompanyId}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min={fromDate}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : !selectedCompanyId ? (
          <div className="text-center text-gray-500 py-8">
            Please select a company to view attendance records
          </div>
        ) : attendanceData?.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No attendance records found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Images
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData?.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.attendance_status === 'CHECKED_IN'
                        ? 'bg-yellow-100 text-yellow-800'
                        : record.attendance_status === 'CHECKED_OUT'
                          ? 'bg-green-100 text-white-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {record.attendance_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDateTime(record.check_in_time, false, record.attendance_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDateTime(record.check_out_time, true, record.attendance_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.duration || '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {record.images?.slice(0, 3).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Attendance ${index + 1}`}
                          className="h-8 w-8 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                      {record.images && record.images.length > 3 && (
                        <span className="text-sm text-gray-500 ml-2">
                          +{record.images.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AttendanceHistory;