import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

export default function HRProfileScreen() {
  const { user, logout } = useAuthStore();

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

  const profileSections = [
    {
      title: 'Account Settings',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', action: () => {} },
        { icon: 'lock-closed-outline', label: 'Change Password', action: () => {} },
        { icon: 'notifications-outline', label: 'Notifications', action: () => {} },
      ]
    },
    {
      title: 'HR Tools',
      items: [
        { icon: 'document-text-outline', label: 'Generate Reports', action: () => {} },
        { icon: 'settings-outline', label: 'System Settings', action: () => {} },
        { icon: 'help-circle-outline', label: 'Help & Support', action: () => {} },
      ]
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle-outline', label: 'App Version', value: '1.0.0' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', action: () => {} },
        { icon: 'document-outline', label: 'Terms of Service', action: () => {} },
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* User Info Section */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#9ca3af" />
          </View>
        </View>
        <Text style={styles.userName}>HR Manager</Text>
        <Text style={styles.userRole}>{user?.role || 'HR'}</Text>
        <Text style={styles.userEmail}>{user?.username || 'hr@company.com'}</Text>
      </View>

      {/* Profile Sections */}
      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.menuItem}
                onPress={item.action}
                disabled={!item.action}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon as any} size={20} color="#6b7280" />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.value ? (
                    <Text style={styles.menuItemValue}>{item.value}</Text>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Section */}
      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, styles.logoutIcon]}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              </View>
              <Text style={styles.logoutLabel}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>HR & Attendance Management</Text>
        <Text style={styles.appInfoText}>Version 1.0.0</Text>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionContent: {
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  menuItemRight: {
    alignItems: 'flex-end',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutIcon: {
    backgroundColor: '#fef2f2',
  },
  logoutLabel: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 40,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
});