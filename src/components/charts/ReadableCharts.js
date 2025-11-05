// Traditional Easy-to-Read Charts with Interactive Elements
import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, Text, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
    Circle,
    Path,
    G,
    Text as SvgText,
    Line as SvgLine,
    Rect,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop
} from 'react-native-svg';

const { width } = Dimensions.get('window');

// 📊 TRADITIONAL: Weekly Bar Chart (Like Excel/Google Sheets)
export function WeeklyBarChart({ labels = [], scans = [], goals = [], color = "#059669" }) {
    const [selectedBar, setSelectedBar] = useState(null);
    const animationRefs = useRef(labels.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Smooth entrance animation
        Animated.stagger(80,
            animationRefs.map((anim, index) =>
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: false,
                })
            )
        ).start();
    }, [scans]);

    if (!labels.length || !scans.length) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, fontWeight: '600' }}>Loading weekly data...</Text>
            </View>
        );
    }

    const maxValue = Math.max(...scans, ...goals, 25);
    const chartWidth = width - 80;
    const chartHeight = 200;
    const barWidth = (chartWidth - 60) / labels.length;

    return (
        <View style={{ alignItems: 'center', paddingVertical: 15 }}>
            {/* Chart Title */}
            <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#374151',
                marginBottom: 8,
                textAlign: 'center',
            }}>
                Daily Recycling Activity
            </Text>

            {/* Y-Axis Labels */}
            <View style={{
                flexDirection: 'row',
                width: chartWidth,
                marginBottom: 8,
            }}>
                <View style={{ width: 40, alignItems: 'flex-end', justifyContent: 'space-between', height: chartHeight - 40 }}>
                    {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map((value, index) => (
                        <Text key={index} style={{
                            fontSize: 10,
                            color: '#6b7280',
                            fontWeight: '500',
                            paddingRight: 8,
                        }}>
                            {value}
                        </Text>
                    ))}
                </View>

                {/* Chart Area */}
                <View style={{
                    flex: 1,
                    borderLeftWidth: 2,
                    borderBottomWidth: 2,
                    borderColor: '#e5e7eb',
                    paddingLeft: 10,
                    paddingBottom: 10,
                }}>
                    {/* Horizontal Grid Lines */}
                    {[0.75, 0.5, 0.25].map((fraction, index) => (
                        <View key={index} style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: (chartHeight - 50) * fraction,
                            height: 1,
                            backgroundColor: '#f3f4f6',
                        }} />
                    ))}

                    {/* Bars Container */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        height: chartHeight - 50,
                        justifyContent: 'space-around',
                    }}>
                        {labels.map((label, index) => {
                            const scanValue = scans[index] || 0;
                            const goalValue = goals[index] || 20;
                            const scanHeight = Math.max(4, (scanValue / maxValue) * (chartHeight - 50));
                            const goalHeight = Math.max(2, (goalValue / maxValue) * (chartHeight - 50));
                            const isSelected = selectedBar === index;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        alignItems: 'center',
                                        width: barWidth,
                                        height: chartHeight - 50,
                                        justifyContent: 'flex-end',
                                    }}
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedBar(isSelected ? null : index)}
                                >
                                    {/* Goal indicator (thin line at top) */}
                                    <View style={{
                                        position: 'absolute',
                                        top: (chartHeight - 50) - goalHeight,
                                        width: barWidth * 0.8,
                                        height: 2,
                                        backgroundColor: '#f59e0b',
                                        borderRadius: 1,
                                        zIndex: 2,
                                    }} />

                                    {/* Main Bar */}
                                    <Animated.View style={{
                                        width: barWidth * 0.6,
                                        height: animationRefs[index].interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [4, scanHeight],
                                        }),
                                        borderRadius: 6,
                                        overflow: 'hidden',
                                        shadowColor: color,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: isSelected ? 0.4 : 0.2,
                                        shadowRadius: isSelected ? 6 : 3,
                                        elevation: isSelected ? 6 : 3,
                                        transform: [{ scale: isSelected ? 1.1 : 1 }],
                                    }}>
                                        <LinearGradient
                                            colors={scanValue > goalValue ? ['#10b981', '#059669'] : [color, color + 'dd']}
                                            style={{ flex: 1 }}
                                        />

                                        {/* Value label on bar */}
                                        {scanValue > 0 && (
                                            <View style={{
                                                position: 'absolute',
                                                top: 4,
                                                left: 0,
                                                right: 0,
                                                alignItems: 'center',
                                            }}>
                                                <Text style={{
                                                    color: 'white',
                                                    fontSize: 11,
                                                    fontWeight: '700',
                                                    textShadowColor: 'rgba(0,0,0,0.3)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 2,
                                                }}>
                                                    {scanValue}
                                                </Text>
                                            </View>
                                        )}
                                    </Animated.View>

                                    {/* Tooltip */}
                                    {isSelected && (
                                        <Animated.View style={{
                                            position: 'absolute',
                                            top: -60,
                                            backgroundColor: '#1f2937',
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 8,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 6,
                                            elevation: 8,
                                            minWidth: 100,
                                            alignItems: 'center',
                                        }}>
                                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                                                {label}
                                            </Text>
                                            <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '600' }}>
                                                {scanValue} items scanned
                                            </Text>
                                            <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '500' }}>
                                                Goal: {goalValue}
                                            </Text>

                                            {/* Tooltip arrow */}
                                            <View style={{
                                                position: 'absolute',
                                                bottom: -6,
                                                width: 12,
                                                height: 12,
                                                backgroundColor: '#1f2937',
                                                transform: [{ rotate: '45deg' }],
                                            }} />
                                        </Animated.View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* X-Axis Labels */}
            <View style={{
                flexDirection: 'row',
                width: chartWidth - 40,
                justifyContent: 'space-around',
                marginTop: 12,
                paddingLeft: 40,
            }}>
                {labels.map((label, index) => (
                    <Text key={index} style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: selectedBar === index ? color : '#6b7280',
                        textAlign: 'center',
                        minWidth: barWidth,
                    }}>
                        {String(label)}
                    </Text>
                ))}
            </View>

            {/* Chart Summary */}
            <View style={{
                marginTop: 16,
                backgroundColor: '#f8fafc',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                width: chartWidth,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 8, height: 8, backgroundColor: color, borderRadius: 2 }} />
                            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>Weekly Total</Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: color }}>
                            {scans.reduce((a, b) => a + b, 0)} items
                        </Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 8, height: 2, backgroundColor: '#f59e0b', borderRadius: 1 }} />
                            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>Daily Goal</Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#f59e0b' }}>
                            {goals[0] || 20} items
                        </Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>Achievement</Text>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '800',
                            color: scans.filter(s => s >= (goals[0] || 20)).length >= 3 ? '#10b981' : '#ef4444'
                        }}>
                            {scans.filter(s => s >= (goals[0] || 20)).length}/7 days
                        </Text>
                    </View>
                </View>
            </View>

            {/* Instructions */}
            <Text style={{
                fontSize: 11,
                color: '#9ca3af',
                textAlign: 'center',
                marginTop: 8,
                fontStyle: 'italic'
            }}>
                💡 Tap bars to view daily details
            </Text>
        </View>
    );
}

