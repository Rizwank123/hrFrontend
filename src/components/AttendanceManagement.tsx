/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import CheckIn from './CheckIn';
import { isValid } from 'date-fns/isValid';
import { useAuthStore } from '../stores/authStore';
import { Camera } from 'lucide-react';

interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_type: string;
  attendance_status: string;
}

// Helper function to safely format dates
const safeFormatDate = (
  dateString: string | null | undefined,
  formatString: string,
  fallback: string = "--"
): string => {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  if (!isValid(date)) return fallback;

  // Adjust for local timezone
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return format(utcDate, formatString);
};

function AttendanceManagement() {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Get employee data
  const { data: employee } = useQuery({
    queryKey: ["employee"],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("User ID not found");
      const response = await api.get(`/employees/user/${user.user_id}`);
      return response.data.data;
    },
    enabled: !!user?.user_id,
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useQuery<Attendance[]>({
    queryKey: ["attendance", employee?.id],
    queryFn: async () => {
      if (!employee?.id) throw new Error("Employee ID not found");

      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 15);

      const response = await api.post("/attendance/employee/", {
        employee_id: employee.id,
        from_date: format(sevenDaysAgo, "yyyy-MM-dd") + "T00:00:00Z",
        to_date: format(today, "yyyy-MM-dd") + "T23:59:59Z",
      });
      return response.data.data;
    },
    enabled: !!employee?.id,
    retry: 3,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: () =>
      api.post("/attendance/check-in", { employee_id: employee?.id }),
    onSuccess: () => {
      toast.success("Clocked in successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance", employee?.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to clock in");
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!todayAttendance?.id) {
        throw new Error('No attendance record found for today');
      }
      return api.post('/attendance/check-out', {
        id: todayAttendance.id,
        check_out_time: new Date(new Date().getTime() + (5 * 60 + 30) * 60000).toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Clocked out successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance', employee?.id] });
    },
    onError: (error: any) => {
      console.error('Clock out error:', error);
      toast.error(error.response?.data?.message || 'Failed to clock out');
    }
  });

  // Get today's attendance
  const todayAttendance = (attendanceData as Attendance[] | undefined)?.find(
    (record: Attendance) =>
      new Date(record.attendance_date).toDateString() ===
      new Date().toDateString()
  );

  // Handle clock in
  const handleClockIn = () => {
    if (todayAttendance?.check_in_time) {
      toast.error("Already clocked in");
      return;
    }
    setShowCheckInModal(true);
  };

  // Handle clock out
  const handleClockOut = () => {
    console.log('Clock out initiated');
    if (!todayAttendance?.id) {
      toast.error('No attendance record found for today');
      return;
    }
    if (!todayAttendance?.check_in_time) {
      toast.error('You need to clock in first');
      return;
    }
    console.log('Proceeding with clock out', todayAttendance);
    clockOutMutation.mutate();
  };

  // Helper: open camera, get photo, get location, upload, PATCH
  const handleUpdateStatus = async () => {
    setShowUpdateStatusModal(true);
  };

  // --- Modal logic for update status ---
  const UpdateStatusModal = ({ onClose }: { onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [location, setLocation] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [uploadImageUrl, setUploadImageUrl] = useState<string | null>(null);

    useEffect(() => {
      // Start camera
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
          }
        });
      // Get location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation(`Longitude:${position.coords.longitude}, Latitude: ${position.coords.latitude}`);
          },
          () => {
            toast.error('Failed to get location');
          }
        );
      }
      return () => {
        if (stream) stream.getTracks().forEach((track) => track.stop());
      };
    }, []);

    const captureAndUpload = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const context = canvasRef.current.getContext('2d');
      if (!context) return;
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        setUploading(true);
        try {
          // Upload image
          const formData = new FormData();
          formData.append('file', blob, 'update-status.jpg');
          const uploadRes = await api.post('/attendance/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const imageUrl = uploadRes.data.data;
          setUploadImageUrl(imageUrl || null);
          if (!imageUrl) {
            toast.error('Image upload failed, no URL returned.');
            setUploading(false);
            return;
          }
          // PATCH attendance only after upload success
          await api.patch(`/attendance/${todayAttendance?.id}`, {
            image_url: imageUrl,
            location: location,
          });
          toast.success('Status updated successfully');
          queryClient.invalidateQueries({ queryKey: ['attendance', employee?.id] });
          cleanupStream();
          onClose();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
          setUploading(false);
        }
      }, 'image/jpeg');
    };

    const cleanupStream = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 className="text-lg font-bold mb-4">Update Status</h2>
          <video ref={videoRef} width={320} height={240} className="rounded mb-2" autoPlay muted />
          <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
          <div className="mb-2 text-sm text-gray-600">{location ? `Location: ${location}` : 'Getting location...'}</div>
          {uploadImageUrl && (
            <div className="mb-2 text-green-600 text-xs break-all">Image URL: {uploadImageUrl}</div>
          )}
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
            onClick={captureAndUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Capture & Update'}
          </button>
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            onClick={() => { cleanupStream(); onClose(); }}
            disabled={uploading}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Handle error for useQuery using useEffect
  useEffect(() => {
    if (attendanceData === undefined && !attendanceLoading) {
      console.error("Error fetching attendance data");
      toast.error("Failed to load attendance data");
    }
  }, [attendanceData, attendanceLoading]);

  console.log('todayAttendance:', todayAttendance);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">
        Attendance Management
      </h2>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">
              Today's Attendance
            </h3>
            <p className="text-gray-600">
              {format(new Date(), "MMMM dd, yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              onClick={handleClockIn}
              disabled={clockInMutation.isPending}
            >
              {clockInMutation.isPending
                ? "Processing..."
                : "Check In"}
            </button>
            {showCheckInModal && (
              <CheckIn
                employeeId={employee?.id || ''}
                onSuccess={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["attendance", employee?.id],
                  });
                }}
                onClose={() => setShowCheckInModal(false)}
              />
            )}
            <div className="flex gap-2">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                onClick={handleClockOut}
                disabled={
                  !todayAttendance?.check_in_time ||
                  clockOutMutation.isPending ||
                  todayAttendance?.attendance_status === 'CHECKED_OUT'
                }
              >
                {clockOutMutation.isPending ? "Processing..." : "Clock Out"}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          {attendanceLoading ? (
            <p className="text-gray-700">
              Loading today's attendance...
            </p>
          ) : attendanceError ? (
            <div className="text-red-600 p-4 rounded-lg bg-red-50">
              <p>Error loading attendance data. Please try again later.</p>
            </div>
          ) : todayAttendance ? (
            <>
              <p className="text-gray-700">
                Status:{" "}
                <span className="font-semibold text-green-600">
                  {todayAttendance.attendance_status || "Present"}
                </span>
              </p>
              <p className="text-gray-700">
                Clock In:{" "}
                <span className="font-semibold">
                  {todayAttendance.check_in_time
                    ? safeFormatDate(
                      todayAttendance.check_in_time,
                      "h:mm a"
                    )
                    : "--:--"}
                </span>
              </p>
              <p className="text-gray-700">
                Clock Out:{" "}
                <span className="font-semibold">
                  {todayAttendance.check_out_time &&
                    todayAttendance.attendance_status === "CHECKED_OUT"
                    ? safeFormatDate(
                      todayAttendance.check_out_time,
                      "hh:mm a"
                    )
                    : "--:--"}
                </span>
              </p>
            </>
          ) : (
            <p className="text-gray-700">
              No attendance record for today
            </p>
          )}
          {todayAttendance &&
            ['checkin', 'checked_in'].includes(todayAttendance.attendance_status?.toLowerCase()) &&
            todayAttendance.check_in_type?.toLowerCase() === 'field' && (
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mt-4 flex items-center gap-2"
                onClick={handleUpdateStatus}
                disabled={clockOutMutation.isPending}
              >
                <Camera className="w-4 h-4" /> Update Status
              </button>
            )}
          {showUpdateStatusModal && <UpdateStatusModal onClose={() => setShowUpdateStatusModal(false)} />}
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3">
        Recent Attendance
      </h3>
      {attendanceLoading ? (
        <div className="text-center py-4">
          Loading attendance records...
        </div>
      ) : attendanceData && attendanceData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceData.map((record: Attendance) => (
                <tr key={record.id}>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {safeFormatDate(
                      record.attendance_date,
                      "MMM dd, yyyy"
                    )}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.attendance_status === "CHECKED_IN"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                      }`}>
                      {record.attendance_status || "Present"}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {record.check_in_time
                      ? safeFormatDate(record.check_in_time, "h:mm a")
                      : "--:--"}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {record.check_out_time &&
                      record.attendance_status === "CHECKED_OUT"
                      ? safeFormatDate(
                        record.check_out_time,
                        "hh:mm a"
                      )
                      : "--:--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No attendance records found.
        </div>
      )}
    </div>
  );
}

export default AttendanceManagement;