// ReadableCharts.js
// Traditional, Easy-to-Read Chart Components

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-svg-charts';
import { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import * as shape from 'd3-shape';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

/**
 * Bar Chart Component for comparing values
 */
export const ReadableBarChart = ({ data, title, color = '#3B82F6', showValues = true }) => {
  const Labels = ({ x, y, bandwidth, data }) => (
    data.map((value, index) => (
      <SvgText
        key={index}
        x={x(index) + (bandwidth / 2)}
        y={y(value) - 10}
        fontSize={12}
        fill="#1F2937"
        alignmentBaseline="middle"
        textAnchor="middle"
      >
        {value}
      </SvgText>
    ))
  );

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <BarChart
        style={{ height: 200, width: CHART_WIDTH }}
        data={data}
        svg={{ fill: color }}
        contentInset={{ top: 30, bottom: 10 }}
        spacing={0.2}
        gridMin={0}
      >
        {showValues && <Labels />}
      </BarChart>
    </View>
  );
};

/**
 * Line Chart Component for trends over time
 */
export const ReadableLineChart = ({ data, title, color = '#10B981', showDots = true }) => {
  const Decorator = ({ x, y, data }) => {
    return data.map((value, index) => (
      <Circle
        key={index}
        cx={x(index)}
        cy={y(value)}
        r={4}
        stroke={color}
        strokeWidth={2}
        fill="white"
      />
    ));
  };

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <LineChart
        style={{ height: 200, width: CHART_WIDTH }}
        data={data}
        svg={{ stroke: color, strokeWidth: 3 }}
        contentInset={{ top: 20, bottom: 20, left: 10, right: 10 }}
        curve={shape.curveNatural}
      >
        {showDots && <Decorator />}
      </LineChart>
    </View>
  );
};

/**
 * Pie Chart Component for material distribution
 */
export const ReadablePieChart = ({ data, title }) => {
  const pieData = data.map((item, index) => ({
    value: item.value,
    svg: {
      fill: item.color,
      onPress: () => console.log(`Selected ${item.label}`)
    },
    key: `pie-${index}`,
    arc: { outerRadius: '100%', cornerRadius: 3 }
  }));

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.pieContainer}>
        <PieChart
          style={{ height: 200, width: 200 }}
          data={pieData}
          innerRadius="50%"
          outerRadius="100%"
          labelRadius="110%"
        />
        <View style={styles.pieLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>
                {item.label}: {item.value} ({item.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({ progress, total, label, color = '#3B82F6' }) => {
  const percentage = (progress / total) * 100;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{progress} / {total}</Text>
      </View>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }
          ]} 
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
  const maxValue = Math.max(userValue, campusAverage);
  const userPercentage = (userValue / maxValue) * 100;
  const campusPercentage = (campusAverage / maxValue) * 100;

  return (
    <View style={styles.comparisonContainer}>
      <Text style={styles.comparisonLabel}>{label}</Text>
      
      <View style={styles.comparisonRow}>
        <Text style={styles.comparisonRowLabel}>You</Text>
        <View style={styles.comparisonBarBackground}>
          <View 
            style={[styles.comparisonBarFill, { 
              width: `${userPercentage}%`, 
              backgroundColor: '#3B82F6' 
            }]} 
          />
        </View>
        <Text style={styles.comparisonValue}>{userValue}</Text>
      </View>

      <View style={styles.comparisonRow}>
        <Text style={styles.comparisonRowLabel}>Campus</Text>
        <View style={styles.comparisonBarBackground}>
          <View 
            style={[styles.comparisonBarFill, { 
              width: `${campusPercentage}%`, 
              backgroundColor: '#9CA3AF' 
            }]} 
          />
        </View>
        <Text style={styles.comparisonValue}>{campusAverage}</Text>
      </View>
    </View>
  );
};

/**
 * Trend Indicator Component
 */
export const TrendIndicator = ({ value, previousValue, label }) => {
  const change = value - previousValue;
  const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change > 0;

  return (
    <View style={styles.trendContainer}>
      <Text style={styles.trendLabel}>{label}</Text>
      <View style={styles.trendContent}>
        <Text style={styles.trendValue}>{value}</Text>
        <View style={[
          styles.trendBadge, 
          { backgroundColor: isPositive ? '#DEF7EC' : '#FDE8E8' }
        ]}>
          <Text style={[
            styles.trendChange,
            { color: isPositive ? '#03543F' : '#9B1C1C' }
          ]}>
            {isPositive ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16
  },
  pieContainer: {
    alignItems: 'center'
  },
  pieLegend: {
    marginTop: 16,
    width: '100%'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8
  },
  legendText: {
    fontSize: 14,
    color: '#4B5563'
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  progressValue: {
    fontSize: 14,
    color: '#6B7280'
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right'
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statIcon: {
    fontSize: 32,
    marginRight: 16
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  comparisonContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8
  },
  comparisonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6
  },
  comparisonRowLabel: {
    width: 60,
    fontSize: 14,
    color: '#4B5563'
  },
  comparisonBarBackground: {
    flex: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden'
  },
  comparisonBarFill: {
    height: '100%',
    borderRadius: 4
  },
  comparisonValue: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right'
  },
  trendContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8
  },
  trendLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8
  },
  trendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  trendValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  trendChange: {
    fontSize: 14,
    fontWeight: '600'
  }
});

export default {
  ReadableBarChart,
  ReadableLineChart,
  ReadablePieChart,
  ProgressBar,
  StatCard,
  ComparisonBar,
  TrendIndicator
};
