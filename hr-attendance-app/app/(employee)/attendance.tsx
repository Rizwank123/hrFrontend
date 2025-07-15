import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
import Toast from 'react-native-toast-message';

export default function AttendanceScreen() {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInType, setCheckInType] = useState<'OFFICE' | 'FIELD' | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<Camera>(null);
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
  const { data: attendanceData, isLoading } = useQuery({
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
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: (data: any) => api.post("/attendance/check-in", data),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Clocked in successfully'
      });
      queryClient.invalidateQueries({ queryKey: ["attendance", employee?.id] });
      setShowCheckInModal(false);
      setShowCamera(false);
      setCheckInType(null);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to clock in'
      });
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
        check_out_time: new Date().toISOString()
      });
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Clocked out successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['attendance', employee?.id] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to clock out'
      });
    }
  });

  // Get today's attendance
  const todayAttendance = attendanceData?.find(
    (record: any) =>
      new Date(record.attendance_date).toDateString() === new Date().toDateString()
  );

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for field check-in');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const locationString = `Longitude:${location.coords.longitude}, Latitude: ${location.coords.latitude}`;
      setLocation(locationString);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleCheckInType = async (type: 'OFFICE' | 'FIELD') => {
    setCheckInType(type);
    
    if (type === 'OFFICE') {
      // Direct office check-in
      clockInMutation.mutate({
        employee_id: employee?.id,
        check_in_type: 'OFFICE',
        check_in_time: new Date().toISOString(),
      });
    } else {
      // Field check-in requires camera and location
      await getLocation();
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          Alert.alert('Permission denied', 'Camera permission is required for field check-in');
          return;
        }
      }
      setShowCamera(true);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        // Upload image and check in
        const formData = new FormData();
        formData.append('file', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'check-in-image.jpg',
        } as any);

        const uploadResponse = await api.post('/attendance/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const imageUrl = uploadResponse.data.data;

        clockInMutation.mutate({
          employee_id: employee?.id,
          check_in_type: 'FIELD',
          check_in_time: new Date().toISOString(),
          image_url: imageUrl,
          location: location,
        });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const handleClockOut = () => {
    if (!todayAttendance?.id) {
      Alert.alert('Error', 'No attendance record found for today');
      return;
    }
    if (!todayAttendance?.check_in_time) {
      Alert.alert('Error', 'You need to clock in first');
      return;
    }
    clockOutMutation.mutate();
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '--:--';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading attendance data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Management</Text>
        <Text style={styles.headerDate}>{format(new Date(), 'MMMM dd, yyyy')}</Text>
      </View>

      {/* Today's Status */}
      <View style={styles.todayCard}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, { color: '#10b981' }]}>
            {todayAttendance?.attendance_status || 'Not Checked In'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Clock In:</Text>
          <Text style={styles.statusValue}>
            {todayAttendance?.check_in_time ? formatTime(todayAttendance.check_in_time) : '--:--'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Clock Out:</Text>
          <Text style={styles.statusValue}>
            {todayAttendance?.check_out_time && todayAttendance?.attendance_status === 'CHECKED_OUT'
              ? formatTime(todayAttendance.check_out_time)
              : '--:--'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.checkInButton]}
          onPress={() => setShowCheckInModal(true)}
          disabled={!!todayAttendance?.check_in_time}
        >
          <Ionicons name="log-in-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Check In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.checkOutButton,
            (!todayAttendance?.check_in_time || todayAttendance?.attendance_status === 'CHECKED_OUT') && styles.buttonDisabled
          ]}
          onPress={handleClockOut}
          disabled={!todayAttendance?.check_in_time || todayAttendance?.attendance_status === 'CHECKED_OUT'}
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Clock Out</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Attendance */}
      <View style={styles.recentCard}>
        <Text style={styles.cardTitle}>Recent Attendance</Text>
        {attendanceData && attendanceData.length > 0 ? (
          attendanceData.slice(0, 7).map((record: any) => (
            <View key={record.id} style={styles.attendanceRow}>
              <Text style={styles.attendanceDate}>
                {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
              </Text>
              <View style={styles.attendanceDetails}>
                <Text style={styles.attendanceTime}>
                  In: {record.check_in_time ? formatTime(record.check_in_time) : '--:--'}
                </Text>
                <Text style={styles.attendanceTime}>
                  Out: {record.check_out_time && record.attendance_status === 'CHECKED_OUT'
                    ? formatTime(record.check_out_time)
                    : '--:--'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No attendance records found</Text>
        )}
      </View>

      {/* Check In Type Modal */}
      <Modal
        visible={showCheckInModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Check-in Type</Text>
            
            <TouchableOpacity
              style={styles.checkInTypeButton}
              onPress={() => handleCheckInType('OFFICE')}
            >
              <Ionicons name="business-outline" size={24} color="#3b82f6" />
              <Text style={styles.checkInTypeText}>Office</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkInTypeButton}
              onPress={() => handleCheckInType('FIELD')}
            >
              <Ionicons name="location-outline" size={24} color="#3b82f6" />
              <Text style={styles.checkInTypeText}>Field</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCheckInModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={CameraType.front}
          />
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <Ionicons name="camera" size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelCameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerDate: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  todayCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  checkInButton: {
    backgroundColor: '#10b981',
  },
  checkOutButton: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recentCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  attendanceDate: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  attendanceDetails: {
    alignItems: 'flex-end',
  },
  attendanceTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  checkInTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  checkInTypeText: {
    fontSize: 16,
    color: '#1f2937',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
  },
  captureButton: {
    backgroundColor: '#3b82f6',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelCameraButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});