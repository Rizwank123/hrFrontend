import { format } from 'date-fns';
import { X } from 'lucide-react';

interface Address {
  city: string;
  country: string;
  id?: string;
  state: string;
  street: string;
  zip: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string;
  role: string;
  address: Address[];
  permission: string[];
  avatar: string;
  mobile: string;
  aadhar_no: string;
  pan_no: string;
  blood_group: string;
  company_id: string;
  department_id: string;
  department_name: string;
  dob: string;
  gender: string;
  joining_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  father_name: string;
  mother_name: string;
  designation: string;
}

interface LeaveData {
  casual_leave: number;
  earned_leave: number;
  employee_id: string;
  maternity_leave: number;
  sick_leave: number;
}

interface EmployeeDetailsProps {
  employee: Employee;
  leaveData: LeaveData | null;
  onClose: () => void;
}

function EmployeeDetails({ employee, leaveData, onClose }: EmployeeDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{`${employee.first_name} ${employee.last_name}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee Code</p>
                  <p className="font-medium">{employee.employee_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Father's Name</p>
                  <p className="font-medium">{employee.father_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mother's Name</p>
                  <p className="font-medium">{employee.mother_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{format(new Date(employee.dob), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{employee.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Group</p>
                  <p className="font-medium">{employee.blood_group}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium">{employee.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aadhar No.</p>
                  <p className="font-medium">{employee.aadhar_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">PAN No.</p>
                  <p className="font-medium">{employee.pan_no}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Employment Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Employment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Designation</p>
                  <p className="font-medium">{employee.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{employee.department_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium">{employee.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joining Date</p>
                  <p className="font-medium">{format(new Date(employee.joining_date), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Leave Balance */}
            {leaveData && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Leave Balance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Casual Leave</p>
                    <p className="font-medium">{leaveData.casual_leave}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Earned Leave</p>
                    <p className="font-medium">{leaveData.earned_leave}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sick Leave</p>
                    <p className="font-medium">{leaveData.sick_leave}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Maternity Leave</p>
                    <p className="font-medium">{leaveData.maternity_leave}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            {employee.address && employee.address.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Address</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Street</p>
                  <p className="font-medium">{employee.address[0].street}</p>
                  <p className="text-sm text-gray-500 mt-2">City</p>
                  <p className="font-medium">{employee.address[0].city}</p>
                  <p className="text-sm text-gray-500 mt-2">State</p>
                  <p className="font-medium">{employee.address[0].state}</p>
                  <p className="text-sm text-gray-500 mt-2">Country</p>
                  <p className="font-medium">{employee.address[0].country}</p>
                  <p className="text-sm text-gray-500 mt-2">ZIP Code</p>
                  <p className="font-medium">{employee.address[0].zip}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetails;