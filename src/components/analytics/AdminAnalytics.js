// AdminAnalytics.js
// Campus Sustainability Office Admin Dashboard

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl
} from 'react-native';
import database from '@react-native-firebase/database';
import {
  ReadableBarChart,
  ReadableLineChart,
  StatCard,
  ComparisonBar
} from './ReadableCharts';
import EnvironmentalCalculator from './EnvironmentalCalculations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AdminAnalytics = () => {
  const [campusData, setCampusData] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [timeRange]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const [usersSnapshot, statsSnapshot, hotspotsSnapshot] = await Promise.all([
        database().ref('/users').once('value'),
        database().ref(`/campus_stats/${timeRange}`).once('value'),
        database().ref('/recycling_hotspots').once('value')
      ]);

      const users = usersSnapshot.val() || {};
      const stats = statsSnapshot.val() || {};
      const hotspots = hotspotsSnapshot.val() || {};

      processAdminData(users, stats, hotspots);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAdminData = (users, stats, hotspots) => {
    const userArray = Object.entries(users).map(([id, data]) => ({
      id,
      ...data.recycling,
      total: (data.recycling?.plastic || 0) + 
             (data.recycling?.aluminum || 0) + 
             (data.recycling?.glass || 0)
    }));

    // Calculate campus-wide metrics
    const totalUsers = userArray.length;
    const activeUsers = userArray.filter(u => u.total > 0).length;
    const totalRecycled = userArray.reduce((sum, u) => sum + u.total, 0);
    
    // Calculate environmental impact
    const campusImpact = EnvironmentalCalculator.calculateTotalImpact({
      plastic: userArray.reduce((sum, u) => sum + (u.plastic || 0), 0),
      aluminum: userArray.reduce((sum, u) => sum + (u.aluminum || 0), 0),
      glass: userArray.reduce((sum, u) => sum + (u.glass || 0), 0)
    });

    // Top performers
    const topPerformers = userArray
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Department/building breakdown
    const buildingData = processHotspotData(hotspots);

    // Engagement metrics
    const engagementMetrics = calculateEngagementMetrics(userArray);

    setCampusData({
      overview: {
        totalUsers,
        activeUsers,
        totalRecycled,
        participationRate: ((activeUsers / totalUsers) * 100).toFixed(1),
        impact: campusImpact
      },
      topPerformers,
      buildingData,
      engagementMetrics,
      trends: stats.trends || []
    });
  };

  const processHotspotData = (hotspots) => {
    return Object.entries(hotspots).map(([location, data]) => ({
      location,
      total: data.total || 0,
      users: data.activeUsers || 0,
      materials: data.materials || {}
    })).sort((a, b) => b.total - a.total);
  };

  const calculateEngagementMetrics = (users) => {
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyActive = users.filter(u => 
      u.lastActivity && new Date(u.lastActivity) > oneWeekAgo
    ).length;

    const retentionRate = users.length > 0 ? 
      ((weeklyActive / users.length) * 100).toFixed(1) : 0;

    return {
      weeklyActive,
      retentionRate,
      averageItemsPerUser: users.length > 0 ? 
        (users.reduce((sum, u) => sum + u.total, 0) / users.length).toFixed(1) : 0
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

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

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Campus Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Campus Overview</Text>
          
          <View style={styles.overviewGrid}>
            <StatCard
              icon="👥"
              value={campusData?.overview.totalUsers || 0}
              label="Total Students"
              subtitle="Registered users"
              color="#3B82F6"
            />
            
            <StatCard
              icon="✅"
              value={campusData?.overview.activeUsers || 0}
              label="Active Recyclers"
              subtitle={`${campusData?.overview.participationRate || 0}% participation`}
              color="#10B981"
            />
            
            <StatCard
              icon="♻️"
              value={campusData?.overview.totalRecycled || 0}
              label="Items Recycled"
              subtitle="Campus total"
              color="#F59E0B"
            />
            
            <StatCard
              icon="🌍"
              value={campusData?.overview.impact?.totalCO2 || '0.0'}
              label="CO₂ Saved (kg)"
              subtitle="Environmental impact"
              color="#059669"
            />
          </View>
        </View>

        {/* Environmental Impact Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Environmental Impact</Text>
          
          <View style={styles.impactGrid}>
            <View style={styles.impactCard}>
              <Text style={styles.impactIcon}>🌿</Text>
              <Text style={styles.impactValue}>
                {campusData?.overview.impact?.totalCO2 || '0.0'} kg
              </Text>
              <Text style={styles.impactLabel}>CO₂ Saved</Text>
              <Text style={styles.impactEquivalent}>
                ≈ {((campusData?.overview.impact?.totalCO2 || 0) / 21.77).toFixed(1)} trees planted
              </Text>
            </View>
            
            <View style={styles.impactCard}>
              <Text style={styles.impactIcon}>💧</Text>
              <Text style={styles.impactValue}>
                {campusData?.overview.impact?.totalWater || '0.0'} L
              </Text>
              <Text style={styles.impactLabel}>Water Saved</Text>
              <Text style={styles.impactEquivalent}>
                ≈ {((campusData?.overview.impact?.totalWater || 0) / 75).toFixed(1)} showers
              </Text>
            </View>
            
            <View style={styles.impactCard}>
              <Text style={styles.impactIcon}>⚡</Text>
              <Text style={styles.impactValue}>
                {campusData?.overview.impact?.totalEnergy || '0.0'} kWh
              </Text>
              <Text style={styles.impactLabel}>Energy Saved</Text>
              <Text style={styles.impactEquivalent}>
                ≈ {((campusData?.overview.impact?.totalEnergy || 0) / 30).toFixed(1)} homes/day
              </Text>
            </View>
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Recyclers</Text>
          
          {campusData?.topPerformers?.slice(0, 5).map((user, index) => (
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
                  {user.total} items • {((user.total || 0) * 0.2).toFixed(1)} kg CO₂
                </Text>
              </View>
              <Text style={styles.performerTotal}>{user.total}</Text>
            </View>
          ))}
        </View>

        {/* Building/Location Hotspots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Recycling Hotspots</Text>
          
          {campusData?.buildingData?.slice(0, 8).map((building, index) => (
            <ComparisonBar
              key={building.location}
              userValue={building.total}
              campusAverage={campusData.overview.totalRecycled / campusData.buildingData.length}
              label={building.location}
            />
          ))}
        </View>

        {/* Engagement Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Engagement Metrics</Text>
          
          <StatCard
            icon="📅"
            value={campusData?.engagementMetrics?.weeklyActive || 0}
            label="Weekly Active Users"
            subtitle="Users who recycled this week"
            color="#8B5CF6"
          />
          
          <StatCard
            icon="🔄"
            value={`${campusData?.engagementMetrics?.retentionRate || 0}%`}
            label="Retention Rate"
            subtitle="Users active in last 7 days"
            color="#EC4899"
          />
          
          <StatCard
            icon="📊"
            value={campusData?.engagementMetrics?.averageItemsPerUser || 0}
            label="Average per User"
            subtitle="Items recycled per student"
            color="#06B6D4"
          />
        </View>

        {/* Material Distribution */}
        {campusData?.overview.impact?.breakdown && (
          <View style={styles.section}>
            <ReadableBarChart
              title="Material Distribution Across Campus"
              data={campusData.overview.impact.breakdown.map(item => item.count)}
              color="#10B981"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280'
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  timeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  timeButtonText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  timeButtonTextActive: {
    color: 'white'
  },
  content: {
    flex: 1
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16
  },
  overviewGrid: {
    gap: 12
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 12
  },
  impactCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  impactIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  impactValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  impactLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  impactEquivalent: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center'
  },
  performerCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  performerRank: {
    alignItems: 'center',
    marginRight: 16
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151'
  },
  rankEmoji: {
    fontSize: 20,
    marginTop: 4
  },
  performerInfo: {
    flex: 1
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  performerStats: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  performerTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981'
  }
});

export default AdminAnalytics;
