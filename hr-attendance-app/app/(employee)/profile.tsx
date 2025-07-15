import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  // Get employee data
  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee"],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("User ID not found");
      const response = await api.get(`/employees/user/${user.user_id}`);
      return response.data.data;
    },
    enabled: !!user?.user_id,
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      if (!employee?.id) throw new Error("Employee ID not found");
      
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const uploadRes = await api.post(`/employees/${employee.id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const avatarUrl = uploadRes.data.data;
      
      // Update employee with new avatar
      await api.patch(`/employees/${employee.id}`, { avatar: avatarUrl });
      
      return avatarUrl;
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile picture updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update profile picture'
      });
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera roll permission is required to change profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        uploadAvatarMutation.mutate(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Picture Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleImagePicker} disabled={uploading}>
          <View style={styles.avatarContainer}>
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
            {employee?.avatar ? (
              <Image source={{ uri: employee.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color="#9ca3af" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.employeeName}>
          {employee ? `${employee.first_name} ${employee.last_name}` : "Employee"}
        </Text>
        <Text style={styles.employeeDesignation}>
          {employee?.designation || "Employee"}
        </Text>
        <Text style={styles.employeeDepartment}>
          {employee?.department_name || "Department"}
        </Text>
      </View>

      {/* Profile Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoValue}>{employee?.employee_code || "N/A"}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{employee?.email || "N/A"}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue}>{employee?.mobile || "N/A"}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>
              {employee?.dob ? formatDate(employee.dob) : "N/A"}
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{employee?.gender || "N/A"}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Blood Group</Text>
            <Text style={styles.infoValue}>{employee?.blood_group || "N/A"}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>PAN No.</Text>
            <Text style={styles.infoValue}>{employee?.pan_no || "N/A"}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Aadhar No.</Text>
            <Text style={styles.infoValue}>{employee?.aadhar_no || "N/A"}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Joining Date</Text>
            <Text style={styles.infoValue}>
              {employee?.joining_date ? formatDate(employee.joining_date) : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Address Section */}
      {employee?.address && employee.address.length > 0 && (
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressText}>
              {employee.address[0].street}, {employee.address[0].city}
            </Text>
            <Text style={styles.addressText}>
              {employee.address[0].state}, {employee.address[0].country}, {employee.address[0].zip}
            </Text>
          </View>
        </View>
      )}

      {/* Role and Permissions */}
      <View style={styles.roleSection}>
        <Text style={styles.sectionTitle}>Role and Permissions</Text>
        <View style={styles.roleCard}>
          {employee?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{employee.role}</Text>
            </View>
          )}
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  avatarSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  uploadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  employeeDesignation: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 14,
    color: '#9ca3af',
  },
  infoSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  addressSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  addressText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  roleSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roleCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '500',
  },
});