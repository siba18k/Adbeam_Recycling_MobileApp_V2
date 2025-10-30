import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getUserAchievements, getUserScans, addTestPoints, resetUserPoints } from '../services/database';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const { user, userProfile, refreshUserProfile } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const statsAnimations = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    // Floating background animations
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(headerScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Staggered stats animations
        Animated.stagger(
            100,
            statsAnimations.map((anim) =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                })
            )
        ).start();

        // Floating background animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: -20,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, {
                    toValue: -15,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 20000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const loadDashboardData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            const statsResult = await getUserStats(user.uid);
            if (statsResult.success) {
                setStats(statsResult.data);
                const userAchievements = getUserAchievements(statsResult.data.achievements);
                setAchievements(userAchievements);
            }

            const scansResult = await getUserScans(user.uid, 5);
            if (scansResult.success) {
                setRecentScans(scansResult.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadDashboardData();
        await refreshUserProfile();
        setIsRefreshing(false);
    };

    const addPoints = async (pointsToAdd) => {
        try {
            const result = await addTestPoints(user.uid, pointsToAdd);
            if (result.success) {
                Alert.alert(
                    'Points Added! 🎉',
                    `Added ${result.pointsAdded} points!\nTotal Points: ${result.newPoints}\nLevel: ${result.newLevel}`,
                    [{ text: 'OK' }]
                );
                await loadDashboardData();
            } else {
                Alert.alert('Error', result.error || 'Failed to add points');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add points: ' + error.message);
        }
    };

    const getNextLevelProgress = () => {
        if (!userProfile) return 0;
        const currentLevelPoints = (userProfile.level - 1) * 100;
        const nextLevelPoints = userProfile.level * 100;
        const progress = (userProfile.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints);
        return Math.min(Math.max(progress, 0), 1);
    };

    const getMaterialIcon = (materialType) => {
        const type = materialType.toLowerCase();
        if (type.includes('plastic')) return 'water-outline';
        if (type.includes('glass')) return 'wine-outline';
        if (type.includes('aluminum') || type.includes('can')) return 'nutrition-outline';
        if (type.includes('paper')) return 'newspaper-outline';
        return 'leaf-outline';
    };

    const getMaterialColor = (materialType) => {
        const type = materialType.toLowerCase();
        if (type.includes('plastic')) return '#3b82f6';
        if (type.includes('glass')) return '#10b981';
        if (type.includes('metal') || type.includes('aluminum')) return '#f59e0b';
        if (type.includes('paper')) return '#8b5cf6';
        return '#27ae60';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={['#f0fdf4', '#dcfce7', '#bbf7d0']} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <Ionicons name="leaf" size={60} color="#27ae60" />
                        <Text style={styles.loadingText}>Loading your eco-journey...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#f0fdf4', '#dcfce7', '#ffffff']} style={styles.gradient}>
                {/* Floating Background Decorations */}
                <Animated.View
                    style={[
                        styles.floatingCircle,
                        styles.circle1,
                        { transform: [{ translateY: float1 }, { rotate: spin }] },
                    ]}
                />
                <Animated.View
                    style={[styles.floatingCircle, styles.circle2, { transform: [{ translateY: float2 }] }]}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Card */}
                    <Animated.View
                        style={[
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: headerScale }] },
                        ]}
                    >
                        <LinearGradient
                            colors={['#27ae60', '#229954', '#1e8449']}
                            style={styles.headerCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.headerContent}>
                                <View style={styles.headerInfo}>
                                    <Text style={styles.welcomeText}>Welcome back,</Text>
                                    <Text style={styles.nameText}>
                                        {userProfile?.displayName || user?.displayName || 'Eco Warrior'}
                                    </Text>
                                    <View style={styles.levelBadge}>
                                        <Ionicons name="trophy" size={14} color="#fff" />
                                        <Text style={styles.levelText}>Level {userProfile?.level || 1} Recycler</Text>
                                    </View>
                                </View>

                                <View style={styles.avatarContainer}>
                                    <LinearGradient
                                        colors={['#fff', '#f0fdf4']}
                                        style={styles.avatar}
                                    >
                                        <Text style={styles.avatarText}>
                                            {(userProfile?.displayName || 'E').charAt(0).toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                    <View style={styles.avatarBadge}>
                                        <Text style={styles.avatarBadgeText}>{userProfile?.level || 1}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Level Progress */}
                            <View style={styles.progressContainer}>
                                <View style={styles.progressInfo}>
                                    <Text style={styles.progressLabel}>Level Progress</Text>
                                    <Text style={styles.progressPoints}>
                                        {userProfile?.points || 0} / {(userProfile?.level || 1) * 100}
                                    </Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <Animated.View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${getNextLevelProgress() * 100}%` },
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={['#fbbf24', '#f59e0b']}
                                            style={styles.progressGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
                                    </Animated.View>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        {[
                            { icon: 'leaf', value: stats?.totalScans || userProfile?.totalScans || 0, label: 'Items Recycled', colors: ['#27ae60', '#229954'] },
                            { icon: 'star', value: userProfile?.points || 0, label: 'Total Points', colors: ['#3b82f6', '#2563eb'] },
                            { icon: 'trending-up', value: stats?.scansThisWeek || 0, label: 'This Week', colors: ['#8b5cf6', '#7c3aed'] },
                            { icon: 'trophy', value: achievements.length, label: 'Achievements', colors: ['#f59e0b', '#d97706'] },
                        ].map((stat, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.statCard,
                                    {
                                        opacity: statsAnimations[index],
                                        transform: [
                                            {
                                                translateY: statsAnimations[index].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [20, 0],
                                                }),
                                            },
                                            { scale: statsAnimations[index] },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={stat.colors} style={styles.statGradient}>
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name={stat.icon} size={24} color="white" />
                                    </View>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </LinearGradient>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Material Breakdown */}
                    {stats?.materialBreakdown && (
                        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Material Breakdown</Text>
                                <Ionicons name="analytics-outline" size={20} color="#6b7280" />
                            </View>

                            <View style={styles.materialGrid}>
                                {Object.entries(stats.materialBreakdown).map(([material, count]) => (
                                    <TouchableOpacity key={material} style={styles.materialItem} activeOpacity={0.7}>
                                        <LinearGradient
                                            colors={[getMaterialColor(material), getMaterialColor(material) + 'dd']}
                                            style={styles.materialIcon}
                                        >
                                            <Ionicons name={getMaterialIcon(material)} size={20} color="white" />
                                        </LinearGradient>
                                        <Text style={styles.materialLabel}>
                                            {material.charAt(0).toUpperCase() + material.slice(1)}
                                        </Text>
                                        <Text style={styles.materialCount}>{count}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Recent Activity */}
                    {recentScans.length > 0 && (
                        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Recent Activity</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Scanner')}>
                                    <Text style={styles.viewAllText}>Scan More →</Text>
                                </TouchableOpacity>
                            </View>

                            {recentScans.map((scan, index) => (
                                <View key={index} style={styles.activityItem}>
                                    <LinearGradient
                                        colors={[getMaterialColor(scan.materialType), getMaterialColor(scan.materialType) + 'dd']}
                                        style={styles.activityIcon}
                                    >
                                        <Ionicons name={getMaterialIcon(scan.materialType)} size={18} color="white" />
                                    </LinearGradient>
                                    <View style={styles.activityInfo}>
                                        <Text style={styles.activityTitle}>{scan.materialType}</Text>
                                        <Text style={styles.activityTime}>
                                            {new Date(scan.timestamp).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.pointsBadge}>
                                        <Text style={styles.activityPoints}>+{scan.points}</Text>
                                    </View>
                                </View>
                            ))}
                        </Animated.View>
                    )}

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Scanner')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#27ae60', '#229954']} style={styles.actionGradient}>
                                <Ionicons name="scan" size={28} color="white" />
                                <Text style={styles.actionText}>Scan Item</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Rewards')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionGradient}>
                                <Ionicons name="gift" size={28} color="white" />
                                <Text style={styles.actionText}>Rewards</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Development Tools */}
                    {__DEV__ && (
                        <View style={styles.devTools}>
                            <TouchableOpacity style={styles.devButton} onPress={addTestPointsHandler}>
                                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.devGradient}>
                                    <Ionicons name="add-circle" size={20} color="white" />
                                    <Text style={styles.devText}>Add Points</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.devButton} onPress={handleResetPoints}>
                                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.devGradient}>
                                    <Ionicons name="refresh" size={20} color="white" />
                                    <Text style={styles.devText}>Reset</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );

    async function addTestPointsHandler() {
        Alert.alert('Add Test Points', 'How many points would you like to add?', [
            { text: 'Cancel', style: 'cancel' },
            { text: '+500', onPress: () => addPoints(500) },
            { text: '+1000', onPress: () => addPoints(1000) },
            { text: '+2000', onPress: () => addPoints(2000) },
        ]);
    }

    async function handleResetPoints() {
        Alert.alert('Reset Points', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    const result = await resetUserPoints(user.uid);
                    if (result.success) {
                        Alert.alert('Success', 'Points reset');
                        await loadDashboardData();
                    }
                },
            },
        ]);
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    floatingCircle: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.1,
        backgroundColor: '#27ae60',
    },
    circle1: {
        width: 150,
        height: 150,
        top: 100,
        right: -50,
    },
    circle2: {
        width: 120,
        height: 120,
        bottom: 200,
        left: -40,
    },
    loadingContainer: {
        flex: 1,
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    headerCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerInfo: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    nameText: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    levelText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '600',
        marginLeft: 4,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#27ae60',
    },
    avatarBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#fbbf24',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    avatarBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
    },
    progressContainer: {
        marginTop: 8,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    progressPoints: {
        fontSize: 13,
        color: 'white',
        fontWeight: '700',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
    },
    progressGradient: {
        flex: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        width: (width - 44) / 2,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    statGradient: {
        padding: 20,
        alignItems: 'center',
    },
    statIconContainer: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        fontWeight: '600',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    viewAllText: {
        fontSize: 14,
        color: '#27ae60',
        fontWeight: '600',
    },
    materialGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 12,
    },
    materialItem: {
        alignItems: 'center',
        width: (width - 80) / 4,
    },
    materialIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    materialLabel: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '600',
        textAlign: 'center',
    },
    materialCount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 4,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    activityTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    pointsBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    activityPoints: {
        fontSize: 14,
        fontWeight: '700',
        color: '#27ae60',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    actionGradient: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginTop: 8,
    },
    devTools: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    devButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    devGradient: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    devText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
});
