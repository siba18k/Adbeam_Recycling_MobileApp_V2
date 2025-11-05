// ReadableCharts.js
// Traditional, Easy-to-Read Chart Components with Placeholders

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

/**
 * Placeholder Bar Chart Component
 */
export const ReadableBarChart = ({ data, title, color = '#3B82F6', showValues = true }) => {
  const maxValue = Math.max(...data, 1);
  
  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.barContainer}>
        {data.map((value, index) => {
          const height = (value / maxValue) * 150;
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={[styles.bar, { height, backgroundColor: color }]} />
              {showValues && <Text style={styles.barValue}>{value}</Text>}
              <Text style={styles.barLabel}>Item {index + 1}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

/**
 * Placeholder Line Chart Component
 */
export const ReadableLineChart = ({ data, title, color = '#10B981' }) => {
  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.lineContainer}>
        <Text style={styles.placeholderText}>📈 Line Chart</Text>
        <Text style={styles.placeholderSubtext}>Data points: {data.length}</Text>
        <View style={styles.mockLine} />
      </View>
    </View>
  );
};

/**
 * Placeholder Pie Chart Component
 */
export const ReadablePieChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.pieContainer}>
        <View style={styles.mockPie}>
          <Text style={styles.pieText}>🥧</Text>
        </View>
        <View style={styles.pieLegend}>
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {item.label}: {item.value} ({percentage}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({ progress, total, label, color = '#3B82F6' }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{progress} / {total}</Text>
      </View>
      <View style={styles.progressBarBackground}>
        <View 
          style={[styles.progressBarFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} 
        />
      </View>
      <Text style={styles.progressPercentage}>{percentage.toFixed(0)}%</Text>
    </View>
  );
};

/**
 * Stat Card Component
 */
export const StatCard = ({ icon, value, label, subtitle, color = '#3B82F6' }) => {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

/**
 * Comparison Bar Component
 */
export const ComparisonBar = ({ userValue, campusAverage, label }) => {
  const maxValue = Math.max(userValue, campusAverage, 1);
  const userPercentage = (userValue / maxValue) * 100;
  const campusPercentage = (campusAverage / maxValue) * 100;

  return (
    <View style={styles.comparisonContainer}>
      <Text style={styles.comparisonLabel}>{label}</Text>
      
      <View style={styles.comparisonRow}>
        <Text style={styles.comparisonRowLabel}>You</Text>
        <View style={styles.comparisonBarBackground}>
          <View style={[styles.comparisonBarFill, { width: `${userPercentage}%`, backgroundColor: '#3B82F6' }]} />
        </View>
        <Text style={styles.comparisonValue}>{userValue}</Text>
      </View>

      <View style={styles.comparisonRow}>
        <Text style={styles.comparisonRowLabel}>Campus</Text>
        <View style={styles.comparisonBarBackground}>
          <View style={[styles.comparisonBarFill, { width: `${campusPercentage}%`, backgroundColor: '#9CA3AF' }]} />
        </View>
        <Text style={styles.comparisonValue}>{campusAverage}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: 'white', borderRadius: 12, padding: 16, marginVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  chartTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  
  // Bar Chart Styles
  barContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { width: 30, minHeight: 5, borderRadius: 4 },
  barValue: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 8 },
  barLabel: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  
  // Line Chart Styles
  lineContainer: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8 },
  mockLine: { width: '80%', height: 2, backgroundColor: '#10B981', marginTop: 10 },
  
  // Pie Chart Styles
  pieContainer: { alignItems: 'center' },
  mockPie: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  pieText: { fontSize: 40 },
  pieLegend: { width: '100%' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 8 },
  legendText: { fontSize: 14, color: '#4B5563' },
  
  // Progress Bar Styles
  progressContainer: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginVertical: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  progressValue: { fontSize: 14, color: '#6B7280' },
  progressBarBackground: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressPercentage: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'right' },
  
  // Stat Card Styles
  statCard: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 16, marginVertical: 8,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  statIcon: { fontSize: 32, marginRight: 16 },
  statContent: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  
  // Comparison Styles
  comparisonContainer: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginVertical: 8 },
  comparisonLabel: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  comparisonRowLabel: { width: 60, fontSize: 14, color: '#4B5563' },
  comparisonBarBackground: {
    flex: 1, height: 24, backgroundColor: '#E5E7EB', borderRadius: 4, marginHorizontal: 8, overflow: 'hidden'
  },
  comparisonBarFill: { height: '100%', borderRadius: 4 },
  comparisonValue: { width: 50, fontSize: 14, fontWeight: '600', color: '#1F2937', textAlign: 'right' },
  
  // Placeholder styles
  placeholderText: { fontSize: 16, color: '#6B7280', marginBottom: 4 },
  placeholderSubtext: { fontSize: 12, color: '#9CA3AF' }
});

export default { ReadableBarChart, ReadableLineChart, ReadablePieChart, ProgressBar, StatCard, ComparisonBar };