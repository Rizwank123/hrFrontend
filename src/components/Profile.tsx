import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import { UserCircle } from 'lucide-react';
import { safeFormatDate } from '../utils/dateUtils';
import { Employee } from '../types/employee';
import EditEmployee from './EditEmployee';

interface ProfileProps {
  employee: Employee | undefined;
}

function Profile({ employee }: ProfileProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Handler for avatar click
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handler for file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!employee?.id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // 1. Upload image
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post(`/employees/${employee.id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const avatarUrl = uploadRes.data.data;
      // 2. Patch employee with new avatar
      await api.patch(`/employees/${employee.id}`, { avatar: avatarUrl });
      toast.success('Profile picture updated!');
      // Optionally, trigger a refresh or callback here
      window.location.reload(); // crude, but ensures UI updates
    } catch (err: unknown) {
      let message = 'Failed to update profile picture';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as { message?: string }).message || message;
      }
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {showEditModal && employee && (
        <EditEmployee
          employee={employee}
          onClose={() => setShowEditModal(false)}
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Profile</h2>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" disabled={uploading} onClick={() => setShowEditModal(true)} type="button">
          Edit Profile
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <div className="bg-gray-50 p-6 rounded-lg flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 cursor-pointer relative" onClick={handleAvatarClick} title="Click to change profile picture">
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-full z-10">
                  <span className="text-blue-500 animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-500 rounded-full inline-block"></span>
                </div>
              )}
              {employee?.avatar ? (
                <img
                  src={employee.avatar}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-32 h-32 rounded-full object-cover"
                  style={{ opacity: uploading ? 0.5 : 1 }}
                />
              ) : (
                <UserCircle className="w-24 h-24 text-gray-400" />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            <h3 className="text-xl font-semibold">
              {employee
                ? `${employee.first_name} ${employee.last_name}`
                : "Employee"}
            </h3>
            <p className="text-gray-600">
              {employee?.designation || "Employee"}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {employee?.department_name || "Department"}
            </p>
          </div>
        </div>
        <div className="md:w-2/3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Employee ID
              </h4>
              <p>{employee?.employee_code || "N/A"}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Email
              </h4>
              <p>{employee?.email || "N/A"}</p>
            </div>
             <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Mobile Number
              </h4>
              <p>{employee?.mobile || "N/A"}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Department
              </h4>
              <p>{employee?.department_name || "N/A"}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Designation
              </h4>
              <p>{employee?.designation || "N/A"}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Date of Birth
              </h4>
              <p>
                {employee?.dob
                  ? safeFormatDate(employee.dob, "MMMM d, yyyy")
                  : "N/A"}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Gender
              </h4>
              <p>{employee?.gender || "N/A"}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Blood Group
              </h4>
              <p>{employee?.blood_group || "N/A"}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Shift Timing
              </h4>
              <p>{employee?.shift_time || ""}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Pan No.
              </h4>
              <p>{employee?.pan_no || ""}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Aadhar No.
              </h4>
              <p>{employee?.aadhar_no || ""}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Work Hours
              </h4>
              <p>{employee?.work_hours || ""}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Joining Date
              </h4>
              <p>
                {employee?.joining_date
                  ? safeFormatDate(employee.joining_date, "MMMM d, yyyy")
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Address</h3>
            {employee?.address && employee.address.length > 0 ? (
              <div className="p-4 border rounded-lg">
                <p>
                  {employee.address[0].street}, {employee.address[0].city}
                </p>
                <p>
                  {employee.address[0].state}, {employee.address[0].country},{" "}
                  {employee.address[0].zip}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No address information available.</p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Role and Permissions</h3>
            <div className="p-4 border rounded-lg">
              <div className="flex flex-wrap gap-2">
                {employee?.role && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {employee.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;