// 📊 TRADITIONAL: Pie Chart with Data Table
export function MaterialPie({ data = [] }) {
    const [selectedSlice, setSelectedSlice] = useState(null);
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 80,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ]).start();
    }, [data]);

    if (!Array.isArray(data) || data.length === 0) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="pie-chart-outline" size={48} color="#d1d5db" />
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, fontWeight: '600' }}>No materials scanned yet</Text>
                <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Start scanning to see breakdown</Text>
            </View>
        );
    }

    const validData = data.filter(item => item && item.count > 0);

    if (validData.length === 0) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="leaf-outline" size={48} color="#d1d5db" />
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, fontWeight: '600' }}>Start recycling!</Text>
            </View>
        );
    }

    const total = validData.reduce((sum, item) => sum + item.count, 0);
    const chartSize = 180;
    const radius = 70;
    const centerX = chartSize / 2;
    const centerY = chartSize / 2;

    let currentAngle = -90; // Start from top
    const slices = validData.map((item, index) => {
        const percentage = item.count / total;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;

        const largeArcFlag = angle > 180 ? 1 : 0;

        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);

        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');

        const result = {
            ...item,
            pathData,
            percentage: Math.round(percentage * 100),
            startAngle,
            endAngle,
            index,
        };

        currentAngle += angle;
        return result;
    });

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '5deg'], // Subtle rotation
    });

    return (
        <View style={{ alignItems: 'center', paddingVertical: 15 }}>
            {/* Chart Title */}
            <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#374151',
                marginBottom: 16,
                textAlign: 'center',
            }}>
                Material Distribution
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 20 }}>
                {/* Pie Chart */}
                <Animated.View style={{
                    transform: [{ scale: scaleAnim }, { rotate: spin }]
                }}>
                    <Svg width={chartSize} height={chartSize}>
                        <Defs>
                            {slices.map((slice, index) => (
                                <SvgLinearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor={slice.color} />
                                    <Stop offset="100%" stopColor={slice.color + 'dd'} />
                                </SvgLinearGradient>
                            ))}
                        </Defs>

                        {/* Outer circle border */}
                        <Circle
                            cx={centerX}
                            cy={centerY}
                            r={radius + 2}
                            fill="transparent"
                            stroke="#e5e7eb"
                            strokeWidth={2}
                        />

                        {slices.map((slice, index) => (
                            <G key={index}>
                                <Path
                                    d={slice.pathData}
                                    fill={`url(#gradient-${index})`}
                                    stroke="white"
                                    strokeWidth={selectedSlice === index ? 3 : 2}
                                    onPress={() => setSelectedSlice(selectedSlice === index ? null : index)}
                                />

                                {/* Percentage labels on slices */}
                                {slice.percentage >= 5 && (
                                    <SvgText
                                        x={centerX + (radius * 0.7) * Math.cos(((slice.startAngle + slice.endAngle) / 2) * Math.PI / 180)}
                                        y={centerY + (radius * 0.7) * Math.sin(((slice.startAngle + slice.endAngle) / 2) * Math.PI / 180)}
                                        textAnchor="middle"
                                        dy={4}
                                        fontSize={11}
                                        fontWeight="bold"
                                        fill="white"
                                    >
                                        {slice.percentage}%
                                    </SvgText>
                                )}
                            </G>
                        ))}

                        {/* Center total */}
                        <Circle cx={centerX} cy={centerY} r={25} fill="white" stroke="#e5e7eb" strokeWidth={2} />
                        <SvgText
                            x={centerX}
                            y={centerY - 4}
                            textAnchor="middle"
                            fontSize={14}
                            fontWeight="bold"
                            fill="#374151"
                        >
                            {total}
                        </SvgText>
                        <SvgText
                            x={centerX}
                            y={centerY + 12}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#6b7280"
                        >
                            items
                        </SvgText>
                    </Svg>
                </Animated.View>

                {/* Data Table */}
                <View style={{ flex: 1, minWidth: 140 }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#374151',
                        marginBottom: 12,
                        textAlign: 'center'
                    }}>
                        Material Summary
                    </Text>

                    {validData
                        .sort((a, b) => b.count - a.count) // Sort by count descending
                        .map((material, index) => (
                            <TouchableOpacity
                                key={index}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    marginBottom: 4,
                                    backgroundColor: selectedSlice === material.index ? (material.color + '20') : 'transparent',
                                    borderRadius: 8,
                                    borderLeftWidth: 4,
                                    borderLeftColor: material.color,
                                }}
                                onPress={() => setSelectedSlice(selectedSlice === material.index ? null : material.index)}
                                activeOpacity={0.7}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: '#1f2937',
                                        marginBottom: 2,
                                    }}>
                                        {material.name}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>
                                            {material.count} items
                                        </Text>
                                        <Text style={{ fontSize: 11, color: material.color, fontWeight: '600' }}>
                                            {material.percentage}%
                                        </Text>
                                    </View>
                                </View>

                                <View style={{
                                    backgroundColor: material.color,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                }}>
                                    <Text style={{
                                        color: 'white',
                                        fontSize: 11,
                                        fontWeight: '700'
                                    }}>
                                        #{index + 1}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                    {/* Summary Stats */}
                    <View style={{
                        marginTop: 12,
                        padding: 12,
                        backgroundColor: '#f1f5f9',
                        borderRadius: 8,
                    }}>
                        <Text style={{ fontSize: 11, color: '#374151', fontWeight: '600', textAlign: 'center' }}>
                            Total Impact: {(total * 0.12).toFixed(1)}kg CO₂ saved
                        </Text>
                    </View>
                </View>
            </View>

            {/* Instructions */}
            <Text style={{
                fontSize: 11,
                color: '#9ca3af',
                textAlign: 'center',
                marginTop: 12,
                fontStyle: 'italic'
            }}>
                💡 Tap slices or table rows to highlight materials
            </Text>
        </View>
    );
}

