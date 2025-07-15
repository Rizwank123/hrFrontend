import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';

export default function HRDashboard() {
  const { user, logout } = useAuthStore();

  // Get basic stats
  const { data: stats } = useQuery({
    queryKey: ["hr-stats"],
    queryFn: async () => {
      try {
        const [employeesRes, attendanceRes] = await Promise.all([
          api.get('/employees'),
          api.post('/attendance', { 
            from_date: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
            to_date: new Date().toISOString().split('T')[0] + 'T23:59:59Z'
          })
        ]);
        
        return {
          totalEmployees: employeesRes.data.data?.length || 0,
          todayAttendance: attendanceRes.data.data?.length || 0,
        };
      } catch (error) {
        return { totalEmployees: 0, todayAttendance: 0 };
      }
    },
  });

  const dashboardItems = [
    {
      title: 'Employee Management',
      subtitle: 'Manage employee information',
      icon: 'people-outline',
      color: '#3b82f6',
      route: '/employees',
      count: stats?.totalEmployees
    },
    {
      title: 'Attendance Tracking',
      subtitle: 'Monitor employee attendance',
      icon: 'time-outline',
      color: '#10b981',
      route: '/attendance',
      count: stats?.todayAttendance
    },
    {
      title: 'Leave Management',
      subtitle: 'Approve or reject leave requests',
      icon: 'calendar-outline',
      color: '#f59e0b',
      route: '/leaves'
    },
    {
      title: 'Reports & Analytics',
      subtitle: 'View detailed reports',
      icon: 'bar-chart-outline',
      color: '#8b5cf6',
      route: '/reports'
    }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>HR Manager</Text>
          <Text style={styles.subtitleText}>
            Manage your organization's workforce efficiently
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="people" size={24} color="#3b82f6" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{stats?.totalEmployees || 0}</Text>
            <Text style={styles.statLabel}>Total Employees</Text>
          </View>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{stats?.todayAttendance || 0}</Text>
            <Text style={styles.statLabel}>Today's Attendance</Text>
          </View>
        </View>
      </View>

      {/* Dashboard Items */}
      <View style={styles.grid}>
        {dashboardItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              {item.count !== undefined && (
                <Text style={[styles.cardCount, { color: item.color }]}>
                  {item.count} items
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Add Employee</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={20} color="#10b981" />
            <Text style={styles.actionButtonText}>Export Report</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  grid: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  cardCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  quickActions: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});