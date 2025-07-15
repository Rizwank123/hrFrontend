import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import api from '../lib/axios';

interface LeaveRequest {
  id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

function UpcomingLeaves() {
  const { data: upcomingLeaves, isLoading } = useQuery({
    queryKey: ['upcomingLeaves'],
    queryFn: async () => {
      const response = await api.get('/leave/upcoming');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!upcomingLeaves?.length) {
    return (
      <div className="text-center py-6">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No upcoming leaves</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Upcoming Leaves</h3>
      <div className="space-y-3">
        {upcomingLeaves.map((leave: LeaveRequest) => (
          <div
            key={leave.id}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{leave.employee_name}</p>
                <p className="text-sm text-gray-500">{leave.leave_type}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                {leave.status}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UpcomingLeaves;