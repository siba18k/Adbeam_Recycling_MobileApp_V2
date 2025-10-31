import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    SafeAreaView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getWeeklyProgress, getMaterialBreakdown } from '../services/database';

const { width, height } = Dimensions.get('window');

// Mock achievements for preview (first 4 only)
const PREVIEW_ACHIEVEMENTS = [
    { id: '1', name: 'First Steps', description: 'Scanned your first item', icon: 'leaf-outline', unlocked: true, date: '2025-10-15', rarity: 'common' },
    { id: '2', name: 'Getting Started', description: 'Scan 5 items', icon: 'leaf', unlocked: true, date: '2025-10-16', rarity: 'common' },
    { id: '3', name: 'Eco Apprentice', description: 'Scan 25 items', icon: 'planet', unlocked: true, date: '2025-10-18', rarity: 'uncommon' },
    { id: '4', name: 'Recycling Pro', description: 'Scan 50 items', icon: 'shield-checkmark', unlocked: false, progress: 0.89, rarity: 'rare' },
];

const NEWS_HEADLINES = [
    { title: 'Campus Sustainability Initiative Wins Award', time: '2h ago', type: 'campus' },
    { title: 'New Recycling Bins Installed Across Campus', time: '5h ago', type: 'update' },
    { title: 'Student Recycling Rate Hits 85% This Month', time: '1d ago', type: 'achievement' },
];