// 📊 TRADITIONAL: Progress Ring with Clear Indicators
export function ProgressRing({
                                 progress = 0,
                                 size = 60,
                                 strokeWidth = 6,
                                 color = "#f59e0b",
                                 showPercentage = true,
                                 label = ""
                             }) {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const validProgress = Math.max(0, Math.min(1, progress || 0));

        Animated.timing(progressAnim, {
            toValue: validProgress,
            duration: 1200,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const validProgress = Math.max(0, Math.min(1, progress || 0));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
                width: size,
                height: size,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
            }}>
                {/* Background circle */}
                <Svg width={size} height={size} style={{ position: 'absolute' }}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#f1f5f9"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />

                    {/* Progress circle */}
                    <Animated.View>
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [circumference, 0],
                            })}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        />
                    </Animated.View>
                </Svg>

                {/* Center content */}
                <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    width: size - strokeWidth * 2 - 6,
                    height: size - strokeWidth * 2 - 6,
                    borderRadius: (size - strokeWidth * 2 - 6) / 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                }}>
                    {showPercentage && (
                        <Text style={{
                            fontSize: Math.max(10, size / 7),
                            fontWeight: '800',
                            color: '#374151'
                        }}>
                            {Math.round(validProgress * 100)}%
                        </Text>
                    )}
                    {label && (
                        <Text style={{
                            fontSize: Math.max(6, size / 12),
                            fontWeight: '500',
                            color: '#6b7280',
                            textAlign: 'center',
                        }}>
                            {label}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

// 📊 SIMPLE: Data Summary Cards
export function DataSummaryCard({
                                    title,
                                    value,
                                    unit,
                                    change,
                                    changeLabel,
                                    icon,
                                    color = "#059669",
                                    details = []
                                }) {
    const [showDetails, setShowDetails] = useState(false);
    const expandAnim = useRef(new Animated.Value(0)).current;

    const toggleDetails = () => {
        setShowDetails(!showDetails);
        Animated.timing(expandAnim, {
            toValue: showDetails ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    return (
        <TouchableOpacity
            onPress={toggleDetails}
            activeOpacity={0.95}
            style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                shadowColor: color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                borderLeftWidth: 4,
                borderLeftColor: color,
                marginBottom: 12,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Ionicons name={icon} size={18} color={color} />
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                            {title}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: '#1f2937' }}>
                            {value}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>
                            {unit}
                        </Text>
                    </View>

                    {change && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Ionicons
                                name={change > 0 ? "trending-up" : "trending-down"}
                                size={12}
                                color={change > 0 ? "#10b981" : "#ef4444"}
                            />
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: change > 0 ? "#10b981" : "#ef4444"
                            }}>
                                {Math.abs(change)}% {changeLabel}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ alignItems: 'center' }}>
                    <View style={{
                        backgroundColor: color + '15',
                        padding: 12,
                        borderRadius: 16,
                        marginBottom: 8,
                    }}>
                        <Ionicons name={icon} size={24} color={color} />
                    </View>

                    <Ionicons
                        name={showDetails ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#9ca3af"
                    />
                </View>
            </View>

            {/* Expandable Details */}
            {details.length > 0 && (
                <Animated.View style={{
                    height: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, details.length * 30 + 20],
                    }),
                    opacity: expandAnim,
                    overflow: 'hidden',
                    marginTop: 12,
                }}>
                    <View style={{
                        borderTopWidth: 1,
                        borderTopColor: '#f3f4f6',
                        paddingTop: 12,
                    }}>
                        {details.map((detail, index) => (
                            <View key={index} style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: 4,
                            }}>
                                <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500' }}>
                                    {detail.label}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>
                                    {detail.value}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>
            )}
        </TouchableOpacity>
    );
}

