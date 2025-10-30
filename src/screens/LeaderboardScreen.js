import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    SafeAreaView,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/database';

export default function LeaderboardScreen() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userRank, setUserRank] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const podiumAnimations = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animations
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

        // Staggered podium animations
        Animated.stagger(
            150,
            podiumAnimations.map((anim) =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                })
            )
        ).start();

        // Floating backgrounds
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

    const loadLeaderboard = async () => {
        try {
            setIsLoading(true);
            const result = await getLeaderboard(100);

            if (result.success) {
                setLeaderboard(result.data);
                const userIndex = result.data.findIndex((u) => u.id === user?.uid);
                if (userIndex !== -1) {
                    setUserRank(userIndex + 1);
                }
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadLeaderboard();
        setIsRefreshing(false);
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1:
                return '#FFD700';
            case 2:
                return '#C0C0C0';
            case 3:
                return '#CD7F32';
            default:
                return '#6b7280';
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return 'trophy';
            case 2:
                return 'medal';
            case 3:
                return 'medal';
            default:
                return null;
        }
    };

    const formatPoints = (points) => {
        if (points >= 1000) {
            return `${(points / 1000).toFixed(1)}k`;
        }
        return points.toString();
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={['#fef3c7', '#fde68a', '#fcd34d']} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#f59e0b" />
                        <Text style={styles.loadingText}>Loading leaderboard...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fef3c7', '#fde68a', '#ffffff']} style={styles.gradient}>
                {/* Floating circles */}
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

                {/* Header */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: headerScale }] }}>
                    <LinearGradient colors={['#f59e0b', '#d97706', '#b45309']} style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Eco Leaderboard</Text>
                            <View style={styles.rankBadge}>
                                <Ionicons name="trophy" size={16} color="white" />
                                <Text style={styles.headerSubtitle}>
                                    {userRank ? `Rank #${userRank}` : 'Not Ranked Yet'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.headerIconContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                style={styles.headerIcon}
                            >
                                <Ionicons name="podium" size={32} color="white" />
                            </LinearGradient>
                        </View>
                    </LinearGradient>
                </Animated.View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Top 3 Podium */}
                    {leaderboard.length >= 3 && (
                        <View style={styles.podium}>
                            {/* 2nd Place */}
                            <Animated.View
                                style={[
                                    styles.podiumPosition,
                                    {
                                        opacity: podiumAnimations[1],
                                        transform: [
                                            {
                                                translateY: podiumAnimations[1].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [30, 0],
                                                }),
                                            },
                                            { scale: podiumAnimations[1] },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#E8E8E8', '#C0C0C0']} style={[styles.podiumPlace, styles.secondPlace]}>
                                    <View style={styles.crownContainer}>
                                        <Ionicons name="medal" size={24} color="#C0C0C0" />
                                    </View>
                                    <View style={styles.podiumAvatar}>
                                        <LinearGradient
                                            colors={['#ffffff', '#f3f4f6']}
                                            style={styles.avatarCircle}
                                        >
                                            <Text style={styles.avatarText}>
                                                {(leaderboard[1]?.displayName || 'U').charAt(0).toUpperCase()}
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {leaderboard[1]?.displayName || 'User'}
                                    </Text>
                                    <View style={styles.podiumPointsBadge}>
                                        <Ionicons name="star" size={12} color="white" />
                                        <Text style={styles.podiumPoints}>{formatPoints(leaderboard[1]?.points || 0)}</Text>
                                    </View>
                                    <View style={[styles.podiumRank, { backgroundColor: '#C0C0C0' }]}>
                                        <Text style={styles.podiumRankText}>2</Text>
                                    </View>
                                </LinearGradient>
                            </Animated.View>

                            {/* 1st Place */}
                            <Animated.View
                                style={[
                                    styles.podiumPosition,
                                    {
                                        opacity: podiumAnimations[0],
                                        transform: [
                                            {
                                                translateY: podiumAnimations[0].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [30, 0],
                                                }),
                                            },
                                            { scale: podiumAnimations[0] },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#FFD700', '#FFA500']} style={[styles.podiumPlace, styles.firstPlace]}>
                                    <View style={styles.crownContainer}>
                                        <Ionicons name="crown" size={32} color="#FFD700" />
                                    </View>
                                    <View style={styles.podiumAvatar}>
                                        <LinearGradient
                                            colors={['#ffffff', '#fef3c7']}
                                            style={styles.avatarCircle}
                                        >
                                            <Text style={[styles.avatarText, { fontSize: 24 }]}>
                                                {(leaderboard[0]?.displayName || 'U').charAt(0).toUpperCase()}
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {leaderboard[0]?.displayName || 'User'}
                                    </Text>
                                    <View style={styles.podiumPointsBadge}>
                                        <Ionicons name="star" size={14} color="white" />
                                        <Text style={styles.podiumPoints}>{formatPoints(leaderboard[0]?.points || 0)}</Text>
                                    </View>
                                    <View style={[styles.podiumRank, { backgroundColor: '#FFD700' }]}>
                                        <Ionicons name="trophy" size={16} color="white" />
                                    </View>
                                </LinearGradient>
                            </Animated.View>

                            {/* 3rd Place */}
                            <Animated.View
                                style={[
                                    styles.podiumPosition,
                                    {
                                        opacity: podiumAnimations[2],
                                        transform: [
                                            {
                                                translateY: podiumAnimations[2].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [30, 0],
                                                }),
                                            },
                                            { scale: podiumAnimations[2] },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#D4A574', '#CD7F32']} style={[styles.podiumPlace, styles.thirdPlace]}>
                                    <View style={styles.crownContainer}>
                                        <Ionicons name="medal" size={24} color="#CD7F32" />
                                    </View>
                                    <View style={styles.podiumAvatar}>
                                        <LinearGradient
                                            colors={['#ffffff', '#f3f4f6']}
                                            style={styles.avatarCircle}
                                        >
                                            <Text style={styles.avatarText}>
                                                {(leaderboard[2]?.displayName || 'U').charAt(0).toUpperCase()}
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {leaderboard[2]?.displayName || 'User'}
                                    </Text>
                                    <View style={styles.podiumPointsBadge}>
                                        <Ionicons name="star" size={12} color="white" />
                                        <Text style={styles.podiumPoints}>{formatPoints(leaderboard[2]?.points || 0)}</Text>
                                    </View>
                                    <View style={[styles.podiumRank, { backgroundColor: '#CD7F32' }]}>
                                        <Text style={styles.podiumRankText}>3</Text>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        </View>
                    )}

                    {/* Full Leaderboard */}
                    <Animated.View style={[styles.leaderboardCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.cardGradient}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Full Rankings</Text>
                                <View style={styles.totalBadge}>
                                    <Ionicons name="people" size={14} color="#6b7280" />
                                    <Text style={styles.totalUsers}>{leaderboard.length} Recyclers</Text>
                                </View>
                            </View>

                            {leaderboard.map((userItem, index) => {
                                const rank = index + 1;
                                const isCurrentUser = userItem.id === user?.uid;

                                return (
                                    <View
                                        key={userItem.id}
                                        style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}
                                    >
                                        <View style={styles.rankContainer}>
                                            {getRankIcon(rank) ? (
                                                <Ionicons name={getRankIcon(rank)} size={24} color={getRankColor(rank)} />
                                            ) : (
                                                <Text style={[styles.rankText, { color: getRankColor(rank) }]}>#{rank}</Text>
                                            )}
                                        </View>

                                        <View style={styles.userAvatarContainer}>
                                            <LinearGradient
                                                colors={isCurrentUser ? ['#f59e0b', '#d97706'] : ['#3b82f6', '#2563eb']}
                                                style={styles.userAvatar}
                                            >
                                                <Text style={styles.userAvatarText}>
                                                    {(userItem.displayName || 'U').charAt(0).toUpperCase()}
                                                </Text>
                                            </LinearGradient>
                                        </View>

                                        <View style={styles.userInfo}>
                                            <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                                                {userItem.displayName || 'User'}
                                                {isCurrentUser && ' (You)'}
                                            </Text>
                                            <View style={styles.userStatsRow}>
                                                <View style={styles.statBadge}>
                                                    <Ionicons name="bar-chart" size={10} color="#6b7280" />
                                                    <Text style={styles.userStats}>Lvl {userItem.level || 1}</Text>
                                                </View>
                                                <View style={styles.statBadge}>
                                                    <Ionicons name="leaf" size={10} color="#6b7280" />
                                                    <Text style={styles.userStats}>{userItem.totalScans || 0} items</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.pointsBadge}>
                                            <Ionicons name="star" size={12} color="white" />
                                            <Text style={styles.pointsText}>{formatPoints(userItem.points || 0)}</Text>
                                        </LinearGradient>
                                    </View>
                                );
                            })}
                        </LinearGradient>
                    </Animated.View>

                    {/* Encouragement Card */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <LinearGradient colors={['#27ae60', '#229954']} style={styles.encouragementCard}>
                            <View style={styles.encouragementIconCircle}>
                                <Ionicons name="leaf" size={32} color="white" />
                            </View>
                            <Text style={styles.encouragementTitle}>Keep Making a Difference!</Text>
                            <Text style={styles.encouragementText}>
                                Every item you recycle helps create a cleaner, greener campus for everyone.
                            </Text>
                        </LinearGradient>
                    </Animated.View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
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
        backgroundColor: '#f59e0b',
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
        color: '#92400e',
        fontWeight: '500',
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'white',
        fontWeight: '700',
        marginLeft: 6,
    },
    headerIconContainer: {
        marginLeft: 16,
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    podiumPosition: {
        flex: 1,
        alignItems: 'center',
    },
    podiumPlace: {
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        width: '95%',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    firstPlace: {
        height: 160,
        marginHorizontal: 4,
    },
    secondPlace: {
        height: 140,
        marginRight: 2,
    },
    thirdPlace: {
        height: 140,
        marginLeft: 2,
    },
    crownContainer: {
        position: 'absolute',
        top: -16,
    },
    podiumAvatar: {
        marginTop: 12,
        marginBottom: 8,
    },
    avatarCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    podiumName: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 8,
    },
    podiumPointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    podiumPoints: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 4,
    },
    podiumRank: {
        position: 'absolute',
        top: 8,
        right: 8,
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    podiumRankText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    leaderboardCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 16,
    },
    cardGradient: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#f3f4f6',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    totalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    totalUsers: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
        marginLeft: 4,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    currentUserItem: {
        backgroundColor: '#fef3c7',
        marginHorizontal: -12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderBottomColor: 'transparent',
    },
    rankContainer: {
        width: 44,
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 15,
        fontWeight: '700',
    },
    userAvatarContainer: {
        marginRight: 12,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    currentUserName: {
        color: '#f59e0b',
    },
    userStatsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 3,
    },
    userStats: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '600',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    pointsText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 4,
    },
    encouragementCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    encouragementIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    encouragementTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
    },
    encouragementText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        lineHeight: 20,
    },
});
