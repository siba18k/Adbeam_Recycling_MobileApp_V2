// Victory Native XL - FIXED RENDER FUNCTIONS (SENIOR DEVELOPER VERSION)
import React from 'react';
import { View, Dimensions, Text } from 'react-native';
import { CartesianChart, Bar, PolarChart, Pie, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// 🚨 FIXED: Professional Weekly Bar Chart with CORRECT render syntax
export function WeeklyBarChart({ labels = [], scans = [], goals = [], color = "#059669" }) {
    if (!Array.isArray(labels) || !Array.isArray(scans) || labels.length === 0 || scans.length === 0) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, fontWeight: '600' }}>Loading weekly data...</Text>
            </View>
        );
    }

    const chartData = labels.map((label, index) => ({
        day: String(label || `Day ${index + 1}`),
        scans: Math.max(0, scans[index] || 0),
        goals: Math.max(1, goals[index] || 20),
        x: index,
    }));

    const { state, isActive } = useChartPressState({
        x: 0,
        y: { scans: 0, goals: 0 }
    });

    return (
        <View style={{ alignItems: 'center', paddingVertical: 10, height: 280 }}>
            <CartesianChart
                data={chartData}
                xKey="x"
                yKeys={["scans", "goals"]}
                chartPressState={state}
                style={{ height: 240, width: width - 80 }}
                axisOptions={{
                    tickCount: { x: 7, y: 5 },
                    formatXLabel: (index) => chartData[Math.floor(index)]?.day?.substring(0, 3) || '',
                }}
            >
                {/* 🚨 FIXED: Proper render function with explicit returns */}
                {({ points, chartBounds }) => {
                    return (
                        <>
                            {/* Goal bars (background) - FIXED syntax */}
                            <Bar
                                points={points.goals}
                                chartBounds={chartBounds}
                                color="#e5e7eb"
                                strokeWidth={1}
                                roundedCorners={{ topLeft: 4, topRight: 4 }}
                            />

                            {/* Scan bars (foreground) - FIXED syntax */}
                            <Bar
                                points={points.scans}
                                chartBounds={chartBounds}
                                color={color}
                                strokeWidth={2}
                                roundedCorners={{ topLeft: 4, topRight: 4 }}
                            />

                            {/* Interactive tooltip - FIXED conditional rendering */}
                            {isActive && state.x && state.y && state.y.scans ? (
                                <Circle
                                    cx={state.x.position}
                                    cy={state.y.scans.position}
                                    r={8}
                                    color="rgba(5, 150, 105, 0.8)"
                                    style="stroke"
                                    strokeWidth={3}
                                />
                            ) : null}
                        </>
                    );
                }}
            </CartesianChart>

            {/* Interactive value display */}
            {isActive && state.y && state.y.scans && chartData[Math.floor(state.x.value || 0)] ? (
                <View style={{
                    position: 'absolute',
                    top: 20,
                    backgroundColor: 'rgba(5, 150, 105, 0.9)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                        {chartData[Math.floor(state.x.value)]?.day}: {Math.round(state.y.scans.value)} items
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

// 🚨 FIXED: Material Pie Chart with CORRECT render function
export function MaterialPie({ data = [] }) {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="pie-chart-outline" size={48} color="#d1d5db" />
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, fontWeight: '600' }}>No materials scanned yet</Text>
            </View>
        );
    }

    const validData = data
        .filter(item => item && typeof item.count === 'number' && item.count > 0)
        .map((item, index) => ({
            value: Math.max(1, item.count),
            color: item.color || '#6b7280',
            label: item.name || `Material ${index + 1}`,
            x: index,
        }));

    if (validData.length === 0) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="leaf-outline" size={48} color="#d1d5db" />
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, fontWeight: '600' }}>Start recycling!</Text>
            </View>
        );
    }

    return (
        <View style={{ alignItems: 'center', paddingVertical: 10, height: 280 }}>
            <PolarChart
                data={validData}
                colorKey="color"
                valueKey="value"
                labelKey="label"
            >
                {/* 🚨 FIXED: Explicit render function with proper return */}
                {({ slice }) => {
                    if (!slice) return null;

                    return (
                        <Pie
                            slice={slice}
                            innerRadius={60}
                            outerRadius={90}
                        />
                    );
                }}
            </PolarChart>

            {/* Custom Legend */}
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 12,
                marginTop: 16,
                paddingHorizontal: 20
            }}>
                {validData.map((material, index) => (
                    <View key={`legend-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: material.color
                        }} />
                        <Text style={{
                            fontSize: 12,
                            color: '#4b5563',
                            fontWeight: '600'
                        }}>
                            {material.label}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

// 🚨 COMPLETELY SAFE: Custom Progress Ring (NO Victory dependency)
export function ProgressRing({ progress = 0, size = 60, color = "#f59e0b" }) {
    let validProgress = 0;

    try {
        if (typeof progress === 'number' && !isNaN(progress)) {
            validProgress = Math.max(0, Math.min(1, progress));
        } else if (typeof progress === 'string') {
            const parsed = parseFloat(progress);
            if (!isNaN(parsed)) {
                validProgress = Math.max(0, Math.min(1, parsed));
            }
        }
    } catch (error) {
        validProgress = 0;
    }

    const percentage = Math.round(validProgress * 100);
    const circumference = 2 * Math.PI * ((size - 8) / 2);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - validProgress);

    return (
        <View style={{
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
        }}>
            {/* Background circle */}
            <View style={{
                width: size - 4,
                height: size - 4,
                borderRadius: (size - 4) / 2,
                borderWidth: 3,
                borderColor: '#f3f4f6',
                position: 'absolute',
            }} />

            {/* Progress overlay using LinearGradient for visual appeal */}
            <View style={{
                width: size - 4,
                height: size - 4,
                borderRadius: (size - 4) / 2,
                overflow: 'hidden',
                position: 'absolute',
            }}>
                <LinearGradient
                    colors={validProgress > 0 ? [color, color + '80'] : ['#e5e7eb', '#e5e7eb']}
                    style={{
                        width: '100%',
                        height: `${percentage}%`,
                        position: 'absolute',
                        bottom: 0,
                    }}
                />
            </View>

            {/* Inner content */}
            <View style={{
                width: size - 12,
                height: size - 12,
                borderRadius: (size - 12) / 2,
                backgroundColor: 'white',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
            }}>
                <Text style={{
                    fontSize: Math.max(8, size / 6),
                    fontWeight: 'bold',
                    color: '#374151'
                }}>
                    {percentage}%
                </Text>
            </View>
        </View>
    );
}

// Safe fallback for any chart
export function SafeChart({ type = 'placeholder', title = 'Chart', subtitle = 'Loading...' }) {
    const iconMap = {
        bar: 'bar-chart',
        pie: 'pie-chart',
        line: 'trending-up',
        placeholder: 'analytics',
    };

    return (
        <View style={{
            alignItems: 'center',
            paddingVertical: 50,
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            margin: 8,
            borderWidth: 2,
            borderColor: '#e5e7eb',
            borderStyle: 'dashed',
        }}>
            <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={{
                    padding: 12,
                    borderRadius: 20,
                    marginBottom: 12,
                }}
            >
                <Ionicons name={iconMap[type]} size={32} color="white" />
            </LinearGradient>
            <Text style={{ color: '#374151', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{title}</Text>
            <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center' }}>{subtitle}</Text>
        </View>
    );
}
