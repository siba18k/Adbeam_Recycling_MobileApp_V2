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

    // FIXED: Proper animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const headerScale = useRef(new Animated.Value(0.8)).current;
    const podiumAnimations = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const float3 = useRef(new Animated.Value(0)).current;
    const tiltAnim = useRef(new Animated.Value(0)).current; // CHANGED: Tilt instead of rotate

    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1600,
                useNativeDriver: true,
            }),
            Animated.spring(headerScale, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.stagger(
            200,
            podiumAnimations.map((anim) =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                })
            )
        ).start();

        // SLIGHTLY SLOWER: Big circle floating animations - nice and gentle
        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: 30,
                    duration: 3200, // CHANGED: Was 2500ms, now 3200ms (slightly slower)
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: -30,
                    duration: 3200, // Slightly slower
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 3200, // Slightly slower
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, {
                    toValue: 25,
                    duration: 4200, // CHANGED: Was 3500ms, now 4200ms (slightly slower)
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: -25,
                    duration: 4200, // Slightly slower
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 0,
                    duration: 4200, // Slightly slower
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float3, {
                    toValue: 20,
                    duration: 5000, // CHANGED: Was 4000ms, now 5000ms (slightly slower)
                    useNativeDriver: true,
                }),
                Animated.timing(float3, {
                    toValue: -20,
                    duration: 5000, // Slightly slower
                    useNativeDriver: true,
                }),
                Animated.timing(float3, {
                    toValue: 0,
                    duration: 5000, // Slightly slower
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // SLIGHTLY SLOWER: Gentle tilt animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(tiltAnim, {
                    toValue: 5,
                    duration: 3500, // CHANGED: Was 3000ms, now 3800ms (slightly slower)
                    useNativeDriver: true,
                }),
                Animated.timing(tiltAnim, {
                    toValue: -5,
                    duration: 3500, // Slightly slower
                    useNativeDriver: true,
                }),
                Animated.timing(tiltAnim, {
                    toValue: 0,
                    duration: 3500, // Slightly slower
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // CHANGED: Gentle tilt instead of full rotation
        Animated.loop(
            Animated.sequence([
                Animated.timing(tiltAnim, {
                    toValue: 5, // CHANGED: 5 degrees tilt to right
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(tiltAnim, {
                    toValue: -5, // CHANGED: 5 degrees tilt to left
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(tiltAnim, {
                    toValue: 0, // Back to center
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

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

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 3500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 8,
                    duration: 3600,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 3600,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // CHANGED: Tilt interpolation instead of full rotation
    const tiltRotation = tiltAnim.interpolate({
        inputRange: [-5, 0, 5],
        outputRange: ['-5deg', '0deg', '5deg'],
    });

    const sparkleScale = sparkleAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });

    const sparkleOpacity = sparkleAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.4, 1, 0.4],
    });

    const glowIntensity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 0.6],
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
                return '#f59e0b';
            case 2:
                return '#6b7280';
            case 3:
                return '#92400e';
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
                        {
                            backgroundColor: '#f59e0b',
                            opacity: glowIntensity.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.15, 0.25],
                            }),
                            transform: [
                                { translateY: float1 },
                                { rotate: tiltRotation }, // CHANGED: Use tilt instead
                                { scale: sparkleScale }
                            ]
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.floatingCircle,
                        styles.circle2,
                        {
                            backgroundColor: '#059669',
                            opacity: glowIntensity.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.15, 0.25],
                            }),
                            transform: [{ translateY: float2 }, { scale: pulseAnim }]
                        }
                    ]}
                />
                <Animated.View
                    style={[
                        styles.floatingCircle,
                        styles.circle3,
                        {
                            backgroundColor: '#3b82f6',
                            opacity: sparkleOpacity.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.1, 0.2],
                            }),
                            transform: [{ translateY: float3 }, { rotate: tiltRotation }] // CHANGED: Use tilt
                        }
                    ]}
                />

                {/* Header */}
                <Animated.View style={{
                    opacity: fadeAnim,
                    transform: [
                        { scale: headerScale },
                        { translateY: bounceAnim }
                    ]
                }}>
                    <LinearGradient colors={['#f59e0b', '#d97706', '#b45309']} style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>🏆 Eco Leaderboard</Text>
                            <View style={styles.rankBadge}>
                                <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
                                    <Ionicons name="star" size={16} color="white" />
                                </Animated.View>
                                <Text style={styles.headerSubtitle}>
                                    {userRank ? `Rank #${userRank}` : 'Join the Rankings!'}
                                </Text>
                            </View>
                        </View>
                        {/* CHANGED: Header icon now tilts instead of full rotation */}
                        <Animated.View
                            style={[
                                styles.headerIconContainer,
                                { transform: [
                                        { rotate: tiltRotation }, // CHANGED: Gentle tilt
                                        { scale: pulseAnim }
                                    ] }
                            ]}
                        >
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                style={styles.headerIcon}
                            >
                                <Ionicons name="podium" size={32} color="white" />
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
                                                    outputRange: [60, 0],
                                                }),
                                            },
                                            {
                                                scale: podiumAnimations[1].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.7, 1],
                                                })
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#e5e7eb', '#d1d5db', '#9ca3af']} style={[styles.podiumPlace, styles.secondPlace]}>
                                    <Animated.View style={[styles.crownContainer, { transform: [{ scale: sparkleScale }] }]}>
                                        <Ionicons name="medal" size={28} color="#6b7280" />
                                        <Animated.View style={[styles.sparkle, styles.sparkle1, { opacity: sparkleOpacity }]}>
                                            <Ionicons name="sparkles" size={12} color="#d1d5db" />
                                        </Animated.View>
                                    </Animated.View>
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
                                        <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
                                            <Ionicons name="star" size={14} color="white" />
                                        </Animated.View>
                                        <Text style={styles.podiumPoints}>{formatPoints(leaderboard[1]?.points || 0)}</Text>
                                    </View>
                                    <View style={[styles.podiumRank, { backgroundColor: '#6b7280' }]}>
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
                                                    outputRange: [80, 0],
                                                }),
                                            },
                                            {
                                                scale: podiumAnimations[0].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.6, 1],
                                                })
                                            },
                                            { translateY: bounceAnim },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#f59e0b', '#d97706', '#b45309']} style={[styles.podiumPlace, styles.firstPlace]}>
                                    <Animated.View style={[
                                        styles.crownContainer,
                                        { transform: [
                                                { scale: pulseAnim },
                                                { rotate: tiltRotation } // CHANGED: Gentle tilt instead of rotation
                                            ] }
                                    ]}>
                                        <Ionicons name="crown" size={32} color="#fbbf24" />
                                        <Animated.View style={[styles.sparkle, styles.sparkle1, {
                                            opacity: sparkleOpacity,
                                            transform: [{ scale: sparkleScale }]
                                        }]}>
                                            <Ionicons name="sparkles" size={14} color="#fef3c7" />
                                        </Animated.View>
                                        <Animated.View style={[styles.sparkle, styles.sparkle2, { opacity: sparkleOpacity }]}>
                                            <Ionicons name="sparkles" size={12} color="#ffffff" />
                                        </Animated.View>
                                        <Animated.View style={[styles.sparkle, styles.sparkle3, { opacity: sparkleOpacity }]}>
                                            <Ionicons name="star" size={10} color="#fbbf24" />
                                        </Animated.View>
                                    </Animated.View>

                                    <View style={styles.podiumAvatar}>
                                        <LinearGradient
                                            colors={['#ffffff', '#fef3c7']}
                                            style={[styles.avatarCircle, styles.firstPlaceAvatar]}
                                        >
                                            <Text style={[styles.avatarText, { fontSize: 26, color: '#d97706', fontWeight: '800' }]}>
                                                {(leaderboard[0]?.displayName || 'U').charAt(0).toUpperCase()}
                                            </Text>
                                        </LinearGradient>
                                        <Animated.View
                                            style={[
                                                styles.avatarGlow,
                                                {
                                                    opacity: glowIntensity,
                                                    transform: [{ scale: pulseAnim }]
                                                }
                                            ]}
                                        />
                                    </View>

                                    <Text style={[styles.podiumName, { fontSize: 15, fontWeight: '800' }]} numberOfLines={1}>
                                        👑 {leaderboard[0]?.displayName || 'Champion'}
                                    </Text>

                                    <View style={styles.podiumPointsBadge}>
                                        <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
                                            <Ionicons name="star" size={16} color="white" />
                                        </Animated.View>
                                        <Text style={[styles.podiumPoints, { fontSize: 15 }]}>
                                            {formatPoints(leaderboard[0]?.points || 0)}
                                        </Text>
                                    </View>

                                    <Animated.View style={[
                                        styles.podiumRank,
                                        {
                                            backgroundColor: '#f59e0b',
                                            transform: [{ scale: sparkleScale }]
                                        }
                                    ]}>
                                        <Ionicons name="trophy" size={18} color="white" />
                                    </Animated.View>

                                    <Animated.View
                                        style={[
                                            styles.championAura,
                                            {
                                                opacity: glowIntensity,
                                                transform: [{ scale: pulseAnim }]
                                            }
                                        ]}
                                    />
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
                                                    outputRange: [60, 0],
                                                }),
                                            },
                                            {
                                                scale: podiumAnimations[2].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.7, 1],
                                                })
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient colors={['#92400e', '#78350f', '#451a03']} style={[styles.podiumPlace, styles.thirdPlace]}>
                                    <Animated.View style={[styles.crownContainer, { transform: [{ scale: sparkleScale }] }]}>
                                        <Ionicons name="medal" size={28} color="#a16207" />
                                        <Animated.View style={[styles.sparkle, styles.sparkle1, { opacity: sparkleOpacity }]}>
                                            <Ionicons name="sparkles" size={12} color="#d97706" />
                                        </Animated.View>
                                    </Animated.View>
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
                                        <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
                                            <Ionicons name="star" size={14} color="white" />
                                        </Animated.View>
                                        <Text style={styles.podiumPoints}>{formatPoints(leaderboard[2]?.points || 0)}</Text>
                                    </View>
                                    <View style={[styles.podiumRank, { backgroundColor: '#92400e' }]}>
                                        <Text style={styles.podiumRankText}>3</Text>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        </View>
                    )}

                    {/* FIXED: Full Leaderboard with proper layout to prevent overlapping */}
                    <Animated.View style={[styles.leaderboardCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <LinearGradient colors={['#ffffff', '#f9fafb', '#e5e7eb']} style={styles.cardGradient}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>🏅 Full Rankings</Text>
                                <View style={styles.totalBadge}>
                                    <LinearGradient colors={['#059669', '#047857']} style={styles.totalBadgeGradient}>
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
                                                            outputRange: [index % 2 === 0 ? -40 : 40, 0],
                                                        }),
                                                    },
                                                    {
                                                        scale: fadeAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0.9, 1],
                                                        }),
                                                    },
                                                ],
                                            }
                                        ]}
                                    >
                                        {/* Rank */}
                                        <View style={styles.rankContainer}>
                                            {getRankIcon(rank) ? (
                                                <Animated.View style={{ transform: [{ scale: rank <= 3 ? sparkleScale : 1 }] }}>
                                                    <Ionicons name={getRankIcon(rank)} size={24} color={getRankColor(rank)} />
                                                </Animated.View>
                                            ) : (
                                                <Text style={[styles.rankText, { color: getRankColor(rank) }]}>#{rank}</Text>
                                            )}
                                        </View>

                                        {/* Avatar */}
                                        <View style={styles.userAvatarContainer}>
                                            <LinearGradient
                                                colors={isCurrentUser ? ['#f59e0b', '#d97706'] : ['#059669', '#047857']}
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
                                                        {
                                                            opacity: glowIntensity,
                                                            transform: [{ scale: pulseAnim }]
                                                        }
                                                    ]}
                                                />
                                            )}
                                        </View>

                                        {/* FIXED: User Info with better layout */}
                                        <View style={styles.userInfo}>
                                            <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                                                {userItem.displayName || 'User'}
                                                {isCurrentUser && ' ⭐ (You)'}
                                            </Text>
                                            {/* FIXED: Stats row with proper spacing */}
                                            <View style={styles.userStatsRow}>
                                                <LinearGradient colors={['#059669', '#047857']} style={styles.statBadge}>
                                                    <Ionicons name="bar-chart" size={10} color="white" />
                                                    <Text style={styles.userStatsWhite}>Lvl {userItem.level || 1}</Text>
                                                </LinearGradient>
                                                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statBadge}>
                                                    <Ionicons name="leaf" size={10} color="white" />
                                                    <Text style={styles.userStatsWhite}>{userItem.totalScans || 0} items</Text>
                                                </LinearGradient>
                                            </View>
                                        </View>

                                        {/* FIXED: Points badge positioned to not overlap */}
                                        <View style={styles.pointsContainer}>
                                            <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.pointsBadge}>
                                                <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
                                                    <Ionicons name="star" size={14} color="white" />
                                                </Animated.View>
                                                <Text style={styles.pointsText}>{formatPoints(userItem.points || 0)}</Text>
                                            </LinearGradient>
                                        </View>
                                    </Animated.View>
                                );
                            })}
                        </LinearGradient>
                    </Animated.View>

                    {/* Encouragement Card */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <LinearGradient colors={['#059669', '#047857', '#065f46']} style={styles.encouragementCard}>
                            {/* CHANGED: Icon now tilts instead of full rotation */}
                            <Animated.View
                                style={[
                                    styles.encouragementIconCircle,
                                    { transform: [
                                            { rotate: tiltRotation }, // CHANGED: Gentle tilt
                                            { scale: pulseAnim }
                                        ] }
                                ]}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                    style={styles.encouragementIconGradient}
                                >
                                    <Ionicons name="leaf" size={32} color="white" />
                                </LinearGradient>
                            </Animated.View>
                            <Text style={styles.encouragementTitle}>🌱 Keep Making a Difference!</Text>
                            <Text style={styles.encouragementText}>
                                Every item you recycle helps create a cleaner, greener campus for everyone. You're an eco-champion!
                            </Text>
                            <View style={styles.encouragementStats}>
                                <Animated.View style={[styles.encouragementStat, { transform: [{ scale: sparkleScale }] }]}>
                                    <View style={styles.statBackground}>
                                        <Ionicons name="people-outline" size={18} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.encouragementStatText}>{leaderboard.length} Active Recyclers</Text>
                                    </View>
                                </Animated.View>
                                <Animated.View style={[styles.encouragementStat, { transform: [{ scale: sparkleScale }] }]}>
                                    <View style={styles.statBackground}>
                                        <Ionicons name="leaf-outline" size={18} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.encouragementStatText}>
                                            {leaderboard.reduce((sum, user) => sum + (user.totalScans || 0), 0)} Total Items
                                        </Text>
                                    </View>
                                </Animated.View>
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
        width: 180,
        height: 180,
        top: 50,
        right: -60,
    },
    circle2: {
        width: 160,
        height: 160,
        top: 200,
        left: -60,
    },
    circle3: {
        width: 140,
        height: 140,
        bottom: 150,
        right: -40,
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
        color: '#92400e',
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
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 30,
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
        fontSize: 15,
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
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
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
        shadowColor: '#f59e0b',
        shadowOpacity: 0.5,
    },
    secondPlace: {
        height: 150,
        marginRight: 2,
        shadowColor: '#6b7280',
        shadowOpacity: 0.4,
    },
    thirdPlace: {
        height: 150,
        marginLeft: 2,
        shadowColor: '#92400e',
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
        top: -6,
        right: -8,
    },
    sparkle2: {
        top: -4,
        left: -6,
    },
    sparkle3: {
        top: -8,
        right: 4,
    },
    podiumAvatar: {
        marginTop: 16,
        marginBottom: 12,
        position: 'relative',
    },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 6,
    },
    firstPlaceAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: '#fbbf24',
    },
    avatarGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f59e0b',
        top: -5,
        left: -5,
        zIndex: -1,
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
    championAura: {
        position: 'absolute',
        width: '110%',
        height: '110%',
        borderRadius: 24,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        top: '-5%',
        left: '-5%',
        zIndex: -1,
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
        fontSize: 22,
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
    // FIXED: Improved leaderboard item layout
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14, // CHANGED: Increased vertical padding
        paddingHorizontal: 8, // CHANGED: Increased horizontal padding
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        borderRadius: 12,
        marginBottom: 6, // CHANGED: Increased margin
    },
    currentUserItem: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 2,
        borderColor: '#f59e0b',
        shadowColor: '#f59e0b',
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
        borderColor: '#fbbf24',
    },
    rankContainer: {
        width: 45, // CHANGED: Reduced width slightly
        alignItems: 'center',
        marginRight: 12, // CHANGED: Reduced margin
    },
    rankText: {
        fontSize: 16,
        fontWeight: '800',
    },
    userAvatarContainer: {
        marginRight: 12, // CHANGED: Reduced margin
        position: 'relative',
    },
    userAvatar: {
        width: 48, // CHANGED: Slightly smaller
        height: 48,
        borderRadius: 24,
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
        fontSize: 17, // CHANGED: Adjusted font size
        fontWeight: '800',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    // FIXED: Better user info layout
    userInfo: {
        flex: 1,
        marginRight: 12, // CHANGED: Added right margin to prevent overlap
    },
    userName: {
        fontSize: 16, // CHANGED: Slightly smaller
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4, // CHANGED: Reduced margin
    },
    currentUserName: {
        color: '#d97706',
        fontWeight: '800',
    },
    // FIXED: Better stats row layout
    userStatsRow: {
        flexDirection: 'row',
        gap: 6, // CHANGED: Reduced gap
        flexWrap: 'wrap', // CHANGED: Allow wrapping if needed
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6, // CHANGED: Reduced padding
        paddingVertical: 3, // CHANGED: Reduced padding
        borderRadius: 10, // CHANGED: Smaller border radius
        gap: 3, // CHANGED: Smaller gap
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    userStatsWhite: {
        fontSize: 10, // CHANGED: Smaller font
        color: 'white',
        fontWeight: '700',
    },
    // FIXED: Points container to prevent overlap
    pointsContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 70, // CHANGED: Fixed minimum width to prevent overlap
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10, // CHANGED: Reduced padding
        paddingVertical: 6, // CHANGED: Reduced padding
        borderRadius: 14, // CHANGED: Smaller radius
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 2 }, // CHANGED: Reduced shadow
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    pointsText: {
        color: 'white',
        fontSize: 13, // CHANGED: Smaller font to fit better
        fontWeight: '800',
        marginLeft: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    encouragementCard: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#059669',
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
        fontSize: 22,
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
        borderRadius: 16,
        overflow: 'hidden',
    },
    statBackground: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    encouragementStatText: {
        fontSize: 13,
        color: 'white',
        fontWeight: '600',
    },
});
