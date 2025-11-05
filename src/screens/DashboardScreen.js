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
    Linking,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 📊 RELIABLE: Import readable charts
import { WeeklyBarChart, MaterialPie, ProgressRing, DataSummaryCard } from '../components/charts/ReadableCharts';

import { useAuth } from '../context/AuthContext';
import { getUserStats } from '../services/database';
import { useUserAnalytics } from '../hooks/useUserAnalytics';
import { fetchOpenWeather, fetchEnvNews } from '../services/environment';
import { OPEN_WEATHER_API_KEY, ENV_NEWS_API_KEY } from '../config/apiKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const PREVIEW_ACHIEVEMENTS = [
    { id: '1', name: 'First Steps', description: 'Scanned your first item', icon: 'leaf-outline', unlocked: true, date: '2025-10-15', progress: 1.0 },
    { id: '2', name: 'Getting Started', description: 'Scan 5 items', icon: 'leaf', unlocked: true, date: '2025-10-16', progress: 1.0 },
    { id: '3', name: 'Eco Apprentice', description: 'Scan 25 items', icon: 'planet', unlocked: true, date: '2025-10-18', progress: 1.0 },
    { id: '4', name: 'Recycling Pro', description: 'Scan 50 items', icon: 'shield-checkmark', unlocked: false, progress: 0.89 },
];