export default function DashboardScreen({ navigation }) {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        points: 1247,
        totalScans: 89,
        level: 5,
        rank: 8,
        co2Saved: 45.2,
        currentLevelProgress: 0.73,
        nextLevelPoints: 1500,
        weekStreak: 5
    });

    const [weeklyData, setWeeklyData] = useState({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        scans: [12, 19, 15, 23, 28, 18, 32],
        points: [120, 190, 150, 230, 280, 180, 320],
        goals: [20, 20, 20, 20, 20, 20, 20],
    });

    const [materialData, setMaterialData] = useState([
        { name: 'Plastic', count: 34, color: '#3b82f6', percentage: 38 },
        { name: 'Paper', count: 28, color: '#059669', percentage: 31 },
        { name: 'Glass', count: 18, color: '#f59e0b', percentage: 20 },
        { name: 'Metal', count: 9, color: '#ef4444', percentage: 11 },
    ]);
    const [weather, setWeather] = useState({ temp: 22, condition: 'sunny', humidity: 65, aqi: 42 });
    const [isRefreshing, setIsRefreshing] = useState(false);

    // DASHBOARD-SPECIFIC: Energy & Growth Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Subtle floating orbs instead of moving lines
    const orb1Float = useRef(new Animated.Value(0)).current;
    const orb2Float = useRef(new Animated.Value(0)).current;
    const orb3Float = useRef(new Animated.Value(0)).current;
    const orb1Scale = useRef(new Animated.Value(1)).current;
    const orb2Scale = useRef(new Animated.Value(1)).current;

    // Growth pulses for stats cards
    const growthPulse = useRef(new Animated.Value(1)).current;
    const pointsGlow = useRef(new Animated.Value(0)).current;
    const tiltAnim = useRef(new Animated.Value(0)).current;

    // Level progress animation
    const levelProgressAnim = useRef(new Animated.Value(0)).current;

    // Chart animations
    const chartFade = useRef(new Animated.Value(0)).current;
    const materialBarAnim = useRef(new Animated.Value(0)).current;

    // Achievement animations
    const achievementSlide = useRef(new Animated.Value(width)).current;
    const achievementPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Dynamic entrance - like energy surge
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(slideUpAnim, {
                    toValue: 0,
                    friction: 5,
                    tension: 45,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            // Chart entrance delay
            Animated.timing(chartFade, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            // FIXED: Level progress animation with numeric values only
            Animated.timing(levelProgressAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: false, // Must be false for width animation
            }),
        ]).start();

        // Subtle floating orbs
        Animated.loop(
            Animated.sequence([
                Animated.timing(orb1Float, {
                    toValue: 15,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(orb1Float, {
                    toValue: -15,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(orb2Float, {
                    toValue: -20,
                    duration: 5000,
                    useNativeDriver: true,
                }),
                Animated.timing(orb2Float, {
                    toValue: 20,
                    duration: 5000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(orb3Float, {
                    toValue: 10,
                    duration: 4500,
                    useNativeDriver: true,
                }),
                Animated.timing(orb3Float, {
                    toValue: -10,
                    duration: 4500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Orb scaling animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(orb1Scale, {
                    toValue: 1.1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(orb1Scale, {
                    toValue: 0.9,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(orb1Scale, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(orb2Scale, {
                    toValue: 0.8,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(orb2Scale, {
                    toValue: 1.2,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(orb2Scale, {
                    toValue: 1,
                    duration: 3500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Growth pulse for stats
        Animated.loop(
            Animated.sequence([
                Animated.timing(growthPulse, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(growthPulse, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Points glow effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(pointsGlow, {
                    toValue: 1,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(pointsGlow, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Tilt animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(tiltAnim, {
                    toValue: 1,
                    duration: 5000,
                    useNativeDriver: true,
                }),
                Animated.timing(tiltAnim, {
                    toValue: -1,
                    duration: 5000,
                    useNativeDriver: true,
                }),
                Animated.timing(tiltAnim, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Material bar animation
        Animated.timing(materialBarAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
        }).start();

        // Achievement slide in
        Animated.spring(achievementSlide, {
            toValue: 0,
            friction: 8,
            tension: 50,
            useNativeDriver: true,
        }).start();

        // Achievement pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(achievementPulse, {
                    toValue: 1.03,
                    duration: 2200,
                    useNativeDriver: true,
                }),
                Animated.timing(achievementPulse, {
                    toValue: 1,
                    duration: 2200,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Load real data
        loadDashboardData();
        loadWeatherData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const result = await getUserStats(user?.uid);
            if (result?.success) {
                setStats(prevStats => ({ ...prevStats, ...result.data }));
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const loadWeatherData = async () => {
        try {
            const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-26.2041&longitude=28.0473&current_weather=true&hourly=temperature_2m,relative_humidity_2m&timezone=Africa/Johannesburg');
            const data = await response.json();

            if (data.current_weather) {
                setWeather({
                    temp: Math.round(data.current_weather.temperature),
                    condition: getWeatherCondition(data.current_weather.weathercode),
                    humidity: data.hourly.relative_humidity_2m[0] || 65,
                    aqi: Math.floor(Math.random() * 50) + 20,
                });
            }
        } catch (error) {
            console.error('Error loading weather:', error);
        }
    };

    const getWeatherCondition = (code) => {
        if (code === 0) return 'sunny';
        if (code <= 3) return 'cloudy';
        if (code <= 67) return 'rainy';
        return 'sunny';
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadDashboardData();
        await loadWeatherData();
        setIsRefreshing(false);
    };

    const getNewsTypeColor = (type) => {
        switch (type) {
            case 'campus': return '#3b82f6';
            case 'update': return '#059669';
            case 'achievement': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const loadNewsData = async () => {
        try {
            setIsRefreshing(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsRefreshing(false);
        } catch (error) {
            console.error('Error loading news:', error);
            setIsRefreshing(false);
        }
    };

    // FIXED: All animation interpolations with proper numeric values
    const glowIntensity = pointsGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    const tiltRotation = tiltAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-5deg', '0deg', '5deg'],
    });

    // FIXED: Level progress width calculation
    const levelProgressWidth = levelProgressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, width - 80], // Use actual numeric width instead of percentage
    });

    // Chart configurations
    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: '#059669',
        backgroundGradientTo: '#047857',
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.6,
        decimalPlaces: 0,
        propsForLabels: {
            fontSize: 11,
            fontWeight: '600',
        },
        propsForVerticalLabels: {
            fontSize: 10,
        },
        fillShadowGradient: '#10b981',
        fillShadowGradientOpacity: 0.3,
    };

    const pieData = materialData.map(item => ({
        name: item.name,
        population: item.count,
        color: item.color,
        legendFontColor: '#374151',
        legendFontSize: 13,
    }));

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#ecfdf5', '#d1fae5', '#ffffff']} style={styles.gradient}>
                {/* Subtle floating orbs */}
                <Animated.View style={[
                    styles.floatingOrb,
                    styles.orb1,
                    {
                        transform: [{ translateY: orb1Float }, { scale: orb1Scale }],
                        opacity: 0.1
                    }
                ]} />
                <Animated.View style={[
                    styles.floatingOrb,
                    styles.orb2,
                    {
                        transform: [{ translateY: orb2Float }, { scale: orb2Scale }],
                        opacity: 0.08
                    }
                ]} />
                <Animated.View style={[
                    styles.floatingOrb,
                    styles.orb3,
                    {
                        transform: [{ translateY: orb3Float }, { scale: orb1Scale }],
                        opacity: 0.12
                    }
                ]} />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ENHANCED: Header with Level Progress Bar */}
                    <Animated.View
                        style={[
                            styles.header,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
                            },
                        ]}
                    >
                        <LinearGradient colors={['#059669', '#047857']} style={styles.headerGradient}>
                            <View style={styles.headerTop}>
                                <View style={styles.welcomeSection}>
                                    <Text style={styles.welcomeText}>Welcome back!</Text>
                                    <Text style={styles.userName}>{user?.displayName || 'Eco Warrior'} 🌱</Text>
                                </View>
                                <Animated.View style={[styles.levelBadge, { transform: [{ scale: growthPulse }] }]}>
                                    <Ionicons name="trending-up" size={18} color="white" />
                                    <Text style={styles.levelText}>Level {stats.level}</Text>
                                </Animated.View>
                            </View>

                            {/* FIXED: Level Progress Bar */}
                            <View style={styles.levelProgressSection}>
                                <View style={styles.levelProgressInfo}>
                                    <Text style={styles.levelProgressText}>
                                        {stats.points}/{stats.nextLevelPoints} points to Level {stats.level + 1}
                                    </Text>
                                    <View style={styles.streakBadge}>
                                        <Ionicons name="flash" size={12} color="#fbbf24" />
                                        <Text style={styles.streakText}>{stats.weekStreak} day streak</Text>
                                    </View>
                                </View>
                                <View style={styles.levelProgressTrack}>
                                    <Animated.View
                                        style={[
                                            styles.levelProgressBar,
                                            {
                                                width: levelProgressWidth, // FIXED: Use numeric width
                                            },
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={['#fbbf24', '#f59e0b']}
                                            style={styles.levelProgressGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
                                        {/* Progress shimmer */}
                                        <Animated.View
                                            style={[
                                                styles.progressShimmer,
                                                {
                                                    transform: [
                                                        {
                                                            translateX: pointsGlow.interpolate({
                                                                inputRange: [0, 1],
                                                                outputRange: [-30, 40],
                                                            }),
                                                        },
                                                    ],
                                                },
                                            ]}
                                        />
                                    </Animated.View>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Enhanced Stats Cards Grid */}
                    <View style={styles.statsGrid}>
                        {/* Points Card */}
                        <Animated.View
                            style={[
                                styles.statCard,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideUpAnim }, { scale: growthPulse }],
                                },
                            ]}
                        >
                            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statGradient}>
                                <Animated.View style={[styles.statIcon, { opacity: glowIntensity }]}>
                                    <Ionicons name="star" size={28} color="white" />
                                    <Animated.View style={[styles.iconGlow, { opacity: glowIntensity }]} />
                                </Animated.View>
                                <Text style={styles.statValue}>{stats.points}</Text>
                                <Text style={styles.statLabel}>Eco Points</Text>
                                <View style={styles.statTrend}>
                                    <Ionicons name="trending-up" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.trendText}>+12% this week</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        {/* Items Card */}
                        <Animated.View
                            style={[
                                styles.statCard,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
                                },
                            ]}
                        >
                            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statGradient}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="leaf" size={28} color="white" />
                                </View>
                                <Text style={styles.statValue}>{stats.totalScans}</Text>
                                <Text style={styles.statLabel}>Items Scanned</Text>
                                <View style={styles.statTrend}>
                                    <Ionicons name="trending-up" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.trendText}>+8 this week</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        {/* CO2 Saved Card */}
                        <Animated.View
                            style={[
                                styles.statCard,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
                                },
                            ]}
                        >
                            <LinearGradient colors={['#059669', '#047857']} style={styles.statGradient}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="cloud" size={28} color="white" />
                                </View>
                                <Text style={styles.statValue}>{stats.co2Saved}</Text>
                                <Text style={styles.statLabel}>kg CO₂ Saved</Text>
                                <View style={styles.statTrend}>
                                    <Ionicons name="trending-up" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.trendText}>+2.3kg this month</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        {/* Rank Card */}
                        <Animated.View
                            style={[
                                styles.statCard,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
                                },
                            ]}
                        >
                            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statGradient}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="trophy" size={28} color="white" />
                                </View>
                                <Text style={styles.statValue}>#{stats.rank}</Text>
                                <Text style={styles.statLabel}>Campus Rank</Text>
                                <View style={styles.statTrend}>
                                    <Ionicons name="trending-up" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.trendText}>↑3 positions</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    </View>

                    {/* Weather & Environmental Info */}
                    <Animated.View
                        style={[
                            styles.environmentalSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f0f9ff']} style={styles.environmentalCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="partly-sunny" size={22} color="#3b82f6" />
                                <Text style={styles.sectionTitle}>🌍 Environmental Data</Text>
                            </View>

                            <View style={styles.environmentalGrid}>
                                <Animated.View style={[styles.envItem, { transform: [{ scale: growthPulse }] }]}>
                                    <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.envItemGradient}>
                                        <Ionicons name="sunny" size={24} color="white" />
                                        <Text style={styles.envValue}>{weather.temp}°C</Text>
                                        <Text style={styles.envLabel}>Temperature</Text>
                                    </LinearGradient>
                                </Animated.View>

                                <Animated.View style={[styles.envItem, { transform: [{ scale: scaleAnim }] }]}>
                                    <LinearGradient colors={['#059669', '#047857']} style={styles.envItemGradient}>
                                        <Ionicons name="leaf" size={24} color="white" />
                                        <Text style={styles.envValue}>{weather.aqi}</Text>
                                        <Text style={styles.envLabel}>Air Quality</Text>
                                    </LinearGradient>
                                </Animated.View>

                                <Animated.View style={[styles.envItem, { transform: [{ scale: scaleAnim }] }]}>
                                    <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.envItemGradient}>
                                        <Ionicons name="water" size={24} color="white" />
                                        <Text style={styles.envValue}>{weather.humidity}%</Text>
                                        <Text style={styles.envLabel}>Humidity</Text>
                                    </LinearGradient>
                                </Animated.View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* REDESIGNED: Enhanced Weekly Progress Chart */}
                    <Animated.View
                        style={[
                            styles.chartSection,
                            { opacity: chartFade, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <View style={styles.chartTitleSection}>
                                    <Ionicons name="bar-chart" size={22} color="#059669" />
                                    <Text style={styles.sectionTitle}>📊 Weekly Recycling Progress</Text>
                                </View>
                                <View style={styles.chartStats}>
                                    <View style={styles.chartStat}>
                                        <Text style={styles.chartStatValue}>{weeklyData.scans.reduce((a, b) => a + b, 0)}</Text>
                                        <Text style={styles.chartStatLabel}>Total Items</Text>
                                    </View>
                                    <View style={styles.chartDivider} />
                                    <View style={styles.chartStat}>
                                        <Text style={styles.chartStatValue}>{Math.round(weeklyData.scans.reduce((a, b) => a + b, 0) / 7)}</Text>
                                        <Text style={styles.chartStatLabel}>Daily Avg</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Dual Bar Chart: Scans vs Goals */}
                            <BarChart
                                data={{
                                    labels: weeklyData.labels,
                                    datasets: [
                                        {
                                            data: weeklyData.scans,
                                            color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                                        },
                                        {
                                            data: weeklyData.goals,
                                            color: (opacity = 1) => `rgba(156, 163, 175, ${opacity * 0.5})`,
                                        },
                                    ],
                                }}
                                width={width - 64}
                                height={200}
                                chartConfig={chartConfig}
                                style={styles.chart}
                                withInnerLines={true}
                                withVerticalLabels={true}
                                withHorizontalLabels={true}
                                fromZero={true}
                                showValuesOnTopOfBars={true}
                            />

                            <View style={styles.chartLegend}>
                                <View style={styles.legendRow}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
                                        <Text style={styles.legendText}>Items Scanned</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#9ca3af' }]} />
                                        <Text style={styles.legendText}>Daily Goal (20)</Text>
                                    </View>
                                </View>
                                <Text style={styles.chartInsight}>
                                    🎯 You exceeded your goal on {weeklyData.scans.filter((scan, i) => scan >= weeklyData.goals[i]).length}/7 days!
                                </Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Quick Actions (MOVED under chart) */}
                    <Animated.View
                        style={[
                            styles.quickActions,
                            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <Text style={styles.quickActionsTitle}>⚡ Quick Actions</Text>
                        <View style={styles.actionsGrid}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('Scanner')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={['#059669', '#047857']} style={styles.actionGradient}>
                                    <Animated.View style={{ transform: [{ scale: growthPulse }] }}>
                                        <Ionicons name="scan" size={32} color="white" />
                                    </Animated.View>
                                    <Text style={styles.actionText}>Scan Items</Text>
                                    <Text style={styles.actionSubtext}>Earn eco-points</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('Rewards')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.actionGradient}>
                                    <View style={styles.actionIcon}>
                                        <Ionicons name="gift" size={32} color="white" />
                                    </View>
                                    <Text style={styles.actionText}>View Rewards</Text>
                                    <Text style={styles.actionSubtext}>Redeem points</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('Leaderboard')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.actionGradient}>
                                    <View style={styles.actionIcon}>
                                        <Ionicons name="trophy" size={32} color="white" />
                                    </View>
                                    <Text style={styles.actionText}>Leaderboard</Text>
                                    <Text style={styles.actionSubtext}>Check ranking</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('Profile')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionGradient}>
                                    <View style={styles.actionIcon}>
                                        <Ionicons name="person" size={32} color="white" />
                                    </View>
                                    <Text style={styles.actionText}>Profile</Text>
                                    <Text style={styles.actionSubtext}>View progress</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* PREVIEW: Achievements Section with View All button */}
                    <Animated.View
                        style={[
                            styles.achievementsSection,
                            { opacity: fadeAnim, transform: [{ translateX: achievementSlide }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#fef3c7']} style={styles.achievementsCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="trophy" size={22} color="#f59e0b" />
                                <Text style={styles.sectionTitle}>🏆 Achievements</Text>
                                {/* View All button links to Achievements screen */}
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('Achievements')}
                                >
                                    <Text style={styles.viewAllText}>View All</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
                                {PREVIEW_ACHIEVEMENTS.map((achievement, index) => (
                                    <Animated.View
                                        key={achievement.id}
                                        style={[
                                            styles.achievementCard,
                                            achievement.unlocked ? styles.unlockedAchievement : styles.lockedAchievement,
                                            {
                                                opacity: fadeAnim,
                                                transform: [
                                                    { scale: achievement.unlocked ? achievementPulse : 1 },
                                                    {
                                                        translateY: fadeAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [20, 0],
                                                        }),
                                                    },
                                                ],
                                            },
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={
                                                achievement.unlocked
                                                    ? ['#f59e0b', '#d97706']
                                                    : ['#e5e7eb', '#d1d5db']
                                            }
                                            style={styles.achievementGradient}
                                        >
                                            <View style={styles.achievementIcon}>
                                                <Ionicons
                                                    name={achievement.icon}
                                                    size={24}
                                                    color={achievement.unlocked ? 'white' : '#9ca3af'}
                                                />
                                                {achievement.unlocked && (
                                                    <Animated.View style={[styles.achievementGlow, { opacity: glowIntensity }]} />
                                                )}
                                            </View>
                                            <Text style={[
                                                styles.achievementName,
                                                { color: achievement.unlocked ? 'white' : '#6b7280' }
                                            ]}>
                                                {achievement.name}
                                            </Text>
                                            <Text style={[
                                                styles.achievementDesc,
                                                { color: achievement.unlocked ? 'rgba(255,255,255,0.9)' : '#9ca3af' }
                                            ]}>
                                                {achievement.description}
                                            </Text>

                                            {/* FIXED: Progress bar with numeric values */}
                                            {!achievement.unlocked && achievement.progress && (
                                                <View style={styles.progressContainer}>
                                                    <View style={styles.progressTrack}>
                                                        <Animated.View
                                                            style={[
                                                                styles.progressBar,
                                                                {
                                                                    width: materialBarAnim.interpolate({
                                                                        inputRange: [0, 1],
                                                                        outputRange: [0, 120 * achievement.progress], // FIXED: Use numeric width
                                                                    }),
                                                                },
                                                            ]}
                                                        />
                                                    </View>
                                                    <Text style={styles.progressText}>
                                                        {Math.round(achievement.progress * 100)}%
                                                    </Text>
                                                </View>
                                            )}

                                            {achievement.unlocked && achievement.date && (
                                                <Text style={styles.achievementDate}>
                                                    Unlocked {new Date(achievement.date).toLocaleDateString()}
                                                </Text>
                                            )}
                                        </LinearGradient>
                                    </Animated.View>
                                ))}
                            </ScrollView>
                        </LinearGradient>
                    </Animated.View>

                    {/* IMPRESSIVE Material Breakdown */}
                    <Animated.View
                        style={[
                            styles.materialSection,
                            { opacity: chartFade, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.materialCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="analytics" size={22} color="#f59e0b" />
                                <Text style={styles.sectionTitle}>♻️ Material Breakdown</Text>
                            </View>

                            {/* Interactive Material Bars */}
                            <View style={styles.materialBars}>
                                {materialData.map((material, index) => (
                                    <Animated.View
                                        key={material.name}
                                        style={[
                                            styles.materialBarContainer,
                                            {
                                                opacity: fadeAnim,
                                                transform: [
                                                    {
                                                        translateX: fadeAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [width, 0],
                                                        }),
                                                    },
                                                ],
                                            },
                                        ]}
                                    >
                                        <View style={styles.materialHeader}>
                                            <View style={styles.materialInfo}>
                                                <View style={[styles.materialColorDot, { backgroundColor: material.color }]} />
                                                <Text style={styles.materialName}>{material.name}</Text>
                                            </View>
                                            <View style={styles.materialStats}>
                                                <Text style={styles.materialCount}>{material.count}</Text>
                                                <Text style={styles.materialPercentage}>{material.percentage}%</Text>
                                            </View>
                                        </View>

                                        <View style={styles.materialBarTrack}>
                                            <Animated.View
                                                style={[
                                                    styles.materialBar,
                                                    {
                                                        backgroundColor: material.color,
                                                        width: materialBarAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0, (width - 80) * (material.percentage / 100)], // FIXED: Numeric width
                                                        }),
                                                    },
                                                ]}
                                            >
                                                <LinearGradient
                                                    colors={[material.color, `${material.color}99`]}
                                                    style={styles.materialBarGradient}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                />

                                                {/* Shimmer effect */}
                                                <Animated.View
                                                    style={[
                                                        styles.barShimmer,
                                                        {
                                                            transform: [
                                                                {
                                                                    translateX: pointsGlow.interpolate({
                                                                        inputRange: [0, 1],
                                                                        outputRange: [-50, 100],
                                                                    }),
                                                                },
                                                            ],
                                                        },
                                                    ]}
                                                />
                                            </Animated.View>
                                        </View>

                                        {/* Environmental Impact */}
                                        <View style={styles.impactInfo}>
                                            <Ionicons name="leaf-outline" size={14} color="#059669" />
                                            <Text style={styles.impactText}>
                                                Saved {(material.count * 0.12).toFixed(1)}kg CO₂
                                            </Text>
                                        </View>
                                    </Animated.View>
                                ))}
                            </View>

                            {/* Pie Chart */}
                            <View style={styles.pieChartContainer}>
                                <Animated.View style={{ opacity: chartFade }}>
                                    <PieChart
                                        data={pieData}
                                        width={width - 80}
                                        height={200}
                                        chartConfig={{
                                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        }}
                                        accessor="population"
                                        backgroundColor="transparent"
                                        paddingLeft="15"
                                        absolute
                                        hasLegend={false}
                                    />
                                </Animated.View>

                                {/* Custom Legend */}
                                <View style={styles.customLegend}>
                                    {materialData.map((material, index) => (
                                        <Animated.View
                                            key={material.name}
                                            style={[
                                                styles.legendItem,
                                                {
                                                    opacity: fadeAnim,
                                                    transform: [
                                                        {
                                                            scale: fadeAnim.interpolate({
                                                                inputRange: [0, 1],
                                                                outputRange: [0, 1],
                                                            }),
                                                        },
                                                    ],
                                                },
                                            ]}
                                        >
                                            <View style={[styles.legendDot, { backgroundColor: material.color }]} />
                                            <Text style={styles.legendText}>
                                                {material.name} ({material.percentage}%)
                                            </Text>
                                        </Animated.View>
                                    ))}
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Environmental News Feed */}
                    <Animated.View
                        style={[
                            styles.newsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f0fdf4']} style={styles.newsCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="newspaper" size={22} color="#059669" />
                                <Text style={styles.sectionTitle}>📰 Campus Eco News</Text>
                                <TouchableOpacity style={styles.refreshNewsButton} onPress={loadNewsData} activeOpacity={0.7}>
                                    <Animated.View style={{ transform: [{ rotate: isRefreshing ? '360deg' : '0deg' }] }}>
                                        <Ionicons name="refresh" size={16} color="#059669" />
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>

                            {NEWS_HEADLINES.map((news, index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.newsItem,
                                        {
                                            opacity: fadeAnim,
                                            transform: [
                                                {
                                                    translateX: fadeAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [50, 0],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <View style={[styles.newsTypeIndicator, { backgroundColor: getNewsTypeColor(news.type) }]} />
                                    <View style={styles.newsContent}>
                                        <Text style={styles.newsTitle} numberOfLines={2}>
                                            {news.title}
                                        </Text>
                                        <Text style={styles.newsTime}>{news.time}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.newsAction} activeOpacity={0.7}>
                                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}

                            <TouchableOpacity style={styles.viewAllNewsButton} activeOpacity={0.8}>
                                <LinearGradient colors={['#059669', '#047857']} style={styles.viewAllNewsGradient}>
                                    <Text style={styles.viewAllNewsText}>View All Campus News</Text>
                                    <Ionicons name="open-outline" size={16} color="white" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>

                    {/* Environmental Impact Summary */}
                    <Animated.View
                        style={[
                            styles.impactSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#059669', '#047857']} style={styles.impactCard}>
                            <View style={styles.impactHeader}>
                                <Animated.View style={[styles.impactIcon, { transform: [{ rotate: tiltRotation }, { scale: growthPulse }] }]}>
                                    <Ionicons name="earth" size={32} color="white" />
                                </Animated.View>
                                <Text style={styles.impactTitle}>🌍 Your Environmental Impact</Text>
                                <Text style={styles.impactSubtitle}>Making a difference, one scan at a time</Text>
                            </View>

                            <View style={styles.impactStats}>
                                <View style={styles.impactStatItem}>
                                    <Ionicons name="leaf" size={20} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.impactStatValue}>{stats.co2Saved}kg</Text>
                                    <Text style={styles.impactStatLabel}>CO₂ Prevented</Text>
                                </View>
                                <View style={styles.impactStatItem}>
                                    <Ionicons name="water" size={20} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.impactStatValue}>{(stats.totalScans * 2.3).toFixed(0)}L</Text>
                                    <Text style={styles.impactStatLabel}>Water Saved</Text>
                                </View>
                                <View style={styles.impactStatItem}>
                                    <Ionicons name="battery-charging" size={20} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.impactStatValue}>{(stats.totalScans * 1.8).toFixed(0)}kWh</Text>
                                    <Text style={styles.impactStatLabel}>Energy Saved</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },

    // Subtle floating orbs
    floatingOrb: {
        position: 'absolute',
        borderRadius: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    orb1: {
        width: 120,
        height: 120,
        backgroundColor: '#059669',
        top: '15%',
        right: -40,
    },
    orb2: {
        width: 160,
        height: 160,
        backgroundColor: '#f59e0b',
        top: '45%',
        left: -60,
    },
    orb3: {
        width: 100,
        height: 100,
        backgroundColor: '#3b82f6',
        bottom: '20%',
        right: -30,
    },

    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },

    // Header
    header: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    headerGradient: {
        padding: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    welcomeSection: { flex: 1 },
    welcomeText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    userName: {
        fontSize: 24,
        color: 'white',
        fontWeight: '800',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    levelText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },

    // Level Progress Section
    levelProgressSection: {
        marginTop: 8,
    },
    levelProgressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    levelProgressText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    streakText: {
        fontSize: 11,
        color: '#fbbf24',
        fontWeight: '700',
    },
    levelProgressTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
        width: width - 80, // Fixed width container
    },
    levelProgressBar: {
        height: 6,
        borderRadius: 3,
        position: 'relative',
    },
    levelProgressGradient: {
        flex: 1,
        borderRadius: 3,
    },
    progressShimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 3,
    },

    // Enhanced Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: (width - 44) / 2,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    statGradient: {
        padding: 18,
        alignItems: 'center',
        position: 'relative',
    },
    statIcon: {
        marginBottom: 10,
        position: 'relative',
    },
    iconGlow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        zIndex: -1,
    },
    statValue: {
        fontSize: 26,
        fontWeight: '900',
        color: 'white',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        textAlign: 'center',
    },
    statTrend: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    trendText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },

    // Environmental Section
    environmentalSection: { marginBottom: 20 },
    environmentalCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    environmentalGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    envItem: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    envItemGradient: {
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },
    envValue: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
    },
    envLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },

    // Chart Section
    chartSection: { marginBottom: 20 },
    chartCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    chartHeader: {
        marginBottom: 16,
    },
    chartTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    chartStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    chartStat: {
        alignItems: 'center',
    },
    chartStatValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#059669',
    },
    chartStatLabel: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '600',
    },
    chartDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#e5e7eb',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        color: '#1f2937',
    },
    chart: {
        borderRadius: 12,
        marginVertical: 8,
    },
    chartLegend: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    chartInsight: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '600',
        textAlign: 'center',
    },

    // Quick Actions
    quickActions: { marginBottom: 20 },
    quickActionsTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionButton: {
        width: (width - 44) / 2,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    actionGradient: {
        padding: 18,
        alignItems: 'center',
        gap: 8,
    },
    actionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    actionSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '500',
    },

    // Achievements Preview Section
    achievementsSection: { marginBottom: 20 },
    achievementsCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f59e0b',
    },
    achievementsScroll: {
        marginTop: 8,
    },
    achievementCard: {
        width: 140,
        marginRight: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    unlockedAchievement: {
        shadowColor: '#f59e0b',
        shadowOpacity: 0.4,
    },
    lockedAchievement: {
        shadowColor: '#9ca3af',
        shadowOpacity: 0.2,
    },
    achievementGradient: {
        padding: 16,
        alignItems: 'center',
        minHeight: 120,
    },
    achievementIcon: {
        position: 'relative',
        marginBottom: 8,
    },
    achievementGlow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        zIndex: -1,
    },
    achievementName: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    achievementDesc: {
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 8,
    },
    achievementDate: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        fontWeight: '500',
    },
    progressContainer: {
        width: '100%',
        marginTop: 8,
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
        width: 120, // Fixed container width
    },
    progressBar: {
        height: 4,
        backgroundColor: '#f59e0b',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 9,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '600',
    },

    // Material Breakdown
    materialSection: { marginBottom: 20 },
    materialCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    materialBars: { marginBottom: 20 },
    materialBarContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    materialInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    materialColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    materialName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1f2937',
    },
    materialStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    materialCount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#374151',
    },
    materialPercentage: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    materialBarTrack: {
        height: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
        width: width - 80, // Fixed track width
    },
    materialBar: {
        height: 8,
        borderRadius: 4,
        position: 'relative',
    },
    materialBarGradient: {
        flex: 1,
        borderRadius: 4,
    },
    barShimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 40,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 4,
    },
    impactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    impactText: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '600',
    },

    // Pie Chart
    pieChartContainer: {
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 2,
        borderTopColor: '#f3f4f6',
    },
    customLegend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginTop: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '600',
    },

    // News Section
    newsSection: { marginBottom: 20 },
    newsCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    refreshNewsButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    newsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0fdf4',
    },
    newsTypeIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    newsContent: { flex: 1 },
    newsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
        lineHeight: 18,
    },
    newsTime: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '500',
    },
    newsAction: {
        padding: 4,
    },
    viewAllNewsButton: {
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    viewAllNewsGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    viewAllNewsText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },

    // Environmental Impact
    impactSection: { marginBottom: 20 },
    impactCard: {
        borderRadius: 20,
        padding: 24,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    impactHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    impactIcon: {
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    impactTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
        textAlign: 'center',
        marginBottom: 4,
    },
    impactSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    impactStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    impactStatItem: {
        alignItems: 'center',
        gap: 6,
    },
    impactStatValue: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
    },
    impactStatLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        textAlign: 'center',
    },
});
