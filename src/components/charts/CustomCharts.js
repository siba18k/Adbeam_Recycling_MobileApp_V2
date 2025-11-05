// Enterprise Custom Charts - 100% Reliable with Beautiful Animations
import React, { useEffect, useRef } from 'react';
import { View, Dimensions, Text, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

// 🚀 PROFESSIONAL: Animated Weekly Bar Chart
export function WeeklyBarChart({ labels = [], scans = [], goals = [], color = "#059669" }) {
    const animationRefs = useRef(labels.map(() => new Animated.Value(0))).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Animate bars entrance with stagger
        Animated.stagger(100,
            animationRefs.map((anim, index) =>
                Animated.spring(anim, {
                    toValue: scans[index] || 0,
                    friction: 6,
                    tension: 100,
                    useNativeDriver: false,
                })
            )
        ).start();

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
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
    const chartWidth = width - 100;
    const chartHeight = 200;
    const barWidth = (chartWidth - 60) / labels.length;

    return (
        <Animated.View style={{
            alignItems: 'center',
            paddingVertical: 15,
            transform: [{ scale: pulseAnim }]
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                height: chartHeight,
                width: chartWidth,
                paddingHorizontal: 30,
                paddingBottom: 30,
            }}>
                {labels.map((label, index) => {
                    const scanValue = scans[index] || 0;
                    const goalValue = goals[index] || 20;
                    const scanHeight = (scanValue / maxValue) * (chartHeight - 50);
                    const goalHeight = (goalValue / maxValue) * (chartHeight - 50);

                    return (
                        <TouchableOpacity
                            key={index}
                            style={{
                                alignItems: 'center',
                                width: barWidth,
                                height: chartHeight - 30,
                                justifyContent: 'flex-end',
                            }}
                            activeOpacity={0.8}
                            onPress={() => {
                                // Add haptic feedback or show detail
                                console.log(`${label}: ${scanValue} scans`);
                            }}
                        >
                            {/* Goal bar (background) */}
                            <View style={{
                                width: barWidth * 0.7,
                                height: Math.max(2, goalHeight),
                                backgroundColor: '#e5e7eb',
                                borderRadius: 4,
                                marginBottom: -Math.max(2, goalHeight),
                                zIndex: 1,
                            }} />

                            {/* Animated scan bar */}
                            <Animated.View style={{
                                width: barWidth * 0.7,
                                height: animationRefs[index].interpolate({
                                    inputRange: [0, maxValue],
                                    outputRange: [2, Math.max(2, scanHeight)],
                                    extrapolate: 'clamp',
                                }),
                                borderRadius: 4,
                                overflow: 'hidden',
                                zIndex: 2,
                            }}>
                                <LinearGradient
                                    colors={[color, color + 'cc']}
                                    style={{ flex: 1 }}
                                />

                                {/* Shimmer effect */}
                                <Animated.View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: -20,
                                    right: -20,
                                    height: '100%',
                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                    transform: [{
                                        translateX: pulseAnim.interpolate({
                                            inputRange: [1, 1.02],
                                            outputRange: [-40, 40],
                                        })
                                    }]
                                }} />
                            </Animated.View>

                            {/* Label */}
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: '#6b7280',
                                marginTop: 8,
                                textAlign: 'center',
                            }}>
                                {String(label).substring(0, 3)}
                            </Text>

                            {/* Value on hover */}
                            {scanValue > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    top: -25,
                                    backgroundColor: color,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    zIndex: 3,
                                }}>
                                    <Text style={{
                                        color: 'white',
                                        fontSize: 10,
                                        fontWeight: '700'
                                    }}>
                                        {scanValue}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );
}