export default function DashboardScreen({ navigation }) {
    const { user } = useAuth();

    const [stats, setStats] = useState({
        points: 1250,
        totalScans: 23,
        level: 3,
        rank: 8,
        co2Saved: 2.8,
        currentLevelProgress: 0.65,
        nextLevelPoints: 400,
        weekStreak: 4
    });

    const { weekly: weeklyData, materials: materialData, loading: analyticsLoading, refresh: refreshAnalytics } = useUserAnalytics(user?.uid);

    const [weather, setWeather] = useState({
        temp: 12,
        condition: 'cloudy',
        humidity: 81,
        aqi: 44,
        city: 'Johannesburg'
    });
    const [news, setNews] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const orb1Float = useRef(new Animated.Value(0)).current;
    const orb2Float = useRef(new Animated.Value(0)).current;
    const orb3Float = useRef(new Animated.Value(0)).current;
    const orb1Scale = useRef(new Animated.Value(1)).current;
    const orb2Scale = useRef(new Animated.Value(1)).current;
    const growthPulse = useRef(new Animated.Value(1)).current;
    const pointsGlow = useRef(new Animated.Value(0)).current;
    const tiltAnim = useRef(new Animated.Value(0)).current;
    const levelProgressAnim = useRef(new Animated.Value(0)).current;
    const chartFade = useRef(new Animated.Value(0)).current;
    const materialBarAnim = useRef(new Animated.Value(0)).current;
    const achievementSlide = useRef(new Animated.Value(width)).current;
    const achievementPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        startAnimations();
        loadDashboardData();
        loadEnvironmentData();
    }, []);

    const startAnimations = () => {
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
            Animated.timing(chartFade, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(levelProgressAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: false,
            }),
        ]).start();

        // Floating orbs
        [
            [orb1Float, 15, 4000],
            [orb2Float, 20, 5000],
            [orb3Float, 10, 4500]
        ].forEach(([anim, distance, duration]) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: distance,
                        duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: -distance,
                        duration,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });

        // Continuous animations
        [
            [growthPulse, 1, 1.05, 2000],
            [pointsGlow, 0, 1, 2500],
            [orb1Scale, 1, 1.1, 3000],
            [orb2Scale, 1, 1.2, 3500],
            [achievementPulse, 1, 1.03, 2200]
        ].forEach(([anim, from, to, duration]) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: to, duration, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: from, duration, useNativeDriver: true }),
                ])
            ).start();
        });

        Animated.timing(materialBarAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
        }).start();

        Animated.spring(achievementSlide, {
            toValue: 0,
            friction: 8,
            tension: 50,
            useNativeDriver: true,
        }).start();

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
    };

    const loadDashboardData = async () => {
        try {
            if (!user?.uid) return;

            const result = await getUserStats(user.uid);
            if (result?.success && result.data) {
                const data = result.data;

                const currentLevelThreshold = (data.level || 1) * 100;
                const nextLevelThreshold = ((data.level || 1) + 1) * 100;
                const userPoints = data.totalPoints || 0;
                const progressInCurrentLevel = userPoints - currentLevelThreshold;
                const pointsNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
                const currentLevelProgress = Math.max(0, Math.min(1, progressInCurrentLevel / pointsNeededForNextLevel));

                setStats({
                    points: userPoints,
                    totalScans: data.totalScans || 0,
                    level: data.level || 1,
                    rank: data.rank || 0,
                    co2Saved: data.environmentalImpact?.co2Saved || 0,
                    currentLevelProgress: currentLevelProgress,
                    nextLevelPoints: nextLevelThreshold,
                    weekStreak: data.streak || 0
                });
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const loadEnvironmentData = async () => {
        try {
            const [cachedWeather, cachedNews] = await Promise.all([
                AsyncStorage.getItem('cachedWeather'),
                AsyncStorage.getItem('cachedNews')
            ]);

            if (cachedWeather) {
                try {
                    const weatherData = JSON.parse(cachedWeather);
                    if (Date.now() - weatherData.timestamp < 30 * 60 * 1000) {
                        setWeather(weatherData.data);
                    }
                } catch (parseError) {
                    console.log('Weather cache parse error:', parseError);
                }
            }

            if (cachedNews) {
                try {
                    const newsData = JSON.parse(cachedNews);
                    if (Date.now() - newsData.timestamp < 2 * 60 * 60 * 1000) {
                        setNews(newsData.data);
                    }
                } catch (parseError) {
                    console.log('News cache parse error:', parseError);
                }
            }

            const [weatherResult, newsResult] = await Promise.all([
                fetchOpenWeather(OPEN_WEATHER_API_KEY),
                fetchEnvNews(ENV_NEWS_API_KEY)
            ]);

            if (weatherResult.success && weatherResult.data) {
                setWeather(weatherResult.data);
                await AsyncStorage.setItem('cachedWeather', JSON.stringify({
                    data: weatherResult.data,
                    timestamp: Date.now()
                }));
            }

            if (newsResult.success && newsResult.data && Array.isArray(newsResult.data)) {
                setNews(newsResult.data);
                await AsyncStorage.setItem('cachedNews', JSON.stringify({
                    data: newsResult.data,
                    timestamp: Date.now()
                }));
            }
        } catch (error) {
            console.error('Error loading environment data:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            loadDashboardData(),
            loadEnvironmentData(),
            refreshAnalytics()
        ]);
        setIsRefreshing(false);
    };

    const handleNewsPress = async (newsItem) => {
        if (newsItem.url) {
            try {
                const supported = await Linking.canOpenURL(newsItem.url);
                if (supported) {
                    await Linking.openURL(newsItem.url);
                } else {
                    Alert.alert('Error', 'Cannot open this news article');
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to open news article');
            }
        }
    };

    const getNewsTypeColor = (type) => {
        switch (type) {
            case 'campus': return '#3b82f6';
            case 'update': return '#059669';
            case 'achievement': return '#f59e0b';
            case 'environment': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getWeatherIcon = (condition) => {
        switch (condition?.toLowerCase()) {
            case 'clear':
            case 'sunny': return 'sunny';
            case 'clouds':
            case 'cloudy': return 'cloudy';
            case 'rain':
            case 'rainy': return 'rainy';
            case 'snow': return 'snow';
            case 'thunderstorm': return 'thunderstorm';
            default: return 'partly-sunny';
        }
    };

    const glowIntensity = pointsGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    const tiltRotation = tiltAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-5deg', '0deg', '5deg'],
    });

    const levelProgressWidth = levelProgressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(10, (width - 80) * stats.currentLevelProgress)],
    });

    const fallbackNews = [
        { title: 'Campus Sustainability Initiative Wins Award', time: '2h ago', type: 'campus', source: 'Campus News' },
        { title: 'New Recycling Bins Installed Across Campus', time: '5h ago', type: 'update', source: 'Campus News' },
        { title: 'Student Recycling Rate Hits 85% This Month', time: '1d ago', type: 'achievement', source: 'Campus News' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#ecfdf5', '#d1fae5', '#ffffff']} style={styles.gradient}>
                {/* Floating orbs */}
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
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={['#059669']}
                            tintColor="#059669"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header with Level Progress */}
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
                                            { width: levelProgressWidth },
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={['#fbbf24', '#f59e0b']}
                                            style={styles.levelProgressGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
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

                    {/* Stats Cards */}
                    <View style={styles.statsGrid}>
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
                                <Text style={styles.statValue}>{stats.points.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Eco Points</Text>
                                <View style={styles.statTrend}>
                                    <Ionicons name="trending-up" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.trendText}>Level {stats.level}</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>

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
                                    <Ionicons name="leaf-outline" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.trendText}>Total recycled</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>

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
                                <Text style={styles.statValue}>{stats.co2Saved.toFixed(1)}</Text>
                                <Text style={styles.statLabel}>kg CO₂ Saved</Text>
                                <View style={styles.statTrend}>
                                    <Ionicons name="leaf" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.trendText}>Environmental impact</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>

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
                                <Text style={styles.statValue}>#{stats.rank || '8'}</Text>
                                <Text style={styles.statLabel}>Campus Rank</Text>
                                <View style={styles.statTrend}>
                                    <Ionicons name="flash" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.trendText}>{stats.weekStreak} day streak</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    </View>

                    {/* Live Environmental Data */}
                    <Animated.View
                        style={[
                            styles.environmentalSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f0f9ff']} style={styles.environmentalCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name={getWeatherIcon(weather.condition)} size={22} color="#3b82f6" />
                                <Text style={styles.sectionTitle}>🌍 Live Environmental Data</Text>
                                <Text style={styles.cityName}>{weather.city}</Text>
                            </View>

                            <View style={styles.environmentalGrid}>
                                <Animated.View style={[styles.envItem, { transform: [{ scale: growthPulse }] }]}>
                                    <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.envItemGradient}>
                                        <Ionicons name={getWeatherIcon(weather.condition)} size={24} color="white" />
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

                    {/* 📊 TRADITIONAL: Easy-to-Read Weekly Chart */}
                    <Animated.View
                        style={[
                            styles.chartSection,
                            { opacity: chartFade, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.chartCard}>
                            <WeeklyBarChart
                                labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
                                scans={[2, 5, 3, 8, 1, 4, 0]}
                                goals={[20, 20, 20, 20, 20, 20, 20]}
                                color="#059669"
                            />
                        </LinearGradient>
                    </Animated.View>

                    {/* Quick Actions */}
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

                    {/* Achievements */}
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

                                            {/* Progress Ring for locked achievements */}
                                            {!achievement.unlocked && achievement.progress && (
                                                <View style={styles.progressContainer}>
                                                    <ProgressRing
                                                        progress={achievement.progress}
                                                        size={36}
                                                        strokeWidth={3}
                                                        color="#f59e0b"
                                                        showPercentage={true}
                                                    />
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

                    {/* 📊 TRADITIONAL: Material Breakdown with Data Table */}
                    <Animated.View
                        style={[
                            styles.materialSection,
                            { opacity: chartFade, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.materialCard}>
                            <MaterialPie data={[
                                { name: 'Paper', count: 8, color: '#059669', percentage: 67 },
                                { name: 'Plastic', count: 2, color: '#3b82f6', percentage: 17 },
                                { name: 'Glass', count: 2, color: '#f59e0b', percentage: 17 }
                            ]} />
                        </LinearGradient>
                    </Animated.View>

                    {/* 📊 WEEKLY INSIGHTS CARDS */}
                    <Animated.View
                        style={[
                            styles.insightsSection,
                            { opacity: chartFade, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <Text style={styles.insightsTitle}>📈 Weekly Insights</Text>

                        <DataSummaryCard
                            title="Total Recycled"
                            value="23"
                            unit="items"
                            change={15}
                            changeLabel="vs last week"
                            icon="leaf"
                            color="#059669"
                            details={[
                                { label: 'Best day', value: 'Thursday (8 items)' },
                                { label: 'Avg per day', value: '3.3 items' },
                                { label: 'CO₂ saved', value: '2.8kg' }
                            ]}
                        />

                        <DataSummaryCard
                            title="Goal Achievement"
                            value="2"
                            unit="of 7 days"
                            change={-12}
                            changeLabel="vs last week"
                            icon="target"
                            color="#f59e0b"
                            details={[
                                { label: 'Success rate', value: '29%' },
                                { label: 'Days missed', value: '5 days' },
                                { label: 'Streak potential', value: '3 days max' }
                            ]}
                        />
                    </Animated.View>

                    {/* Environmental News */}
                    <Animated.View
                        style={[
                            styles.newsSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                        ]}
                    >
                        <LinearGradient colors={['#ffffff', '#f0fdf4']} style={styles.newsCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="newspaper" size={22} color="#059669" />
                                <Text style={styles.sectionTitle}>📰 Environmental News</Text>
                                <TouchableOpacity
                                    style={styles.refreshNewsButton}
                                    onPress={loadEnvironmentData}
                                    activeOpacity={0.7}
                                >
                                    <Animated.View style={{
                                        transform: [{
                                            rotate: isRefreshing ? '360deg' : '0deg'
                                        }]
                                    }}>
                                        <Ionicons name="refresh" size={16} color="#059669" />
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>

                            {(news.length > 0 ? news : fallbackNews).slice(0, 3).map((newsItem, index) => (
                                <Animated.View
                                    key={`news-${index}`}
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
                                    <View style={[styles.newsTypeIndicator, { backgroundColor: getNewsTypeColor(newsItem.type) }]} />
                                    <TouchableOpacity
                                        style={styles.newsContent}
                                        onPress={() => handleNewsPress(newsItem)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.newsTitle} numberOfLines={2}>
                                            {newsItem.title}
                                        </Text>
                                        <Text style={styles.newsTime}>
                                            {newsItem.source || 'Campus News'} • {newsItem.time}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.newsAction}
                                        activeOpacity={0.7}
                                        onPress={() => handleNewsPress(newsItem)}
                                    >
                                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}

                            <TouchableOpacity
                                style={styles.viewAllNewsButton}
                                activeOpacity={0.8}
                                onPress={() => {
                                    Alert.alert('Environmental News', 'Opening full environmental news feed...');
                                }}
                            >
                                <LinearGradient colors={['#059669', '#047857']} style={styles.viewAllNewsGradient}>
                                    <Text style={styles.viewAllNewsText}>View All Environmental News</Text>
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
                                    <Text style={styles.impactStatValue}>{stats.co2Saved.toFixed(1)}kg</Text>
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

    floatingOrb: {
        position: 'absolute',
        borderRadius: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    orb1: { width: 120, height: 120, backgroundColor: '#059669', top: '15%', right: -40 },
    orb2: { width: 160, height: 160, backgroundColor: '#f59e0b', top: '45%', left: -60 },
    orb3: { width: 100, height: 100, backgroundColor: '#3b82f6', bottom: '20%', right: -30 },

    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },

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
    headerGradient: { padding: 20 },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    welcomeSection: { flex: 1 },
    welcomeText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
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
    levelText: { color: 'white', fontSize: 14, fontWeight: '700' },

    levelProgressSection: { marginTop: 8 },
    levelProgressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    levelProgressText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    streakText: { fontSize: 11, color: '#fbbf24', fontWeight: '700' },
    levelProgressTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
        width: width - 80,
    },
    levelProgressBar: { height: 6, borderRadius: 3, position: 'relative' },
    levelProgressGradient: { flex: 1, borderRadius: 3 },
    progressShimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 3,
    },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
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
    statGradient: { padding: 18, alignItems: 'center', position: 'relative' },
    statIcon: { marginBottom: 10, position: 'relative' },
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
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600', textAlign: 'center' },
    statTrend: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
    trendText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

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
    cityName: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    environmentalGrid: { flexDirection: 'row', gap: 10 },
    envItem: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    envItemGradient: { padding: 12, alignItems: 'center', gap: 4 },
    envValue: { fontSize: 18, fontWeight: '800', color: 'white' },
    envLabel: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

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
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
    sectionTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1f2937' },

    quickActions: { marginBottom: 20 },
    quickActionsTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginBottom: 16 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
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
    actionGradient: { padding: 18, alignItems: 'center', gap: 8 },
    actionText: { color: 'white', fontSize: 14, fontWeight: '700' },
    actionSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },

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
    viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewAllText: { fontSize: 14, fontWeight: '600', color: '#f59e0b' },
    achievementsScroll: { marginTop: 8 },
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
    unlockedAchievement: { shadowColor: '#f59e0b', shadowOpacity: 0.4 },
    lockedAchievement: { shadowColor: '#9ca3af', shadowOpacity: 0.2 },
    achievementGradient: { padding: 16, alignItems: 'center', minHeight: 120 },
    achievementIcon: { position: 'relative', marginBottom: 8 },
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
    achievementName: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    achievementDesc: { fontSize: 10, textAlign: 'center', marginBottom: 8 },
    achievementDate: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        fontWeight: '500',
    },
    progressContainer: { alignItems: 'center', marginTop: 8 },

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

    insightsSection: {
        marginBottom: 20,
    },
    insightsTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 16,
    },

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
    newsTypeIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
    newsContent: { flex: 1 },
    newsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
        lineHeight: 18,
    },
    newsTime: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
    newsAction: { padding: 4 },
    viewAllNewsButton: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
    viewAllNewsGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    viewAllNewsText: { color: 'white', fontSize: 13, fontWeight: '600' },

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
    impactHeader: { alignItems: 'center', marginBottom: 20 },
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
    impactSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
    impactStats: { flexDirection: 'row', justifyContent: 'space-around' },
    impactStatItem: { alignItems: 'center', gap: 6 },
    impactStatValue: { fontSize: 18, fontWeight: '800', color: 'white' },
    impactStatLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        textAlign: 'center',
    },
});
