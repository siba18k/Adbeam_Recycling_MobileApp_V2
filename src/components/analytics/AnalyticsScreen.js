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

// Placeholder for charts while dependencies are being installed
const PlaceholderChart = ({ title, data }) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={styles.chartPlaceholder}>
      <Text style={styles.placeholderText}>📊 Chart will appear here</Text>
      <Text style={styles.placeholderSubtext}>Install chart dependencies first</Text>
    </View>
  </View>
);

const AnalyticsScreen = ({ userId = 'user123' }) => {
  const [recyclingData, setRecyclingData] = useState({
    plastic: 15,
    aluminum: 8,
    glass: 12
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const fadeAnim = new Animated.Value(1);

  // Mock environmental impact calculation
  const currentImpact = {
    totalItems: recyclingData.plastic + recyclingData.aluminum + recyclingData.glass,
    totalCO2: ((recyclingData.plastic * 0.12) + (recyclingData.aluminum * 0.35) + (recyclingData.glass * 0.18)).toFixed(2),
    totalWater: ((recyclingData.plastic * 2.3) + (recyclingData.aluminum * 3.1) + (recyclingData.glass * 1.8)).toFixed(2),
    totalEnergy: ((recyclingData.plastic * 1.8) + (recyclingData.aluminum * 2.8) + (recyclingData.glass * 1.2)).toFixed(2)
  };

  const streak = 7; // Mock streak data

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const generateReport = () => {
    Alert.alert('Report Generator', 'Report generation will be available once all dependencies are installed.');
  };

  const shareImpact = () => {
    Alert.alert('Share Impact', 'Social sharing will be available once all dependencies are installed.');
  };

  const StatCard = ({ icon, value, label, subtitle, color = '#3B82F6' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const renderOverviewTab = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Your Environmental Impact</Text>
        
        <StatCard
          icon="🌿"
          value={currentImpact.totalCO2}
          label="CO₂ Saved"
          subtitle="kg of carbon dioxide"
          color="#10B981"
        />

        <StatCard
          icon="💧"
          value={currentImpact.totalWater}
          label="Water Saved"
          subtitle="liters of clean water"
          color="#3B82F6"
        />

        <StatCard
          icon="⚡"
          value={currentImpact.totalEnergy}
          label="Energy Saved"
          subtitle="kilowatt hours"
          color="#F59E0B"
        />
      </View>

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

      <View style={styles.section}>
        <PlaceholderChart title="Materials Recycled" data={recyclingData} />
      </View>
    </View>
  );

  const renderTrendsTab = () => (
    <View>
      <View style={styles.section}>
        <PlaceholderChart title="Recycling Trend (Last 30 Days)" data={[]} />
      </View>
      <View style={styles.section}>
        <PlaceholderChart title="This Week by Material" data={recyclingData} />
      </View>
    </View>
  );

  const renderComparisonTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏆 Campus Comparison</Text>
      <View style={styles.comparisonCard}>
        <Text style={styles.comparisonText}>Loading campus data...</Text>
        <Text style={styles.comparisonSubtext}>Compare with other users once Firebase is connected</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trends' && styles.tabActive]}
          onPress={() => setSelectedTab('trends')}
        >
          <Text style={[styles.tabText, selectedTab === 'trends' && styles.tabTextActive]}>Trends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'compare' && styles.tabActive]}
          onPress={() => setSelectedTab('compare')}
        >
          <Text style={[styles.tabText, selectedTab === 'compare' && styles.tabTextActive]}>Compare</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  actionButtonText: { fontSize: 18 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 20, paddingBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginHorizontal: 4 },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: 'white' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  statCard: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 16, marginVertical: 8,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  statIcon: { fontSize: 32, marginRight: 16 },
  statContent: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  streakCard: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  streakEmoji: { fontSize: 48, marginRight: 20 },
  streakContent: { flex: 1 },
  streakNumber: { fontSize: 36, fontWeight: 'bold', color: '#DC2626' },
  streakLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 4 },
  streakSubtext: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  chartContainer: {
    backgroundColor: 'white', borderRadius: 12, padding: 16, marginVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  chartTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  chartPlaceholder: {
    height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 8, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed'
  },
  placeholderText: { fontSize: 16, color: '#6B7280', marginBottom: 8 },
  placeholderSubtext: { fontSize: 12, color: '#9CA3AF' },
  comparisonCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  comparisonText: { fontSize: 16, color: '#374151', marginBottom: 8 },
  comparisonSubtext: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' }
});

export default AnalyticsScreen;