// CampusComparison.js
// Campus-wide Comparison and Peer Rankings

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated
} from 'react-native';
import database from '@react-native-firebase/database';
import { ComparisonBar, StatCard } from './ReadableCharts';
import EnvironmentalCalculator from './EnvironmentalCalculations';

const CampusComparison = ({ userId, userRecyclingData }) => {
  const [campusData, setcampusData] = useState(null);
  const [userRanking, setUserRanking] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // week, month, semester
  const [loading, setLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    fetchCampusData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, [timeRange]);

  const fetchCampusData = async () => {
    try {
      setLoading(true);
      const snapshot = await database()
        .ref(`/campus_stats/${timeRange}`)
        .once('value');
      
      const data = snapshot.val();
      
      if (data) {
        processCampusData(data);
      }
    } catch (error) {
      console.error('Error fetching campus data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCampusData = (data) => {
    const users = Object.values(data.users || {});
    const userTotal = userRecyclingData.totalItems || 0;
    
    // Calculate campus statistics
    const campusStats = {
      totalUsers: users.length,
      totalRecycled: users.reduce((sum, u) => sum + (u.total || 0), 0),
      averagePerUser: users.length > 0 
        ? Math.round(users.reduce((sum, u) => sum + (u.total || 0), 0) / users.length)
        : 0,
      topRecycler: Math.max(...users.map(u => u.total || 0)),
      activeUsers: users.filter(u => (u.total || 0) > 0).length
    };

    // Calculate user ranking
    const sortedUsers = users
      .map(u => u.total || 0)
      .sort((a, b) => b - a);
    
    const userRank = sortedUsers.findIndex(total => total === userTotal) + 1;
    const percentile = EnvironmentalCalculator.calculatePercentile(
      userTotal, 
      sortedUsers
    );

    setUserRanking({
      rank: userRank,
      percentile,
      totalUsers: sortedUsers.length,
      aboveAverage: userTotal > campusStats.averagePerUser
    });

    setCampusData(campusStats);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading campus data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity
            style={[styles.timeButton, timeRange === 'week' && styles.timeButtonActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'week' && styles.timeButtonTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeButton, timeRange === 'month' && styles.timeButtonActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'month' && styles.timeButtonTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeButton, timeRange === 'semester' && styles.timeButtonActive]}
            onPress={() => setTimeRange('semester')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'semester' && styles.timeButtonTextActive]}>
              Semester
            </Text>
          </TouchableOpacity>
        </View>

        {/* Your Ranking */}
        {userRanking && (
          <View style={styles.rankingCard}>
            <Text style={styles.sectionTitle}>Your Campus Ranking</Text>
            <View style={styles.rankingContent}>
              <Text style={styles.rankEmoji}>
                {getRankEmoji(userRanking.rank)}
              </Text>
              <View style={styles.rankingDetails}>
                <Text style={styles.rankNumber}>
                  #{userRanking.rank}
                </Text>
                <Text style={styles.rankTotal}>
                  out of {userRanking.totalUsers} students
                </Text>
                <View style={styles.percentileBadge}>
                  <Text style={styles.percentileText}>
                    Top {100 - userRanking.percentile}% • {getPercentileMessage(userRanking.percentile)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Campus Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campus Statistics</Text>
          
          <StatCard
            icon="🎯"
            value={campusData?.totalRecycled || 0}
            label="Total Items Recycled"
            subtitle="By all students this period"
            color="#10B981"
          />

          <StatCard
            icon="👥"
            value={campusData?.activeUsers || 0}
            label="Active Recyclers"
            subtitle={`Out of ${campusData?.totalUsers || 0} registered students`}
            color="#3B82F6"
          />

          <StatCard
            icon="📊"
            value={campusData?.averagePerUser || 0}
            label="Campus Average"
            subtitle="Items per student"
            color="#F59E0B"
          />

          <StatCard
            icon="🏆"
            value={campusData?.topRecycler || 0}
            label="Top Recycler"
            subtitle="Most items this period"
            color="#8B5CF6"
          />
        </View>

        {/* Comparisons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          
          <ComparisonBar
            userValue={userRecyclingData.totalItems || 0}
            campusAverage={campusData?.averagePerUser || 0}
            label="Total Items Recycled"
          />

          <ComparisonBar
            userValue={parseFloat(userRecyclingData.impact?.totalCO2 || 0)}
            campusAverage={parseFloat(campusData?.averagePerUser || 0) * 0.2}
            label="CO₂ Saved (kg)"
          />

          <ComparisonBar
            userValue={parseFloat(userRecyclingData.impact?.totalEnergy || 0)}
            campusAverage={parseFloat(campusData?.averagePerUser || 0) * 1.9}
            label="Energy Saved (kWh)"
          />
        </View>

        {/* Encouragement Message */}
        <View style={styles.encouragementCard}>
          <Text style={styles.encouragementEmoji}>
            {userRanking?.aboveAverage ? '🎉' : '💪'}
          </Text>
          <Text style={styles.encouragementText}>
            {userRanking?.aboveAverage
              ? `Great job! You're recycling more than the campus average. Keep up the excellent work!`
              : `You're making a difference! Try to recycle a few more items to beat the campus average.`}
          </Text>
        </View>

        {/* Environmental Leadership Board */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Environmental Impact</Text>
          <View style={styles.leaderboardCard}>
            <Text style={styles.leaderboardText}>
              Together, our campus has saved:
            </Text>
            <View style={styles.impactGrid}>
              <View style={styles.impactItem}>
                <Text style={styles.impactValue}>
                  {((campusData?.totalRecycled || 0) * 0.2).toFixed(1)}
                </Text>
                <Text style={styles.impactLabel}>kg CO₂</Text>
              </View>
              <View style={styles.impactItem}>
                <Text style={styles.impactValue}>
                  {((campusData?.totalRecycled || 0) * 2.0).toFixed(1)}
                </Text>
                <Text style={styles.impactLabel}>Liters Water</Text>
              </View>
              <View style={styles.impactItem}>
                <Text style={styles.impactValue}>
                  {((campusData?.totalRecycled || 0) * 1.9).toFixed(1)}
                </Text>
                <Text style={styles.impactLabel}>kWh Energy</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
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
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  timeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  timeButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  timeButtonTextActive: {
    color: 'white'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16
  },
  rankingCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  rankingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16
  },
  rankEmoji: {
    fontSize: 48,
    marginRight: 20
  },
  rankingDetails: {
    flex: 1
  },
  rankNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  rankTotal: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4
  },
  percentileBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  percentileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF'
  },
  encouragementCard: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  encouragementEmoji: {
    fontSize: 32,
    marginRight: 16
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20
  },
  leaderboardCard: {
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 12
  },
  leaderboardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 16,
    textAlign: 'center'
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  impactItem: {
    alignItems: 'center'
  },
  impactValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#047857'
  },
  impactLabel: {
    fontSize: 12,
    color: '#065F46',
    marginTop: 4
  }
});

export default CampusComparison;
