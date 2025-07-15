import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Building2 } from 'lucide-react';
import api from '../lib/axios';

interface Department {
  company_id: string;
  CreatedAt: string;
  id: string;
  Name: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
}

function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Fetch companies
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
      return res.data.data;
    }
  });

  // Fetch departments based on selected company
  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ['departments', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId && companies && companies.length > 0) {
        setSelectedCompanyId(companies[0].id);
        return [];
      }
      if (!selectedCompanyId) return [];
      const res = await api.get(`/departments/company/${selectedCompanyId}`);
      //console.log(res.data)
      return res.data.data;
    },
    enabled: !!selectedCompanyId || !!companies?.length
  });
  // Add department mutation
  const addDepartmentMutation = useMutation({
    mutationFn: (newDepartment: { name: string; company_id: string }) =>
      api.post('/departments', newDepartment),
    onSuccess: () => {
      toast.success('Department added successfully!');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowModal(false);
    },
    onError: () => toast.error('Failed to add department')
  });

  const handleAddDepartment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDepartment = {
      name: formData.get('name') as string,
      company_id: formData.get('company_id') as string
    };
    addDepartmentMutation.mutate(newDepartment);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Departments</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Department
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Company
        </label>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select Company</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : departments?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{dept.Name}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(dept.CreatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No departments found</h3>
          <p className="text-gray-500">Get started by adding a new department.</p>
        </div>
      )}

      {/* Add Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Add New Department</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter department name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <select
                  name="company_id"
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

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={addDepartmentMutation.isPending}
                >
                  {addDepartmentMutation.isPending ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentManagement;