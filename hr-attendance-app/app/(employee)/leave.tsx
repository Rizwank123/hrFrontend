import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
import Toast from 'react-native-toast-message';

const LEAVE_CATEGORIES = [
  { id: 'CASUAL_LEAVE', name: 'Casual Leave' },
  { id: 'SICK_LEAVE', name: 'Sick Leave' },
  { id: 'EARNED_LEAVE', name: 'Earned Leave' },
  { id: 'MATERNITY_LEAVE', name: 'Maternity Leave' }
];

const REQUEST_TYPES = [
  { id: 'LEAVE', name: 'Leave' },
  { id: 'OD', name: 'OD (Out Duty)' }
];

const LEAVE_TYPES = [
  { id: 'FULL_DAY', name: 'Full Day' },
  { id: 'HALF_DAY', name: 'Half Day' }
];

export default function LeaveScreen() {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [formData, setFormData] = useState({
    requestType: '',
    leaveCategory: '',
    leaveType: '',
    duration: '',
    startDate: '',
    endDate: '',
    reason: '',
    departmentApprovedBy: ''
  });
  
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

  // Fetch leave balance
  const { data: leaveBalance, isLoading: leaveBalanceLoading } = useQuery({
    queryKey: ["leaveBalance", employee?.id],
    queryFn: async () => {
      if (!employee?.id) throw new Error("Employee ID not found");
      const response = await api.get(`/leave/employee/${employee.id}`);
      return response.data.data;
    },
    enabled: !!employee?.id,
  });

  // Fetch leave requests
  const { data: leaveRequests, isLoading: leaveRequestsLoading } = useQuery({
    queryKey: ["leaveRequests", employee?.id],
    queryFn: async () => {
      if (!employee?.id) throw new Error("Employee ID not found");
      const response = await api.post("/leave/requests", {
        employee_id: employee.id,
      });
      return response.data.data;
    },
    enabled: !!employee?.id,
  });

  // Fetch department employees for approval
  const { data: departmentEmployees } = useQuery({
    queryKey: ['employees', employee?.company_id, employee?.department_id],
    queryFn: async () => {
      if (!employee?.company_id || !employee?.department_id) return [];
      const res = await api.post('/employees/filter', {
        company_id: employee.company_id,
        department_id: employee.department_id
      });
      return res.data.data;
    },
    enabled: !!employee?.company_id && !!employee?.department_id
  });

  // Submit leave request mutation
  const submitLeaveRequest = useMutation({
    mutationFn: (data: any) => api.post('/leave/apply', data),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Leave request submitted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', employee?.id] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', employee?.id] });
      setShowLeaveForm(false);
      resetForm();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to submit leave request'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      requestType: '',
      leaveCategory: '',
      leaveType: '',
      duration: '',
      startDate: '',
      endDate: '',
      reason: '',
      departmentApprovedBy: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.requestType || !formData.startDate || !formData.endDate || 
        !formData.departmentApprovedBy || !formData.duration || !formData.reason) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (formData.requestType === 'LEAVE' && (!formData.leaveCategory || !formData.leaveType)) {
      Alert.alert('Error', 'Please select leave category and leave type for leave requests');
      return;
    }

    if (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      Alert.alert('Error', 'Duration must be a positive number');
      return;
    }

    const leaveRequest = {
      employee_id: employee?.id,
      request_type: formData.requestType,
      leave_category: formData.requestType === 'LEAVE' ? formData.leaveCategory : null,
      leave_type: formData.requestType === 'LEAVE' ? formData.leaveType : null,
      duration: Number(formData.duration),
      start_date: new Date(formData.startDate).toISOString(),
      end_date: new Date(formData.endDate).toISOString(),
      department_approved_by: formData.departmentApprovedBy,
      leave_status: 'PENDING',
      reason: formData.reason
    };

    submitLeaveRequest.mutate(leaveRequest);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  if (leaveBalanceLoading || leaveRequestsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading leave data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => setShowLeaveForm(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.applyButtonText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Leave Balance */}
      <View style={styles.balanceContainer}>
        <Text style={styles.sectionTitle}>Leave Balance</Text>
        {leaveBalance ? (
          <View style={styles.balanceGrid}>
            <View style={[styles.balanceCard, { backgroundColor: '#dbeafe' }]}>
              <Text style={[styles.balanceLabel, { color: '#1e40af' }]}>Casual Leave</Text>
              <Text style={[styles.balanceValue, { color: '#1e3a8a' }]}>{leaveBalance.casual_leave}</Text>
            </View>
            <View style={[styles.balanceCard, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.balanceLabel, { color: '#166534' }]}>Earned Leave</Text>
              <Text style={[styles.balanceValue, { color: '#14532d' }]}>{leaveBalance.earned_leave}</Text>
            </View>
            <View style={[styles.balanceCard, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.balanceLabel, { color: '#92400e' }]}>Sick Leave</Text>
              <Text style={[styles.balanceValue, { color: '#78350f' }]}>{leaveBalance.sick_leave}</Text>
            </View>
            <View style={[styles.balanceCard, { backgroundColor: '#f3e8ff' }]}>
              <Text style={[styles.balanceLabel, { color: '#7c3aed' }]}>Maternity Leave</Text>
              <Text style={[styles.balanceValue, { color: '#6b21a8' }]}>{leaveBalance.maternity_leave}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>No leave balance data available</Text>
        )}
      </View>

      {/* Leave Requests */}
      <View style={styles.requestsContainer}>
        <Text style={styles.sectionTitle}>Leave Requests</Text>
        {leaveRequests && leaveRequests.length > 0 ? (
          leaveRequests.map((request: any) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestType}>{request.leave_type?.replace('_', ' ')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.leave_status) }]}>
                  <Text style={styles.statusText}>{request.leave_status}</Text>
                </View>
              </View>
              <Text style={styles.requestDates}>
                {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
              </Text>
              <View style={styles.approvalRow}>
                <Text style={styles.approvalLabel}>Department:</Text>
                <View style={[styles.approvalBadge, { backgroundColor: getStatusColor(request.department_approval_status || 'PENDING') }]}>
                  <Text style={styles.approvalText}>{request.department_approval_status || 'PENDING'}</Text>
                </View>
              </View>
              <View style={styles.approvalRow}>
                <Text style={styles.approvalLabel}>HR:</Text>
                <View style={[styles.approvalBadge, { backgroundColor: getStatusColor(request.hr_approval_status || 'PENDING') }]}>
                  <Text style={styles.approvalText}>{request.hr_approval_status || 'PENDING'}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No leave requests found</Text>
        )}
      </View>

      {/* Leave Application Modal */}
      <Modal
        visible={showLeaveForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLeaveForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply for Leave</Text>
            <TouchableOpacity onPress={() => setShowLeaveForm(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Request Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Request Type *</Text>
              <View style={styles.pickerContainer}>
                {REQUEST_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.pickerOption,
                      formData.requestType === type.id && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, requestType: type.id })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.requestType === type.id && styles.pickerOptionTextSelected
                    ]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Leave Category (only for LEAVE type) */}
            {formData.requestType === 'LEAVE' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Leave Category *</Text>
                <View style={styles.pickerContainer}>
                  {LEAVE_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.pickerOption,
                        formData.leaveCategory === category.id && styles.pickerOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, leaveCategory: category.id })}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.leaveCategory === category.id && styles.pickerOptionTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Leave Type (only for LEAVE type) */}
            {formData.requestType === 'LEAVE' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Leave Type *</Text>
                <View style={styles.pickerContainer}>
                  {LEAVE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.pickerOption,
                        formData.leaveType === type.id && styles.pickerOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, leaveType: type.id })}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.leaveType === type.id && styles.pickerOptionTextSelected
                      ]}>
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
                placeholder="Enter duration (e.g., 1, 0.5, 1.5)"
                keyboardType="numeric"
              />
            </View>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* End Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.endDate}
                onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* Department Approval By */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Department Approval By *</Text>
              <View style={styles.pickerContainer}>
                {departmentEmployees?.map((emp: any) => (
                  <TouchableOpacity
                    key={emp.id}
                    style={[
                      styles.pickerOption,
                      formData.departmentApprovedBy === emp.id && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, departmentApprovedBy: emp.id })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.departmentApprovedBy === emp.id && styles.pickerOptionTextSelected
                    ]}>
                      {emp.first_name} {emp.last_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reason */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.reason}
                onChangeText={(text) => setFormData({ ...formData, reason: text })}
                placeholder="Briefly describe your reason for leave"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLeaveForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitLeaveRequest.isPending}
              >
                <Text style={styles.submitButtonText}>
                  {submitLeaveRequest.isPending ? 'Submitting...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  applyButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  balanceContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  requestsContainer: {
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
  requestCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  requestDates: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  approvalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  approvalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  approvalText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    paddingVertical: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  modalButtons: {
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