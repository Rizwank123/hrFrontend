import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../../lib/axios';
import Toast from 'react-native-toast-message';

const LEAVE_TYPES = [
  { id: 'CASUAL_LEAVE', name: 'Casual Leave' },
  { id: 'SICK_LEAVE', name: 'Sick Leave' },
  { id: 'EARNED_LEAVE', name: 'Earned Leave' },
  { id: 'MATERNITY_LEAVE', name: 'Maternity Leave' }
];

const APPROVAL_STATUS = [
  { id: 'PENDING', name: 'Pending' },
  { id: 'APPROVED', name: 'Approved' },
  { id: 'REJECTED', name: 'Rejected' }
];

export default function LeavesScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [approveLeaveType, setApproveLeaveType] = useState('');
  const [filters, setFilters] = useState<any>({});
  
  const queryClient = useQueryClient();

  // Fetch leave requests
  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['leave-requests', filters],
    queryFn: async () => {
      const response = await api.post('/leave/requests', filters);
      return response.data.data;
    }
  });

  // Update leave request status
  const updateLeaveStatus = useMutation({
    mutationFn: async ({ id, status, reason, leave_category }: { 
      id: string; 
      status: string; 
      reason?: string; 
      leave_category?: string 
    }) => {
      const payload = {
        hr_approval_status: status,
        hr_approved_at: new Date().toISOString(),
        ...(reason && { hr_rejection_reason: reason }),
        ...(leave_category && { leave_category })
      };

      return api.patch(`/leave/requests/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Leave request updated successfully'
      });
      handleCloseModals();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update leave request'
      });
    }
  });

  const handleCloseModals = () => {
    setShowRejectionModal(false);
    setShowApproveModal(false);
    setRejectionReason('');
    setCurrentRequestId(null);
    setApproveLeaveType('');
  };

  const handleReject = (id: string) => {
    setCurrentRequestId(id);
    setShowRejectionModal(true);
  };

  const handleApprove = (id: string) => {
    setCurrentRequestId(id);
    setShowApproveModal(true);
  };

  const handleSubmitRejection = () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    if (currentRequestId) {
      updateLeaveStatus.mutate({
        id: currentRequestId,
        status: 'REJECTED',
        reason: rejectionReason
      });
    }
  };

  const handleSubmitApprove = () => {
    if (!approveLeaveType) {
      Alert.alert('Error', 'Please select a leave category');
      return;
    }
    
    if (currentRequestId) {
      updateLeaveStatus.mutate({
        id: currentRequestId,
        status: 'APPROVED',
        leave_category: approveLeaveType,
      });
    }
  };

  const downloadReport = async () => {
    try {
      await api.post('/leave/report', filters, { responseType: 'blob' });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Leave report downloaded successfully'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download leave report'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading leave requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leave Requests</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Ionicons name="filter-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadButton} onPress={downloadReport}>
            <Ionicons name="download-outline" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{leaveRequests?.length || 0}</Text>
          <Text style={styles.summaryLabel}>Total Requests</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {leaveRequests?.filter((req: any) => req.hr_approval_status === 'PENDING').length || 0}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {leaveRequests?.filter((req: any) => req.hr_approval_status === 'APPROVED').length || 0}
          </Text>
          <Text style={styles.summaryLabel}>Approved</Text>
        </View>
      </View>

      {/* Leave Requests List */}
      <ScrollView style={styles.requestsList}>
        {leaveRequests && leaveRequests.length > 0 ? (
          leaveRequests.map((request: any) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{request.employee_name}</Text>
                  <View style={[styles.leaveTypeBadge, { backgroundColor: '#dbeafe' }]}>
                    <Text style={styles.leaveTypeText}>{request.leave_type}</Text>
                  </View>
                </View>
                <Text style={styles.requestDate}>
                  {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                </Text>
              </View>

              <View style={styles.approvalRow}>
                <View style={styles.approvalItem}>
                  <Text style={styles.approvalLabel}>Department:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.department_approval_status || 'PENDING') }]}>
                    <Text style={styles.statusText}>{request.department_approval_status || 'PENDING'}</Text>
                  </View>
                </View>
                <View style={styles.approvalItem}>
                  <Text style={styles.approvalLabel}>HR:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.hr_approval_status || 'PENDING') }]}>
                    <Text style={styles.statusText}>{request.hr_approval_status || 'PENDING'}</Text>
                  </View>
                </View>
              </View>

              {request.reason && (
                <View style={styles.reasonRow}>
                  <Text style={styles.reasonLabel}>Reason:</Text>
                  <Text style={styles.reasonText}>{request.reason}</Text>
                </View>
              )}

              {request.hr_approval_status === 'PENDING' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(request.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(request.id)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {request.hr_rejection_reason && (
                <View style={styles.rejectionReason}>
                  <Text style={styles.rejectionLabel}>HR Rejection Reason:</Text>
                  <Text style={styles.rejectionText}>{request.hr_rejection_reason}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.noDataText}>No leave requests found</Text>
          </View>
        )}
      </ScrollView>

      {/* Approval Modal */}
      <Modal
        visible={showApproveModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Leave Category</Text>
            
            <View style={styles.leaveTypeOptions}>
              {LEAVE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.leaveTypeOption,
                    approveLeaveType === type.id && styles.leaveTypeOptionSelected
                  ]}
                  onPress={() => setApproveLeaveType(type.id)}
                >
                  <Text style={[
                    styles.leaveTypeOptionText,
                    approveLeaveType === type.id && styles.leaveTypeOptionTextSelected
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModals}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.approveModalButton} 
                onPress={handleSubmitApprove}
                disabled={updateLeaveStatus.isPending}
              >
                <Text style={styles.approveModalButtonText}>
                  {updateLeaveStatus.isPending ? 'Approving...' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectionModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Provide Rejection Reason</Text>
            
            <TextInput
              style={styles.reasonInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter HR rejection reason"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModals}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rejectModalButton} 
                onPress={handleSubmitRejection}
                disabled={updateLeaveStatus.isPending}
              >
                <Text style={styles.rejectModalButtonText}>
                  {updateLeaveStatus.isPending ? 'Submitting...' : 'Submit Rejection'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.filtersModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Filter Leave Requests</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filtersContent}>
            <TouchableOpacity 
              style={styles.applyFiltersButton} 
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  requestsList: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  leaveTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaveTypeText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  approvalItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  approvalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  reasonRow: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectionReason: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    marginBottom: 2,
  },
  rejectionText: {
    fontSize: 12,
    color: '#dc2626',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noDataText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  leaveTypeOptions: {
    marginBottom: 20,
    gap: 8,
  },
  leaveTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  leaveTypeOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  leaveTypeOptionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  leaveTypeOptionTextSelected: {
    color: 'white',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    height: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
  approveModalButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
  },
  approveModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectModalButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersModalContainer: {
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
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filtersContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  applyFiltersButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  applyFiltersButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});