// CampusComparison.js
// Campus-wide Comparison and Peer Rankings (Placeholder)

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatCard, ComparisonBar } from './ReadableCharts';

const CampusComparison = ({ userId, userRecyclingData }) => {
  const [timeRange, setTimeRange] = useState('week');
  
  // Mock campus data
  const mockCampusData = {
    totalUsers: 1250,
    activeUsers: 890,
    totalRecycled: 15420,
    averagePerUser: 17,
    topRecycler: 89
  };
  
  // Mock user ranking
  const mockUserRanking = {
    rank: 42,
    percentile: 78,
    totalUsers: mockCampusData.totalUsers,
    aboveAverage: (userRecyclingData.totalItems || 0) > mockCampusData.averagePerUser
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '⭐';
    return '👍';
  };

  const getPercentileMessage = (percentile) => {
    if (percentile >= 90) return 'Outstanding! Top 10%';
    if (percentile >= 75) return 'Excellent! Top 25%';
    if (percentile >= 50) return 'Good! Above Average';
    if (percentile >= 25) return 'Keep Going!';
    return 'You Can Do Better!';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {['week', 'month', 'semester'].map(range => (
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

      {/* Your Ranking */}
      <View style={styles.rankingCard}>
        <Text style={styles.sectionTitle}>Your Campus Ranking</Text>
        <View style={styles.rankingContent}>
          <Text style={styles.rankEmoji}>{getRankEmoji(mockUserRanking.rank)}</Text>
          <View style={styles.rankingDetails}>
            <Text style={styles.rankNumber}>#{mockUserRanking.rank}</Text>
            <Text style={styles.rankTotal}>out of {mockUserRanking.totalUsers} students</Text>
            <View style={styles.percentileBadge}>
              <Text style={styles.percentileText}>
                Top {100 - mockUserRanking.percentile}% • {getPercentileMessage(mockUserRanking.percentile)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Campus Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campus Statistics</Text>
        
        <StatCard icon="🎯" value={mockCampusData.totalRecycled} label="Total Items Recycled" 
          subtitle="By all students this period" color="#10B981" />
        
        <StatCard icon="👥" value={mockCampusData.activeUsers} label="Active Recyclers" 
          subtitle={`Out of ${mockCampusData.totalUsers} registered students`} color="#3B82F6" />
        
        <StatCard icon="📊" value={mockCampusData.averagePerUser} label="Campus Average" 
          subtitle="Items per student" color="#F59E0B" />
        
        <StatCard icon="🏆" value={mockCampusData.topRecycler} label="Top Recycler" 
          subtitle="Most items this period" color="#8B5CF6" />
      </View>

      {/* Comparisons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Performance</Text>
        
        <ComparisonBar
          userValue={userRecyclingData.totalItems || 0}
          campusAverage={mockCampusData.averagePerUser}
          label="Total Items Recycled"
        />
        
        <ComparisonBar
          userValue={parseFloat(userRecyclingData.impact?.totalCO2 || 0)}
          campusAverage={mockCampusData.averagePerUser * 0.2}
          label="CO₂ Saved (kg)"
        />
        
        <ComparisonBar
          userValue={parseFloat(userRecyclingData.impact?.totalEnergy || 0)}
          campusAverage={mockCampusData.averagePerUser * 1.9}
          label="Energy Saved (kWh)"
        />
      </View>

      {/* Encouragement */}
      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementEmoji}>
          {mockUserRanking.aboveAverage ? '🎉' : '💪'}
        </Text>
        <Text style={styles.encouragementText}>
          {mockUserRanking.aboveAverage
            ? 'Great job! You\'re recycling more than the campus average. Keep up the excellent work!'
            : 'You\'re making a difference! Try to recycle a few more items to beat the campus average.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  timeRangeContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  timeButton: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'white',
    borderRadius: 8, borderWidth: 2, borderColor: '#E5E7EB'
  },
  timeButtonActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  timeButtonText: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#6B7280' },
  timeButtonTextActive: { color: 'white' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  rankingCard: {
    backgroundColor: 'white', margin: 16, padding: 20, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  rankingContent: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  rankEmoji: { fontSize: 48, marginRight: 20 },
  rankingDetails: { flex: 1 },
  rankNumber: { fontSize: 36, fontWeight: 'bold', color: '#1F2937' },
  rankTotal: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  percentileBadge: {
    backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginTop: 8, alignSelf: 'flex-start'
  },
  percentileText: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
  encouragementCard: {
    backgroundColor: '#FEF3C7', margin: 16, padding: 20, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center'
  },
  encouragementEmoji: { fontSize: 32, marginRight: 16 },
  encouragementText: { flex: 1, fontSize: 14, color: '#78350F', lineHeight: 20 }
});

export default CampusComparison;