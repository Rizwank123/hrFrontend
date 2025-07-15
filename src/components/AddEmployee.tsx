import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import { Employee, Department, Company, ROLES, GENDERS, BLOOD_GROUPS, PERMISSIONS } from '../types/employee';

interface AddEmployeeProps {
  onClose: () => void;
  employee?: Employee;
  mode?: 'add' | 'edit';
}

function AddEmployee({ onClose, employee, mode = 'add' }: AddEmployeeProps) {
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(employee?.company_id || '');

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

  // Fetch employees for Reporting Manager dropdown, filtered by company using POST /employees/filter
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const res = await api.post('/employees/filter', { company_id: selectedCompanyId });
      return res.data.data;
    },
    enabled: !!selectedCompanyId
  });

  // Add or Edit employee mutation
  const employeeMutation = useMutation({
    mutationFn: (empData: Partial<Employee>) => {
      if (mode === 'edit' && employee?.id) {
        return api.patch(`/employees/${employee.id}`, empData);
      }
      return api.post('/employees', empData);
    },
    onSuccess: () => {
      toast.success(mode === 'edit' ? 'Employee updated successfully!' : 'Employee added successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
    onError: () => toast.error(mode === 'edit' ? 'Failed to update employee' : 'Failed to add employee')
  });

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Only include editable fields in PATCH
    const empData: Partial<Employee> = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      father_name: formData.get('father_name') as string,
      mother_name: formData.get('mother_name') as string,
      email: formData.get('email') as string,
      designation: formData.get('designation') as string,
      role: formData.get('role') as string,
      permission: formData.getAll('permission') as string[],
      mobile: formData.get('mobile') as string,
      aadhar_no: formData.get('aadhar_no') as string,
      pan_no: formData.get('pan_no') as string,
      gender: formData.get('gender') as string,
      blood_group: formData.get('blood_group') as string,
      dob: new Date(formData.get('dob') as string).toISOString(),
      joining_date: mode === 'edit' ? employee?.joining_date : new Date().toISOString(),
      department_id: formData.get('department_id') as string,
      company_id: formData.get('company_id') as string,
      reporting_manager_id: formData.get('reporting_manager') as string,
      address: [{
        street: formData.get('street') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        country: formData.get('country') as string,
        zip: formData.get('zip') as string
      }]
    };
    // Remove forbidden fields in edit mode
    if (mode === 'edit') {
      delete empData.id;
      delete empData.created_at;
      delete empData.updated_at;
      delete empData.user_id;
      delete empData.employee_code;
      delete empData.department_name;
    }
    employeeMutation.mutate(empData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Add New Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="first_name"
                required
                defaultValue={employee?.first_name || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                required
                defaultValue={employee?.last_name || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Father's Name</label>
              <input
                type="text"
                name="father_name"
                required
                defaultValue={employee?.father_name || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
              <input
                type="text"
                name="mother_name"
                required
                defaultValue={employee?.mother_name || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                required
                defaultValue={employee?.email || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone No.</label>
              <input
                type="mobile"
                name="mobile"
                required
                defaultValue={employee?.mobile || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Aadhar No.</label>
              <input
                type="text"
                name="aadhar_no"
                required
                defaultValue={employee?.aadhar_no || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pan No.</label>
              <input
                type="text"
                name="pan_no"
                defaultValue={employee?.pan_no || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Designation</label>
              <input
                type="text"
                name="designation"
                required
                defaultValue={employee?.designation || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                required
                defaultValue={employee?.role || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                {ROLES.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <select
                name="company_id"
                required
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                name="department_id"
                required
                defaultValue={employee?.department_id || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={!selectedCompanyId}
              >
                <option value="">Select Department</option>
                {departments?.map((dept) => (
                  <option key={dept.ID} value={dept.ID}>
                    {dept.Name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                required
                defaultValue={employee?.gender || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                {GENDERS.map(gender => (
                  <option key={gender.id} value={gender.id}>
                    {gender.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Group</label>
              <select
                name="blood_group"
                required
                defaultValue={employee?.blood_group || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Permissions</label>
              <select
                name="permission"
                multiple
                required
                defaultValue={employee?.permission || []}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {PERMISSIONS.map(permission => (
                  <option key={permission.id} value={permission.id}>
                    {permission.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple permissions</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="dob"
                required
                defaultValue={employee?.dob ? employee.dob.split('T')[0] : ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reporting Manager</label>
              <select
                name="reporting_manager"
                defaultValue={employee?.reporting_manager_id || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={!selectedCompanyId}
              >
                <option value="">Select Reporting Manager</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input
                  type="text"
                  name="street"
                  required
                  defaultValue={employee?.address?.[0]?.street || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  defaultValue={employee?.address?.[0]?.city || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  name="state"
                  required
                  defaultValue={employee?.address?.[0]?.state || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  name="country"
                  required
                  defaultValue={employee?.address?.[0]?.country || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  type="text"
                  name="zip"
                  required
                  defaultValue={employee?.address?.[0]?.zip || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
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
              disabled={employeeMutation.isPending}
            >
              {employeeMutation.isPending ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Employee' : 'Add Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployee;