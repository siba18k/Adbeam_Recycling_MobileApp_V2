// AdminAnalytics.js
// Campus Sustainability Office Admin Dashboard (Placeholder)

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatCard, ComparisonBar } from './ReadableCharts';

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  
  // Mock admin data
  const mockAdminData = {
    overview: {
      totalUsers: 1250,
      activeUsers: 890,
      totalRecycled: 15420,
      participationRate: '71.2',
      impact: {
        totalCO2: '3084.0',
        totalWater: '30840.0',
        totalEnergy: '29298.0'
      }
    },
    topPerformers: [
      { id: 'user001', total: 89 },
      { id: 'user045', total: 76 },
      { id: 'user123', total: 68 },
      { id: 'user890', total: 62 },
      { id: 'user456', total: 58 }
    ],
    buildingData: [
      { location: 'Engineering Building', total: 2450 },
      { location: 'Student Center', total: 1890 },
      { location: 'Library', total: 1650 },
      { location: 'Science Building', total: 1420 },
      { location: 'Arts Building', total: 1180 }
    ],
    engagementMetrics: {
      weeklyActive: 445,
      retentionRate: '67.8',
      averageItemsPerUser: '12.3'
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏛️ Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Campus Sustainability Office</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {['week', 'month', 'semester', 'year'].map(range => (
          <TouchableOpacity
            key={range}
            style={[styles.timeButton, timeRange === range && styles.timeButtonActive]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.timeButtonText, timeRange === range && styles.timeButtonTextActive]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* Campus Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Campus Overview</Text>
          
          <StatCard icon="👥" value={mockAdminData.overview.totalUsers} label="Total Students" 
            subtitle="Registered users" color="#3B82F6" />
          
          <StatCard icon="✅" value={mockAdminData.overview.activeUsers} label="Active Recyclers" 
            subtitle={`${mockAdminData.overview.participationRate}% participation`} color="#10B981" />
          
          <StatCard icon="♻️" value={mockAdminData.overview.totalRecycled} label="Items Recycled" 
            subtitle="Campus total" color="#F59E0B" />
          
          <StatCard icon="🌍" value={mockAdminData.overview.impact.totalCO2} label="CO₂ Saved (kg)" 
            subtitle="Environmental impact" color="#059669" />
        </View>

        {/* Environmental Impact Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Environmental Impact</Text>
          
          <View style={styles.impactGrid}>
            <View style={styles.impactCard}>
              <Text style={styles.impactIcon}>🌿</Text>
              <Text style={styles.impactValue}>{mockAdminData.overview.impact.totalCO2} kg</Text>
              <Text style={styles.impactLabel}>CO₂ Saved</Text>
            </View>
            
            <View style={styles.impactCard}>
              <Text style={styles.impactIcon}>💧</Text>
              <Text style={styles.impactValue}>{mockAdminData.overview.impact.totalWater} L</Text>
              <Text style={styles.impactLabel}>Water Saved</Text>
            </View>
            
            <View style={styles.impactCard}>
              <Text style={styles.impactIcon}>⚡</Text>
              <Text style={styles.impactValue}>{mockAdminData.overview.impact.totalEnergy} kWh</Text>
              <Text style={styles.impactLabel}>Energy Saved</Text>
            </View>
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Recyclers</Text>
          
          {mockAdminData.topPerformers.slice(0, 5).map((user, index) => (
            <View key={user.id} style={styles.performerCard}>
              <View style={styles.performerRank}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
                <Text style={styles.rankEmoji}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                </Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>User {user.id.substring(0, 8)}</Text>
                <Text style={styles.performerStats}>
                  {user.total} items • {(user.total * 0.2).toFixed(1)} kg CO₂
                </Text>
              </View>
              <Text style={styles.performerTotal}>{user.total}</Text>
            </View>
          ))}
        </View>

        {/* Building Hotspots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Recycling Hotspots</Text>
          
          {mockAdminData.buildingData.slice(0, 5).map((building, index) => (
            <ComparisonBar
              key={building.location}
              userValue={building.total}
              campusAverage={mockAdminData.overview.totalRecycled / mockAdminData.buildingData.length}
              label={building.location}
            />
          ))}
        </View>

        {/* Engagement Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Engagement Metrics</Text>
          
          <StatCard icon="📅" value={mockAdminData.engagementMetrics.weeklyActive} 
            label="Weekly Active Users" subtitle="Users who recycled this week" color="#8B5CF6" />
          
          <StatCard icon="🔄" value={`${mockAdminData.engagementMetrics.retentionRate}%`} 
            label="Retention Rate" subtitle="Users active in last 7 days" color="#EC4899" />
          
          <StatCard icon="📊" value={mockAdminData.engagementMetrics.averageItemsPerUser} 
            label="Average per User" subtitle="Items recycled per student" color="#06B6D4" />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: 'white', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  timeRangeContainer: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  timeButton: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F3F4F6',
    borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB'
  },
  timeButtonActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  timeButtonText: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#6B7280' },
  timeButtonTextActive: { color: 'white' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  impactGrid: { flexDirection: 'row', gap: 12 },
  impactCard: {
    flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  impactIcon: { fontSize: 32, marginBottom: 8 },
  impactValue: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  impactLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  performerCard: {
    flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 8,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  performerRank: { alignItems: 'center', marginRight: 16 },
  rankNumber: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  rankEmoji: { fontSize: 20, marginTop: 4 },
  performerInfo: { flex: 1 },
  performerName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  performerStats: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  performerTotal: { fontSize: 18, fontWeight: 'bold', color: '#10B981' }
});

export default AdminAnalytics;