// 🚀 PROFESSIONAL: SVG Animated Pie Chart
export function MaterialPie({ data = [] }) {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1500,
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
    const radius = 80;
    const innerRadius = 50;
    const centerX = 100;
    const centerY = 100;

    let currentAngle = -90; // Start from top
    const slices = validData.map(item => {
        const percentage = item.count / total;
        const angle = percentage * 360;

        const startAngle = (currentAngle * Math.PI) / 180;
        const endAngle = ((currentAngle + angle) * Math.PI) / 180;

        const largeArcFlag = angle > 180 ? 1 : 0;

        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);

        const innerX1 = centerX + innerRadius * Math.cos(startAngle);
        const innerY1 = centerY + innerRadius * Math.sin(startAngle);
        const innerX2 = centerX + innerRadius * Math.cos(endAngle);
        const innerY2 = centerY + innerRadius * Math.sin(endAngle);

        const pathData = [
            `M ${innerX1} ${innerY1}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${innerX2} ${innerY2}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
            'Z'
        ].join(' ');

        const result = {
            ...item,
            pathData,
            percentage: Math.round(percentage * 100),
        };

        currentAngle += angle;
        return result;
    });

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={{
            alignItems: 'center',
            paddingVertical: 10,
            transform: [{ scale: scaleAnim }]
        }}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Svg width={200} height={200} style={{ marginBottom: 16 }}>
                    <G>
                        {slices.map((slice, index) => (
                            <Path
                                key={index}
                                d={slice.pathData}
                                fill={slice.color}
                                stroke="white"
                                strokeWidth={2}
                            />
                        ))}
                    </G>
                </Svg>
            </Animated.View>

            {/* Enhanced Legend */}
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 16,
                marginTop: 8,
                paddingHorizontal: 20
            }}>
                {validData.map((material, index) => (
                    <View key={index} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: 'white',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        shadowColor: material.color,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                    }}>
                        <View style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: material.color
                        }} />
                        <Text style={{
                            fontSize: 12,
                            color: '#374151',
                            fontWeight: '700'
                        }}>
                            {material.name}
                        </Text>
                        <Text style={{
                            fontSize: 12,
                            color: '#6b7280',
                            fontWeight: '600'
                        }}>
                            ({material.percentage}%)
                        </Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
}

// 🚀 BULLETPROOF: Progress Ring with CSS-like approach
export function ProgressRing({ progress = 0, size = 60, strokeWidth = 4, color = "#f59e0b" }) {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const validProgress = Math.max(0, Math.min(1, progress || 0));

        Animated.parallel([
            Animated.timing(progressAnim, {
                toValue: validProgress,
                duration: 1500,
                useNativeDriver: false,
            }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
                ])
            )
        ]).start();
    }, [progress]);

    const validProgress = Math.max(0, Math.min(1, progress || 0));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <View style={{
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
        }}>
            {/* Glow effect */}
            <Animated.View style={{
                position: 'absolute',
                width: size + 8,
                height: size + 8,
                borderRadius: (size + 8) / 2,
                backgroundColor: color + '30',
                opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.5],
                }),
            }} />

            {/* Background circle */}
            <View style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: '#f3f4f6',
                position: 'absolute',
            }} />

            {/* Progress circle using SVG */}
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - validProgress)}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>

            {/* Center content */}
            <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'white',
                width: size - strokeWidth * 2 - 4,
                height: size - strokeWidth * 2 - 4,
                borderRadius: (size - strokeWidth * 2 - 4) / 2,
                shadowColor: color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
            }}>
                <Text style={{
                    fontSize: Math.max(8, size / 6),
                    fontWeight: 'bold',
                    color: '#374151'
                }}>
                    {Math.round(validProgress * 100)}%
                </Text>
            </View>
        </View>
    );
}

// 🚀 IMPRESSIVE: 3D-style Donut Chart
export function DonutChart({ data = [], size = 200 }) {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 50,
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 20000,
                    useNativeDriver: true,
                })
            )
        ]).start();
    }, []);

    if (!data || data.length === 0) return null;

    const validData = data.filter(item => item && item.count > 0);
    if (validData.length === 0) return null;

    const total = validData.reduce((sum, item) => sum + item.count, 0);
    const radius = size / 2 - 20;
    const innerRadius = radius * 0.6;

    let currentAngle = 0;
    const segments = validData.map((item, index) => {
        const percentage = item.count / total;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        const result = {
            ...item,
            startAngle,
            endAngle,
            percentage: Math.round(percentage * 100),
        };

        currentAngle += angle;
        return result;
    });

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={{
            alignItems: 'center',
            transform: [{ scale: scaleAnim }, { rotate: spin }]
        }}>
            <Svg width={size} height={size}>
                {segments.map((segment, index) => {
                    const startAngleRad = (segment.startAngle * Math.PI) / 180;
                    const endAngleRad = (segment.endAngle * Math.PI) / 180;

                    const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;

                    const x1 = size/2 + radius * Math.cos(startAngleRad);
                    const y1 = size/2 + radius * Math.sin(startAngleRad);
                    const x2 = size/2 + radius * Math.cos(endAngleRad);
                    const y2 = size/2 + radius * Math.sin(endAngleRad);

                    const innerX1 = size/2 + innerRadius * Math.cos(startAngleRad);
                    const innerY1 = size/2 + innerRadius * Math.sin(startAngleRad);
                    const innerX2 = size/2 + innerRadius * Math.cos(endAngleRad);
                    const innerY2 = size/2 + innerRadius * Math.sin(endAngleRad);

                    const pathData = [
                        `M ${innerX1} ${innerY1}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${innerX2} ${innerY2}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
                        'Z'
                    ].join(' ');

                    return (
                        <Path
                            key={index}
                            d={pathData}
                            fill={segment.color}
                            stroke="white"
                            strokeWidth={2}
                        />
                    );
                })}

                {/* Center text */}
                <SvgText
                    x={size / 2}
                    y={size / 2}
                    textAnchor="middle"
                    dy={4}
                    fontSize={16}
                    fontWeight="bold"
                    fill="#374151"
                >
                    {total}
                </SvgText>
                <SvgText
                    x={size / 2}
                    y={size / 2 + 16}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#6b7280"
                >
                    items
                </SvgText>
            </Svg>
        </Animated.View>
    );
}

