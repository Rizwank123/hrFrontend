import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../../lib/axios';
import Toast from 'react-native-toast-message';

export default function AttendanceScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
      return res.data.data;
    }
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-history', selectedCompanyId, selectedDate],
    queryFn: async () => {
      if (!selectedCompanyId && companies && companies.length > 0) {
        return [];
      }
      
      const filters: any = {
        company_id: selectedCompanyId || (companies?.[0]?.id),
        from_date: selectedDate + 'T00:00:00Z',
        to_date: selectedDate + 'T23:59:59Z'
      };

      const res = await api.post('/attendance', filters);
      return res.data.data;
    },
    enabled: !!companies?.length
  });

  const downloadReport = async () => {
    try {
      const filters = {
        company_id: selectedCompanyId || companies?.[0]?.id,
        from_date: selectedDate + 'T00:00:00Z',
        to_date: selectedDate + 'T23:59:59Z'
      };

      await api.post('/attendance/report', filters, { responseType: 'blob' });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Attendance report downloaded successfully'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download attendance report'
      });
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'hh:mm a');
    } catch {
      return '--';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHECKED_OUT': return '#10b981';
      case 'CHECKED_IN': return '#f59e0b';
      default: return '#6b7280';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Ionicons name="filter-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadButton} onPress={downloadReport}>
            <Ionicons name="download-outline" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <Text style={styles.dateLabel}>Selected Date:</Text>
        <TouchableOpacity style={styles.dateButton}>
          <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
          <Text style={styles.dateText}>{format(new Date(selectedDate), 'MMM dd, yyyy')}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{attendanceData?.length || 0}</Text>
          <Text style={styles.summaryLabel}>Total Records</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {attendanceData?.filter((record: any) => record.attendance_status === 'CHECKED_OUT').length || 0}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {attendanceData?.filter((record: any) => record.attendance_status === 'CHECKED_IN').length || 0}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
      </View>

      {/* Attendance List */}
      <ScrollView style={styles.attendanceList}>
        {attendanceData && attendanceData.length > 0 ? (
          attendanceData.map((record: any) => (
            <View key={record.id} style={styles.attendanceCard}>
              <View style={styles.attendanceHeader}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>Employee #{record.employee_id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.attendance_status) }]}>
                    <Text style={styles.statusText}>{record.attendance_status.replace('_', ' ')}</Text>
                  </View>
                </View>
                <Text style={styles.attendanceDate}>
                  {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
                </Text>
              </View>
              
              <View style={styles.timeRow}>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Check In</Text>
                  <Text style={styles.timeValue}>
                    {record.check_in_time ? formatTime(record.check_in_time) : '--:--'}
                  </Text>
                </View>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Check Out</Text>
                  <Text style={styles.timeValue}>
                    {record.check_out_time && record.attendance_status === 'CHECKED_OUT'
                      ? formatTime(record.check_out_time)
                      : '--:--'}
                  </Text>
                </View>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Duration</Text>
                  <Text style={styles.timeValue}>{record.duration || '--'}</Text>
                </View>
              </View>

              {record.check_in_type && (
                <View style={styles.typeRow}>
                  <Ionicons 
                    name={record.check_in_type === 'FIELD' ? 'location-outline' : 'business-outline'} 
                    size={16} 
                    color="#6b7280" 
                  />
                  <Text style={styles.typeText}>{record.check_in_type} Check-in</Text>
                </View>
              )}

              {record.images && record.images.length > 0 && (
                <View style={styles.imagesRow}>
                  <Text style={styles.imagesLabel}>Images: {record.images.length}</Text>
                  <TouchableOpacity style={styles.viewImagesButton}>
                    <Text style={styles.viewImagesText}>View</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.noDataText}>No attendance records found</Text>
            <Text style={styles.noDataSubtext}>
              {selectedCompanyId ? 'Try selecting a different date' : 'Please select a company to view records'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Attendance</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Company</Text>
              <View style={styles.companyOptions}>
                {companies?.map((company: any) => (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.companyOption,
                      selectedCompanyId === company.id && styles.companyOptionSelected
                    ]}
                    onPress={() => setSelectedCompanyId(company.id)}
                  >
                    <Text style={[
                      styles.companyOptionText,
                      selectedCompanyId === company.id && styles.companyOptionTextSelected
                    ]}>
                      {company.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterButtons}>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
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
  dateSelector: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
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
  attendanceList: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  attendanceCard: {
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
  attendanceHeader: {
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  imagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imagesLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewImagesButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 6,
  },
  viewImagesText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noDataText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
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
  filterGroup: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  companyOptions: {
    gap: 8,
  },
  companyOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  companyOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  companyOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  companyOptionTextSelected: {
    color: 'white',
  },
  filterButtons: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});