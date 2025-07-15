import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Toast from 'react-native-toast-message';

export default function EmployeesScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data;
    }
  });

  // Fetch companies for dropdown
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
      return res.data.data;
    }
  });

  // Filter employees based on search
  const filteredEmployees = employees?.filter((emp: any) =>
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeePress = (employee: any) => {
    setSelectedEmployee(employee);
  };

  const downloadEmployeeList = async () => {
    try {
      const response = await api.post('/employees/download', {}, {
        responseType: 'blob'
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Employee list downloaded successfully'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download employee list'
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employees</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.downloadButton} onPress={downloadEmployeeList}>
            <Ionicons name="download-outline" size={20} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Employee List */}
      <ScrollView style={styles.employeeList}>
        {filteredEmployees?.map((employee: any) => (
          <TouchableOpacity
            key={employee.id}
            style={styles.employeeCard}
            onPress={() => handleEmployeePress(employee)}
          >
            <View style={styles.employeeInfo}>
              {employee.avatar ? (
                <Image source={{ uri: employee.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#9ca3af" />
                </View>
              )}
              <View style={styles.employeeDetails}>
                <Text style={styles.employeeName}>
                  {employee.first_name} {employee.last_name}
                </Text>
                <Text style={styles.employeeDesignation}>{employee.designation}</Text>
                <Text style={styles.employeeEmail}>{employee.email}</Text>
                <Text style={styles.employeeDepartment}>{employee.department_name}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <Modal
          visible={!!selectedEmployee}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedEmployee(null)}
        >
          <EmployeeDetailsModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
          />
        </Modal>
      )}

      {/* Add Employee Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddEmployeeModal
          companies={companies}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setShowAddModal(false);
          }}
        />
      </Modal>
    </View>
  );
}

// Employee Details Modal Component
function EmployeeDetailsModal({ employee, onClose }: { employee: any; onClose: () => void }) {
  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Employee Details</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.modalContent}>
        <View style={styles.employeeProfile}>
          {employee.avatar ? (
            <Image source={{ uri: employee.avatar }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Ionicons name="person" size={40} color="#9ca3af" />
            </View>
          )}
          <Text style={styles.profileName}>
            {employee.first_name} {employee.last_name}
          </Text>
          <Text style={styles.profileDesignation}>{employee.designation}</Text>
        </View>

        <View style={styles.detailsGrid}>
          <DetailItem label="Employee Code" value={employee.employee_code} />
          <DetailItem label="Email" value={employee.email} />
          <DetailItem label="Mobile" value={employee.mobile} />
          <DetailItem label="Department" value={employee.department_name} />
          <DetailItem label="Role" value={employee.role} />
          <DetailItem label="Gender" value={employee.gender} />
          <DetailItem label="Blood Group" value={employee.blood_group} />
          <DetailItem label="PAN No." value={employee.pan_no} />
          <DetailItem label="Aadhar No." value={employee.aadhar_no} />
        </View>
      </ScrollView>
    </View>
  );
}

// Add Employee Modal Component
function AddEmployeeModal({ companies, onClose, onSuccess }: { companies: any[]; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    designation: '',
    company_id: '',
    department_id: '',
  });

  const addEmployeeMutation = useMutation({
    mutationFn: (data: any) => api.post('/employees', data),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Employee added successfully'
      });
      onSuccess();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add employee'
      });
    }
  });

  const handleSubmit = () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    addEmployeeMutation.mutate(formData);
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Add Employee</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.modalContent}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>First Name *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.first_name}
            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
            placeholder="Enter first name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Last Name *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.last_name}
            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
            placeholder="Enter last name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Email *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Mobile</Text>
          <TextInput
            style={styles.formInput}
            value={formData.mobile}
            onChangeText={(text) => setFormData({ ...formData, mobile: text })}
            placeholder="Enter mobile number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Designation</Text>
          <TextInput
            style={styles.formInput}
            value={formData.designation}
            onChangeText={(text) => setFormData({ ...formData, designation: text })}
            placeholder="Enter designation"
          />
        </View>

        <View style={styles.formButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={addEmployeeMutation.isPending}
          >
            <Text style={styles.submitButtonText}>
              {addEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Detail Item Component
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  employeeList: {
    flex: 1,
    padding: 16,
  },
  employeeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  employeeDesignation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 1,
  },
  employeeEmail: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 1,
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  employeeProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileDesignation: {
    fontSize: 16,
    color: '#6b7280',
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});