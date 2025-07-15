import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import { Employee } from '../types/employee';

interface EditEmployeeProps {
  employee: Employee;
  onClose: () => void;
}

function EditEmployee({ employee, onClose }: EditEmployeeProps) {
  const [form, setForm] = useState({
    first_name: employee.first_name || '',
    last_name: employee.last_name || '',
    email: employee.email || '',
    mobile: employee.mobile || '',
    father_name: employee.father_name || '',
    mother_name: employee.mother_name || '',
    designation: employee.designation || '',
    gender: employee.gender || '',
    blood_group: employee.blood_group || '',
    dob: employee.dob ? employee.dob.split('T')[0] : '',
    address: employee.address?.[0] || { street: '', city: '', state: '', country: '', zip: '' },
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name in form.address) {
      setForm((prev) => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const patchData = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        mobile: form.mobile,
        father_name: form.father_name,
        mother_name: form.mother_name,
        designation: form.designation,
        gender: form.gender,
        blood_group: form.blood_group,
        dob: new Date(form.dob).toISOString(),
        address: [form.address],
      };
      await api.patch(`/employees/${employee.id}`, patchData);
      toast.success('Profile updated!');
      onClose();
      window.location.reload();
    } catch (err: unknown) {
      let message = 'Failed to update profile';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as { message?: string }).message || message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile</label>
              <input type="text" name="mobile" value={form.mobile} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Father's Name</label>
              <input type="text" name="father_name" value={form.father_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
              <input type="text" name="mother_name" value={form.mother_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Designation</label>
              <input type="text" name="designation" value={form.designation} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Group</label>
              <select name="blood_group" value={form.blood_group} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input type="text" name="street" value={form.address.street} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input type="text" name="city" value={form.address.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input type="text" name="state" value={form.address.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input type="text" name="country" value={form.address.country} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input type="text" name="zip" value={form.address.zip} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEmployee; 