import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    SafeAreaView,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/database';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userRank, setUserRank] = useState(null);

    // Enhanced Animations with more visible effects
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current; // Increased from 30
    const headerScale = useRef(new Animated.Value(0.8)).current; // More dramatic scale
    const podiumAnimations = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    // Enhanced entrance sparkle effect
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // More dramatic entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800, // Slower for more visibility
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(headerScale, {
                toValue: 1,
                friction: 6, // More bouncy
                tension: 50,
                useNativeDriver: true,
            }),
        ]).start();

        // Enhanced staggered podium animations
        Animated.stagger(
            200, // Slower stagger for visibility
            podiumAnimations.map((anim) =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                })
            )
        ).start();

        // More dramatic floating backgrounds
        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: -30, // Increased movement
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, {
                    toValue: -25,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 0,
                    duration: 3500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 15000, // Faster rotation
                useNativeDriver: true,
            })
        ).start();

        // Sparkle effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(sparkleAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(sparkleAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Bounce effect for trophy
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const sparkleScale = sparkleAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.3, 1],
    });

    const bounceTransform = bounceAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -10, 0],
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
                return '#E6E6FA';
            case 3:
                return '#DEB887';
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
                <LinearGradient colors={['#FF6B6B', '#FF8E53', '#FFD93D']} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#FF6B6B" />
                        <Text style={styles.loadingText}>Loading leaderboard...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#FF6B6B', '#FF8E53', '#FFD93D', '#74E291']} style={styles.gradient}>
                {/* Enhanced Floating circles with more vibrant colors */}
                <Animated.View
                    style={[
                        styles.floatingCircle,
                        styles.circle1,
                        {
                            backgroundColor: '#FF4081',
                            opacity: 0.25, // More visible
                            transform: [{ translateY: float1 }, { rotate: spin }, { scale: sparkleScale }]
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.floatingCircle,
                        styles.circle2,
                        {
                            backgroundColor: '#7C4DFF',
                            opacity: 0.25,
                            transform: [{ translateY: float2 }, { scale: sparkleAnim }]
                        }
                    ]}
                />
                <Animated.View
                    style={[
                        styles.floatingCircle,
                        styles.circle3,
                        {
                            backgroundColor: '#00E676',
                            opacity: 0.25,
                            transform: [{ translateY: float1 }, { rotate: spin }]
                        }
                    ]}
                />

                {/* Enhanced Header with more dramatic animation */}
                <Animated.View style={{
                    opacity: fadeAnim,
                    transform: [
                        { scale: headerScale },
                        { translateY: bounceTransform }
                    ]
                }}>
                    <LinearGradient colors={['#FF6B6B', '#FF4081', '#E91E63']} style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>🏆 Eco Champions</Text>
                            <View style={styles.rankBadge}>
                                <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
                                    <Ionicons name="star" size={18} color="#FFD93D" />
                                </Animated.View>
                                <Text style={styles.headerSubtitle}>
                                    {userRank ? `Rank #${userRank}` : 'Join the Rankings!'}
                                </Text>
                            </View>
                        </View>
                        <Animated.View
                            style={[
                                styles.headerIconContainer,
                                { transform: [{ rotate: spin }, { scale: sparkleScale }] }
                            ]}
                        >
                            <LinearGradient
                                colors={['rgba(255,215,0,0.8)', 'rgba(255,193,7,0.6)']}
                                style={styles.headerIcon}
                            >
                                <Ionicons name="trophy" size={36} color="#FFF" />
                            </LinearGradient>
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Enhanced Top 3 Podium with more dramatic effects */}
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
                                                    outputRange: [50, 0], // More dramatic slide
                                                }),
                                            },
                                            {
                                                scale: podiumAnimations[1].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.5, 1], // More dramatic scale
                                                })
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#E6E6FA', '#C0C0C0', '#B8860B']} style={[styles.podiumPlace, styles.secondPlace]}>
                                    <Animated.View style={[styles.crownContainer, { transform: [{ scale: sparkleScale }] }]}>
                                        <Ionicons name="medal" size={28} color="#C0C0C0" />
                                    </Animated.View>
                                    <View style={styles.podiumAvatar}>
                                        <LinearGradient
                                            colors={['#ffffff', '#E8EAF6']}
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
                                        <Ionicons name="star" size={14} color="#FFD93D" />
                                        <Text style={styles.podiumPoints}>{formatPoints(leaderboard[1]?.points || 0)}</Text>
                                    </View>
                                    <View style={[styles.podiumRank, { backgroundColor: '#C0C0C0' }]}>
                                        <Text style={styles.podiumRankText}>2</Text>
                                    </View>
                                </LinearGradient>
                            </Animated.View>

                            {/* 1st Place - Most dramatic */}
                            <Animated.View
                                style={[
                                    styles.podiumPosition,
                                    {
                                        opacity: podiumAnimations[0],
                                        transform: [
                                            {
                                                translateY: podiumAnimations[0].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [60, 0],
                                                }),
                                            },
                                            {
                                                scale: podiumAnimations[0].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.3, 1],
                                                })
                                            },
                                            { translateY: bounceTransform },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={[styles.podiumPlace, styles.firstPlace]}>
                                    <Animated.View style={[styles.crownContainer, { transform: [{ scale: sparkleScale }, { rotate: spin }] }]}>
                                        <Ionicons name="crown" size={36} color="#FFD700" />
                                        {/* Sparkle effects */}
                                        <Animated.View style={[styles.sparkle, styles.sparkle1, { opacity: sparkleAnim }]}>
                                            <Ionicons name="sparkles" size={12} color="#FFD93D" />
                                        </Animated.View>
                                        <Animated.View style={[styles.sparkle, styles.sparkle2, { opacity: sparkleAnim }]}>
                                            <Ionicons name="sparkles" size={10} color="#FFF" />
                                        </Animated.View>
                                    </Animated.View>
                                    <View style={styles.podiumAvatar}>
                                        <LinearGradient
                                            colors={['#ffffff', '#FFF3C4']}
                                            style={[styles.avatarCircle, styles.firstPlaceAvatar]}
                                        >
                                            <Text style={[styles.avatarText, { fontSize: 26, color: '#FF6B00' }]}>
                                                {(leaderboard[0]?.displayName || 'U').charAt(0).toUpperCase()}
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {leaderboard[0]?.displayName || 'Champion'}
                                    </Text>
                                    <View style={styles.podiumPointsBadge}>
                                        <Ionicons name="star" size={16} color="#FFD93D" />
                                        <Text style={[styles.podiumPoints, { fontSize: 15 }]}>
                                            {formatPoints(leaderboard[0]?.points || 0)}
                                        </Text>
                                    </View>
                                    <Animated.View style={[styles.podiumRank, { backgroundColor: '#FFD700', transform: [{ scale: sparkleScale }] }]}>
                                        <Ionicons name="trophy" size={18} color="white" />
                                    </Animated.View>
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
                                                    outputRange: [50, 0],
                                                }),
                                            },
                                            {
                                                scale: podiumAnimations[2].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.5, 1],
                                                })
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#DEB887', '#CD853F', '#A0522D']} style={[styles.podiumPlace, styles.thirdPlace]}>
                                    <Animated.View style={[styles.crownContainer, { transform: [{ scale: sparkleScale }] }]}>
                                        <Ionicons name="medal" size={28} color="#CD853F" />
                                    </Animated.View>
                                    <View style={styles.podiumAvatar}>
                                        <LinearGradient
                                            colors={['#ffffff', '#F5E6D3']}
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
                                        <Ionicons name="star" size={14} color="#FFD93D" />
                                        <Text style={styles.podiumPoints}>{formatPoints(leaderboard[2]?.points || 0)}</Text>
                                    </View>
                                    <View style={[styles.podiumRank, { backgroundColor: '#CD853F' }]}>
                                        <Text style={styles.podiumRankText}>3</Text>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        </View>
                    )}

                    {/* Enhanced Full Leaderboard */}
                    <Animated.View style={[styles.leaderboardCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <LinearGradient colors={['#ffffff', '#f8fafc', '#e2e8f0']} style={styles.cardGradient}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>🏅 Full Rankings</Text>
                                <View style={styles.totalBadge}>
                                    <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.totalBadgeGradient}>
                                        <Ionicons name="people" size={16} color="white" />
                                        <Text style={styles.totalUsers}>{leaderboard.length} Eco Warriors</Text>
                                    </LinearGradient>
                                </View>
                            </View>

                            {leaderboard.map((userItem, index) => {
                                const rank = index + 1;
                                const isCurrentUser = userItem.id === user?.uid;

                                return (
                                    <Animated.View
                                        key={userItem.id}
                                        style={[
                                            styles.leaderboardItem,
                                            isCurrentUser && styles.currentUserItem,
                                            {
                                                opacity: fadeAnim,
                                                transform: [
                                                    {
                                                        translateX: fadeAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [index % 2 === 0 ? -30 : 30, 0],
                                                        }),
                                                    },
                                                ],
                                            }
                                        ]}
                                    >
                                        <View style={styles.rankContainer}>
                                            {getRankIcon(rank) ? (
                                                <Animated.View style={{ transform: [{ scale: rank <= 3 ? sparkleScale : 1 }] }}>
                                                    <Ionicons name={getRankIcon(rank)} size={26} color={getRankColor(rank)} />
                                                </Animated.View>
                                            ) : (
                                                <Text style={[styles.rankText, { color: getRankColor(rank) }]}>#{rank}</Text>
                                            )}
                                        </View>

                                        <View style={styles.userAvatarContainer}>
                                            <LinearGradient
                                                colors={isCurrentUser ? ['#FF6B35', '#F7931E'] : ['#667EEA', '#764BA2']}
                                                style={styles.userAvatar}
                                            >
                                                <Text style={styles.userAvatarText}>
                                                    {(userItem.displayName || 'U').charAt(0).toUpperCase()}
                                                </Text>
                                            </LinearGradient>
                                            {isCurrentUser && (
                                                <Animated.View
                                                    style={[
                                                        styles.currentUserGlow,
                                                        { opacity: sparkleAnim }
                                                    ]}
                                                />
                                            )}
                                        </View>

                                        <View style={styles.userInfo}>
                                            <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                                                {userItem.displayName || 'User'}
                                                {isCurrentUser && ' 🌟 (You)'}
                                            </Text>
                                            <View style={styles.userStatsRow}>
                                                <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.statBadge}>
                                                    <Ionicons name="bar-chart" size={10} color="white" />
                                                    <Text style={styles.userStatsWhite}>Lvl {userItem.level || 1}</Text>
                                                </LinearGradient>
                                                <LinearGradient colors={['#A8E6CF', '#7FCDCD']} style={styles.statBadge}>
                                                    <Ionicons name="leaf" size={10} color="white" />
                                                    <Text style={styles.userStatsWhite}>{userItem.totalScans || 0} items</Text>
                                                </LinearGradient>
                                            </View>
                                        </View>

                                        <LinearGradient colors={['#FFD93D', '#FF6B35']} style={styles.pointsBadge}>
                                            <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
                                                <Ionicons name="star" size={14} color="white" />
                                            </Animated.View>
                                            <Text style={styles.pointsText}>{formatPoints(userItem.points || 0)}</Text>
                                        </LinearGradient>
                                    </Animated.View>
                                );
                            })}
                        </LinearGradient>
                    </Animated.View>

                    {/* Enhanced Encouragement Card */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <LinearGradient colors={['#00C851', '#007E33', '#00695C']} style={styles.encouragementCard}>
                            <Animated.View
                                style={[
                                    styles.encouragementIconCircle,
                                    { transform: [{ rotate: spin }, { scale: sparkleScale }] }
                                ]}
                            >
                                <LinearGradient colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']} style={styles.encouragementIconGradient}>
                                    <Ionicons name="leaf" size={36} color="#00C851" />
                                </LinearGradient>
                            </Animated.View>
                            <Text style={styles.encouragementTitle}>🌱 Keep Making a Difference!</Text>
                            <Text style={styles.encouragementText}>
                                Every item you recycle helps create a cleaner, greener campus for everyone. You're an eco-champion!
                            </Text>
                            <View style={styles.encouragementStats}>
                                <View style={styles.encouragementStat}>
                                    <Ionicons name="people-outline" size={20} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.encouragementStatText}>{leaderboard.length} Active Recyclers</Text>
                                </View>
                                <View style={styles.encouragementStat}>
                                    <Ionicons name="leaf-outline" size={20} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.encouragementStatText}>
                                        {leaderboard.reduce((sum, user) => sum + (user.totalScans || 0), 0)} Total Items
                                    </Text>
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
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    floatingCircle: {
        position: 'absolute',
        borderRadius: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    circle1: {
        width: 180, // Larger circles
        height: 180,
        top: 50,
        right: -60,
    },
    circle2: {
        width: 150,
        height: 150,
        top: 200,
        left: -50,
    },
    circle3: {
        width: 140,
        height: 140,
        bottom: 150,
        right: -30,
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
        fontSize: 18,
        color: '#FF4081',
        fontWeight: '600',
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 28,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: 'white',
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'white',
        fontWeight: '700',
        marginLeft: 8,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    headerIconContainer: {
        marginLeft: 20,
    },
    headerIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
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
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    podiumPosition: {
        flex: 1,
        alignItems: 'center',
    },
    podiumPlace: {
        padding: 18,
        borderRadius: 24,
        alignItems: 'center',
        width: '95%',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    firstPlace: {
        height: 180,
        marginHorizontal: 4,
        shadowColor: '#FFD700',
        shadowOpacity: 0.5,
    },
    secondPlace: {
        height: 150,
        marginRight: 2,
        shadowColor: '#C0C0C0',
        shadowOpacity: 0.4,
    },
    thirdPlace: {
        height: 150,
        marginLeft: 2,
        shadowColor: '#CD853F',
        shadowOpacity: 0.4,
    },
    crownContainer: {
        position: 'absolute',
        top: -18,
        alignItems: 'center',
    },
    sparkle: {
        position: 'absolute',
    },
    sparkle1: {
        top: -5,
        right: -8,
    },
    sparkle2: {
        top: -3,
        left: -6,
    },
    podiumAvatar: {
        marginTop: 16,
        marginBottom: 12,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 6,
    },
    firstPlaceAvatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1f2937',
    },
    podiumName: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    podiumPointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    podiumPoints: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
        marginLeft: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    podiumRank: {
        position: 'absolute',
        top: 10,
        right: 10,
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
    podiumRankText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 16,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    leaderboardCard: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 20,
    },
    cardGradient: {
        padding: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#e2e8f0',
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1f2937',
    },
    totalBadge: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    totalBadgeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    totalUsers: {
        fontSize: 13,
        color: 'white',
        fontWeight: '700',
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        borderRadius: 12,
        marginBottom: 4,
    },
    currentUserItem: {
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
        borderWidth: 2,
        borderColor: '#FFD93D',
        shadowColor: '#FFD93D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    currentUserGlow: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 24,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#FFD93D',
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
        marginRight: 14,
    },
    rankText: {
        fontSize: 16,
        fontWeight: '800',
    },
    userAvatarContainer: {
        marginRight: 16,
        position: 'relative',
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
    },
    userAvatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 6,
    },
    currentUserName: {
        color: '#F7931E',
        fontWeight: '800',
    },
    userStatsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    userStatsWhite: {
        fontSize: 11,
        color: 'white',
        fontWeight: '700',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    pointsText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 6,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    encouragementCard: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#00C851',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    encouragementIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    encouragementIconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    encouragementTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    encouragementText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    encouragementStats: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 8,
    },
    encouragementStat: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    encouragementStatText: {
        fontSize: 13,
        color: 'white',
        fontWeight: '600',
    },
});