// 🚀 PREMIUM: Animated Progress Bars (for material breakdown)
export function AnimatedProgressBar({
                                        label,
                                        value,
                                        maxValue,
                                        color,
                                        percentage,
                                        count,
                                        impact
                                    }) {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const targetWidth = Math.max(0.1, (value / maxValue));

        Animated.parallel([
            Animated.timing(progressAnim, {
                toValue: targetWidth,
                duration: 1000 + Math.random() * 500, // Stagger slightly
                useNativeDriver: false,
            }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
                ])
            )
        ]).start();
    }, [value, maxValue]);

    return (
        <View style={{
            marginBottom: 16,
            padding: 16,
            backgroundColor: 'white',
            borderRadius: 16,
            shadowColor: color,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 4,
        }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: color,
                        shadowColor: color,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.4,
                        shadowRadius: 4,
                        elevation: 3,
                    }} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937' }}>
                        {label}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#374151' }}>
                        {count}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                        {percentage}%
                    </Text>
                </View>
            </View>

            <View style={{
                height: 10,
                backgroundColor: '#f1f5f9',
                borderRadius: 5,
                overflow: 'hidden',
                marginBottom: 8,
            }}>
                <Animated.View style={{
                    height: 10,
                    borderRadius: 5,
                    width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                    }),
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <LinearGradient
                        colors={[color, color + 'cc']}
                        style={{ flex: 1 }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />

                    {/* Animated shimmer */}
                    <Animated.View style={{
                        position: 'absolute',
                        top: 0,
                        left: -30,
                        right: -30,
                        height: '100%',
                        backgroundColor: 'rgba(255,255,255,0.4)',
                        transform: [{
                            translateX: glowAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-60, 100],
                            })
                        }]
                    }} />
                </Animated.View>
            </View>

            {/* Impact info */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="leaf-outline" size={14} color="#059669" />
                <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600' }}>
                    Saved {impact}kg CO₂
                </Text>
            </View>
        </View>
    );
}
