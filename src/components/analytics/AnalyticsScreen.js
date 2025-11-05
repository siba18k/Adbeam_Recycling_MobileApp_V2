// AnalyticsScreen.js
// Main Analytics Dashboard Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated
} from 'react-native';
import database from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReadableBarChart,
  ReadableLineChart,
  ReadablePieChart,
  ProgressBar,
  StatCard,
  TrendIndicator
} from './ReadableCharts';
import EnvironmentalCalculator, { MATERIAL_IMPACT } from './EnvironmentalCalculations';
import CampusComparison from './CampusComparison';
import ReportGenerator from './ReportGenerator';

const AnalyticsScreen = ({ userId = 'user123' }) => {
  const [recyclingData, setRecyclingData] = useState({
    plastic: 0,
    aluminum: 0,
    glass: 0
  });
  const [historicalData, setHistoricalData] = useState([]);
  const [currentImpact, setCurrentImpact] = useState(null);
  const [streak, setStreak] = useState(0);
  const [milestones, setMilestones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadData();
    setupRealtimeListener();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, []);

  const loadData = async () => {
    try {
      // Load cached data first for offline capability
      const cachedData = await AsyncStorage.getItem(`recycling_data_${userId}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        processRecyclingData(parsed);
      }

      // Then fetch fresh data
      await fetchRecyclingData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    const userRef = database().ref(`/users/${userId}/recycling`);
    
    userRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        processRecyclingData(data);
        // Cache data for offline use
        AsyncStorage.setItem(`recycling_data_${userId}`, JSON.stringify(data));
      }
    });

    return () => userRef.off();
  };

  const fetchRecyclingData = async () => {
    try {
      const snapshot = await database()
        .ref(`/users/${userId}/recycling`)
        .once('value');
      
      const data = snapshot.val() || {};
      processRecyclingData(data);
    } catch (error) {
      console.error('Error fetching recycling data:', error);
    }
  };

  const processRecyclingData = (data) => {
    // Current totals
    const currentData = {
      plastic: data.plastic || 0,
      aluminum: data.aluminum || 0,
      glass: data.glass || 0
    };
    setRecyclingData(currentData);

    // Calculate environmental impact
    const impact = EnvironmentalCalculator.calculateTotalImpact(currentData);
    setCurrentImpact(impact);

    // Process historical data
    const history = data.history || [];
    setHistoricalData(history);

    // Calculate streak
    const currentStreak = EnvironmentalCalculator.calculateStreak(history);
    setStreak(currentStreak);

    // Check milestones
    const milestoneData = EnvironmentalCalculator.checkMilestones(impact.totalItems);
    setMilestones(milestoneData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecyclingData();
    setRefreshing(false);
  };

  const generateReport = () => {
    if (currentImpact) {
      ReportGenerator.generatePDFReport({
        userId,
        recyclingData,
        impact: currentImpact,
        streak,
        milestones,
        historicalData
      });
    }
  };

  const shareImpact = () => {
    if (currentImpact) {
      ReportGenerator.shareImpact(currentImpact);
    }
  };

  const renderOverviewTab = () => (
    <View>
      {/* Environmental Impact Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Your Environmental Impact</Text>
        
        <StatCard
          icon="🌿"
          value={currentImpact?.totalCO2 || '0.0'}
          label="CO₂ Saved"
          subtitle="kg of carbon dioxide"
          color="#10B981"
        />

        <StatCard
          icon="💧"
          value={currentImpact?.totalWater || '0.0'}
          label="Water Saved"
          subtitle="liters of clean water"
          color="#3B82F6"
        />

        <StatCard
          icon="⚡"
          value={currentImpact?.totalEnergy || '0.0'}
          label="Energy Saved"
          subtitle="kilowatt hours"
          color="#F59E0B"
        />
      </View>

      {/* Current Streak */}
      <View style={styles.section}>
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakContent}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
            <Text style={styles.streakSubtext}>Keep recycling daily!</Text>
          </View>
        </View>
      </View>

      {/* Material Breakdown */}
      {currentImpact?.breakdown && (
        <View style={styles.section}>
          <ReadablePieChart
            title="Materials Recycled"
            data={currentImpact.breakdown.map(item => ({
              label: item.displayName,
              value: item.count,
              color: item.color,
              percentage: ((item.count / currentImpact.totalItems) * 100).toFixed(1)
            }))}
          />
        </View>
      )}

      {/* Next Milestone */}
      {milestones?.next && (
        <View style={styles.section}>
          <ProgressBar
            progress={currentImpact?.totalItems || 0}
            total={milestones.next.items}
            label={`Next: ${milestones.next.title} ${milestones.next.emoji}`}
            color="#8B5CF6"
          />
          <Text style={styles.milestoneReward}>
            🎁 Reward: {milestones.next.reward}
          </Text>
        </View>
      )}
    </View>
  );

  const renderTrendsTab = () => (
    <View>
      {/* Weekly Trend */}
      {historicalData.length > 0 && (
        <View style={styles.section}>
          <ReadableLineChart
            title="Recycling Trend (Last 30 Days)"
            data={historicalData.slice(-30).map(day => day.total || 0)}
            color="#10B981"
          />
        </View>
      )}

      {/* Material Trends */}
      <View style={styles.section}>
        <ReadableBarChart
          title="This Week by Material"
          data={[
            recyclingData.plastic || 0,
            recyclingData.aluminum || 0,
            recyclingData.glass || 0
          ]}
          color="#3B82F6"
        />
      </View>

      {/* Real-world Equivalents */}
      {currentImpact && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Real-World Impact</Text>
          {(() => {
            const equivalents = EnvironmentalCalculator.getRealWorldEquivalents(currentImpact);
            return (
              <View>
                <StatCard
                  icon="🌳"
                  value={equivalents.co2.trees}
                  label="Trees Planted Equivalent"
                  subtitle="Based on CO₂ saved"
                  color="#059669"
                />
                
                <StatCard
                  icon="🚿"
                  value={equivalents.water.showers}
                  label="5-Minute Showers"
                  subtitle="Based on water saved"
                  color="#0284C7"
                />
                
                <StatCard
                  icon="💡"
                  value={equivalents.energy.bulbs}
                  label="Hours of LED Light"
                  subtitle="Based on energy saved"
                  color="#EA580C"
                />
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );

  const renderComparisonTab = () => (
    <CampusComparison
      userId={userId}
      userRecyclingData={{
        totalItems: currentImpact?.totalItems || 0,
        impact: currentImpact
      }}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={shareImpact} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={generateReport} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trends' && styles.tabActive]}
          onPress={() => setSelectedTab('trends')}
        >
          <Text style={[styles.tabText, selectedTab === 'trends' && styles.tabTextActive]}>
            Trends
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'compare' && styles.tabActive]}
          onPress={() => setSelectedTab('compare')}
        >
          <Text style={[styles.tabText, selectedTab === 'compare' && styles.tabTextActive]}>
            Compare
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'trends' && renderTrendsTab()}
          {selectedTab === 'compare' && renderComparisonTab()}
        </Animated.View>
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
    alignItems: 'center',
    backgroundColor: '#F3F4F6'
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionButtonText: {
    fontSize: 18
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4
  },
  tabActive: {
    backgroundColor: '#3B82F6'
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  tabTextActive: {
    color: 'white'
  },
  content: {
    flex: 1
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
  streakCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  streakEmoji: {
    fontSize: 48,
    marginRight: 20
  },
  streakContent: {
    flex: 1
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#DC2626'
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4
  },
  streakSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2
  },
  milestoneReward: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center'
  }
});

export default AnalyticsScreen;
