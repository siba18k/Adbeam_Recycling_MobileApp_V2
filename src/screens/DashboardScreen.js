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

// 📊 Import readable charts
import { WeeklyBarChart, MaterialPie, ProgressRing, DataSummaryCard } from '../components/charts/ReadableCharts';

import { useAuth } from '../context/AuthContext';
import { getUserStats } from '../services/database';
import { useUserAnalytics } from '../hooks/useUserAnalytics';
import { fetchOpenWeather, fetchEnvNews } from '../services/environment';
import { OPEN_WEATHER_API_KEY, ENV_NEWS_API_KEY } from '../config/apiKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// 🏆 ENHANCED: Better Achievement Descriptions
const PREVIEW_ACHIEVEMENTS = [
    { id: '1', name: 'First Steps', description: 'Welcome to eco-life! You scanned your very first recyclable item.', icon: 'leaf-outline', unlocked: true, date: '2025-10-15', progress: 1.0, rarity: 'common', points: 10 },
    { id: '2', name: 'Getting Started', description: 'Great momentum! You\'ve successfully scanned 5 different items.', icon: 'leaf', unlocked: true, date: '2025-10-16', progress: 1.0, rarity: 'common', points: 25 },
    { id: '3', name: 'Eco Apprentice', description: 'Impressive dedication! 25 items recycled shows real commitment.', icon: 'planet', unlocked: true, date: '2025-10-18', progress: 1.0, rarity: 'uncommon', points: 50 },
    { id: '4', name: 'Recycling Pro', description: 'Almost there! Just 6 more scans to unlock this prestigious badge.', icon: 'shield-checkmark', unlocked: false, progress: 0.89, rarity: 'rare', points: 100, current: 44, target: 50 },
    { id: '5', name: 'Eco Champion', description: 'The ultimate recycling master - 100 items and counting!', icon: 'trophy', unlocked: false, progress: 0.23, rarity: 'legendary', points: 250, current: 23, target: 100 },
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

    const [weather, setWeather] = useState({ temp: 12, condition: 'cloudy', humidity: 81, aqi: 44, city: 'Johannesburg' });
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
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.spring(slideUpAnim, { toValue: 0, friction: 5, tension: 45, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
            ]),
            Animated.timing(chartFade, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(levelProgressAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        ]).start();

        [ [orb1Float, 15, 4000], [orb2Float, 20, 5000], [orb3Float, 10, 4500] ].forEach(([anim, distance, duration]) => {
            Animated.loop(Animated.sequence([
                Animated.timing(anim, { toValue: distance, duration, useNativeDriver: true }),
                Animated.timing(anim, { toValue: -distance, duration, useNativeDriver: true }),
            ])).start();
        });

        [ [growthPulse, 1, 1.05, 2000], [pointsGlow, 0, 1, 2500], [orb1Scale, 1, 1.1, 3000], [orb2Scale, 1, 1.2, 3500], [achievementPulse, 1, 1.03, 2200] ].forEach(([anim, from, to, duration]) => {
            Animated.loop(Animated.sequence([
                Animated.timing(anim, { toValue: to, duration, useNativeDriver: true }),
                Animated.timing(anim, { toValue: from, duration, useNativeDriver: true }),
            ])).start();
        });

        Animated.timing(materialBarAnim, { toValue: 1, duration: 1500, useNativeDriver: false }).start();
        Animated.spring(achievementSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start();
        Animated.loop(Animated.sequence([
            Animated.timing(tiltAnim, { toValue: 1, duration: 5000, useNativeDriver: true }),
            Animated.timing(tiltAnim, { toValue: -1, duration: 5000, useNativeDriver: true }),
            Animated.timing(tiltAnim, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ])).start();
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
                try { const weatherData = JSON.parse(cachedWeather); if (Date.now() - weatherData.timestamp < 30 * 60 * 1000) { setWeather(weatherData.data); } } catch {}
            }
            if (cachedNews) {
                try { const newsData = JSON.parse(cachedNews); if (Date.now() - newsData.timestamp < 2 * 60 * 60 * 1000) { setNews(newsData.data); } } catch {}
            }
            const [weatherResult, newsResult] = await Promise.all([
                fetchOpenWeather(OPEN_WEATHER_API_KEY),
                fetchEnvNews(ENV_NEWS_API_KEY)
            ]);
            if (weatherResult.success && weatherResult.data) {
                setWeather(weatherResult.data);
                await AsyncStorage.setItem('cachedWeather', JSON.stringify({ data: weatherResult.data, timestamp: Date.now() }));
            }
            if (newsResult.success && newsResult.data && Array.isArray(newsResult.data)) {
                setNews(newsResult.data);
                await AsyncStorage.setItem('cachedNews', JSON.stringify({ data: newsResult.data, timestamp: Date.now() }));
            }
        } catch (error) {
            console.error('Error loading environment data:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([loadDashboardData(), loadEnvironmentData(), refreshAnalytics()]);
        setIsRefreshing(false);
    };

    const handleNewsPress = async (newsItem) => {
        if (newsItem.url) {
            try {
                const supported = await Linking.canOpenURL(newsItem.url);
                if (supported) { await Linking.openURL(newsItem.url); } else { Alert.alert('Error', 'Cannot open this news article'); }
            } catch (error) { Alert.alert('Error', 'Failed to open news article'); }
        }
    };

    const getNewsTypeColor = (type) => { switch (type) { case 'campus': return '#3b82f6'; case 'update': return '#059669'; case 'achievement': return '#f59e0b'; case 'environment': return '#10b981'; default: return '#6b7280'; } };
    const getWeatherIcon = (condition) => { switch (condition?.toLowerCase()) { case 'clear': case 'sunny': return 'sunny'; case 'clouds': case 'cloudy': return 'cloudy'; case 'rain': case 'rainy': return 'rainy'; case 'snow': return 'snow'; case 'thunderstorm': return 'thunderstorm'; default: return 'partly-sunny'; } };

    const getRarityColor = (rarity) => { switch (rarity) { case 'common': return { primary: '#059669', secondary: '#047857' }; case 'uncommon': return { primary: '#3b82f6', secondary: '#2563eb' }; case 'rare': return { primary: '#8b5cf6', secondary: '#7c3aed' }; case 'legendary': return { primary: '#f59e0b', secondary: '#d97706' }; default: return { primary: '#6b7280', secondary: '#4b5563' }; } };

    const glowIntensity = pointsGlow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
    const tiltRotation = tiltAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-5deg', '0deg', '5deg'] });
    const levelProgressWidth = levelProgressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(10, (width - 80) * stats.currentLevelProgress)] });
    const fallbackNews = [
        { title: 'Campus Sustainability Initiative Wins Award', time: '2h ago', type: 'campus', source: 'Campus News' },
        { title: 'New Recycling Bins Installed Across Campus', time: '5h ago', type: 'update', source: 'Campus News' },
        { title: 'Student Recycling Rate Hits 85% This Month', time: '1d ago', type: 'achievement', source: 'Campus News' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#ecfdf5', '#d1fae5', '#ffffff']} style={styles.gradient}>
                {/* Floating orbs */}
                <Animated.View style={[ styles.floatingOrb, styles.orb1, { transform: [{ translateY: orb1Float }, { scale: orb1Scale }], opacity: 0.1 } ]} />
                <Animated.View style={[ styles.floatingOrb, styles.orb2, { transform: [{ translateY: orb2Float }, { scale: orb2Scale }], opacity: 0.08 } ]} />
                <Animated.View style={[ styles.floatingOrb, styles.orb3, { transform: [{ translateY: orb3Float }, { scale: orb1Scale }], opacity: 0.12 } ]} />

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#059669']} tintColor="#059669" />} showsVerticalScrollIndicator={false}>
                    {/* ... header, stats, environmental, weekly chart, quick actions, community ... */}

                    {/* 🏆 Achievements section remains unchanged */}

                    {/* 📊 NEW: Analytics (Achievement-styled) */}
                    <Animated.View style={[ styles.analyticsSection, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] } ]}>
                        <LinearGradient colors={['#ffffff', '#eef2ff']} style={styles.analyticsCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="bar-chart" size={22} color="#3b82f6" />
                                <Text style={styles.sectionTitle}>📊 Analytics</Text>
                                <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.7} onPress={() => navigation.navigate('Analytics')}>
                                    <Text style={[styles.viewAllText, { color: '#3b82f6' }]}>View All</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                                </TouchableOpacity>
                            </View>

                            {/* KPI Chips */}
                            <View style={styles.analyticsKpiRow}>
                                <View style={[styles.analyticsKpi, { backgroundColor: '#ecfeff' }]}>
                                    <View style={[styles.analyticsKpiIcon, { backgroundColor: '#06b6d4' }]}>
                                        <Ionicons name="cloud" size={16} color="white" />
                                    </View>
                                    <Text style={styles.analyticsKpiValue}>{stats.co2Saved?.toFixed(1) || '0.0'} kg</Text>
                                    <Text style={styles.analyticsKpiLabel}>CO₂ Saved</Text>
                                </View>

                                <View style={[styles.analyticsKpi, { backgroundColor: '#eff6ff' }]}>
                                    <View style={[styles.analyticsKpiIcon, { backgroundColor: '#3b82f6' }]}>
                                        <Ionicons name="water" size={16} color="white" />
                                    </View>
                                    <Text style={styles.analyticsKpiValue}>{(stats.totalScans * 2.3).toFixed(0)} L</Text>
                                    <Text style={styles.analyticsKpiLabel}>Water Saved</Text>
                                </View>

                                <View style={[styles.analyticsKpi, { backgroundColor: '#fef3c7' }]}>
                                    <View style={[styles.analyticsKpiIcon, { backgroundColor: '#f59e0b' }]}>
                                        <Ionicons name="battery-charging" size={16} color="white" />
                                    </View>
                                    <Text style={styles.analyticsKpiValue}>{(stats.totalScans * 1.8).toFixed(0)} kWh</Text>
                                    <Text style={styles.analyticsKpiLabel}>Energy Saved</Text>
                                </View>
                            </View>

                            {/* Mini weekly + Goal */}
                            <View style={styles.analyticsBottomRow}>
                                <View style={styles.analyticsMiniChart}>
                                    <Text style={styles.analyticsMiniTitle}>This Week</Text>
                                    <View style={styles.analyticsBars}>
                                        {[2,5,3,8,1,4,0].map((v,i) => (
                                            <View key={`bar-${i}`} style={styles.analyticsBarCol}>
                                                <View style={styles.analyticsBarTrack}>
                                                    <View style={[styles.analyticsBarFill,{ height: Math.max(6, Math.min(100, v*12)), backgroundColor: '#059669' }]} />
                                                </View>
                                                <Text style={styles.analyticsBarLabel}>{['M','T','W','T','F','S','S'][i]}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.analyticsGoalCard}>
                                    <View style={styles.analyticsGoalHeader}>
                                        <Ionicons name="flag" size={16} color="#f59e0b" />
                                        <Text style={styles.analyticsGoalTitle}>Weekly Goal</Text>
                                    </View>
                                    <View style={styles.analyticsGoalBody}>
                                        <View style={styles.analyticsRing}>
                                            <View style={styles.analyticsRingOuter}>
                                                <View style={[styles.analyticsRingInner,{ transform:[{ scale: 0.68 }] }]} />
                                                <View style={styles.analyticsRingArc} />
                                            </View>
                                        </View>
                                        <View style={styles.analyticsGoalInfo}>
                                            <Text style={styles.analyticsGoalValue}>{Math.min(stats.totalScans || 0, 50)}/50</Text>
                                            <Text style={styles.analyticsGoalSubtitle}>items this week</Text>
                                            <View style={styles.analyticsPill}>
                                                <Ionicons name="trending-up" size={12} color="#fff" />
                                                <Text style={styles.analyticsPillText}>Keep it up!</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* ... material breakdown, insights, news, impact ... */}
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ... keep existing styles ...

    // Analytics (Achievement-styled)
    analyticsSection: { marginBottom: 20 },
    analyticsCard: { borderRadius: 20, padding: 20, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
    analyticsKpiRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 },
    analyticsKpi: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', justifyContent: 'center' },
    analyticsKpiIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    analyticsKpiValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
    analyticsKpiLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
    analyticsBottomRow: { flexDirection: 'row', gap: 12 },
    analyticsMiniChart: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 14, padding: 12 },
    analyticsMiniTitle: { fontSize: 12, color: '#374151', fontWeight: '700', marginBottom: 8 },
    analyticsBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    analyticsBarCol: { alignItems: 'center', gap: 6 },
    analyticsBarTrack: { width: 14, height: 100, borderRadius: 8, backgroundColor: '#e5e7eb', overflow: 'hidden', justifyContent: 'flex-end' },
    analyticsBarFill: { width: '100%', borderRadius: 8 },
    analyticsBarLabel: { fontSize: 9, color: '#6b7280', fontWeight: '600' },
    analyticsGoalCard: { width: 160, backgroundColor: '#fff7ed', borderRadius: 14, padding: 12, justifyContent: 'space-between' },
    analyticsGoalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    analyticsGoalTitle: { fontSize: 12, fontWeight: '800', color: '#92400e' },
    analyticsGoalBody: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    analyticsRing: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
    analyticsRingOuter: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fed7aa', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    analyticsRingInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff7ed' },
    analyticsRingArc: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 27, borderRightWidth: 6, borderTopWidth: 6, borderColor: '#f59e0b', transform: [{ rotate: '225deg' }] },
    analyticsGoalInfo: { flex: 1 },
    analyticsGoalValue: { fontSize: 16, fontWeight: '900', color: '#7c2d12' },
    analyticsGoalSubtitle: { fontSize: 11, color: '#9a3412', fontWeight: '600', marginTop: 2 },
    analyticsPill: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    analyticsPillText: { color: 'white', fontSize: 11, fontWeight: '700' },
});