// 📊 PROFESSIONAL: Weekly Trend Comparison
export function WeeklyTrendComparison({ currentWeek = [], previousWeek = [] }) {
    const [showComparison, setShowComparison] = useState(true);

    if (!currentWeek.length) return null;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxValue = Math.max(...currentWeek, ...(previousWeek.length ? previousWeek : [0]));

    return (
        <View style={{ paddingVertical: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151' }}>
                    Week-over-Week Comparison
                </Text>
                <TouchableOpacity
                    onPress={() => setShowComparison(!showComparison)}
                    style={{
                        backgroundColor: '#f3f4f6',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                    }}
                >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#6b7280' }}>
                        {showComparison ? 'Hide' : 'Show'} Previous
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
            }}>
                {/* Header Row */}
                <View style={{
                    flexDirection: 'row',
                    borderBottomWidth: 2,
                    borderBottomColor: '#e5e7eb',
                    paddingBottom: 8,
                    marginBottom: 12,
                }}>
                    <Text style={{ width: 60, fontSize: 12, fontWeight: '700', color: '#374151' }}>Day</Text>
                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#059669', textAlign: 'center' }}>
                        This Week
                    </Text>
                    {showComparison && previousWeek.length > 0 && (
                        <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#6b7280', textAlign: 'center' }}>
                            Last Week
                        </Text>
                    )}
                    <Text style={{ width: 50, fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'right' }}>
                        Change
                    </Text>
                </View>

                {/* Data Rows */}
                {days.map((day, index) => {
                    const current = currentWeek[index] || 0;
                    const previous = previousWeek[index] || 0;
                    const change = previous > 0 ? ((current - previous) / previous * 100) : 0;

                    return (
                        <View key={day} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f8fafc',
                        }}>
                            <Text style={{ width: 60, fontSize: 12, fontWeight: '600', color: '#374151' }}>
                                {day}
                            </Text>

                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#059669' }}>
                                    {current}
                                </Text>
                            </View>

                            {showComparison && previousWeek.length > 0 && (
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                                        {previous}
                                    </Text>
                                </View>
                            )}

                            <View style={{ width: 50, alignItems: 'flex-end' }}>
                                {previous > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                        <Ionicons
                                            name={change >= 0 ? "caret-up" : "caret-down"}
                                            size={10}
                                            color={change >= 0 ? "#10b981" : "#ef4444"}
                                        />
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: '600',
                                            color: change >= 0 ? "#10b981" : "#ef4444"
                                        }}>
                                            {Math.abs(Math.round(change))}%
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
