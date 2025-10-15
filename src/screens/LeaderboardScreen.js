import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    SafeAreaView,
    ActivityIndicator
} from 'react-native';
import {
    Text,
    Card,
    Avatar,
    Badge
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/database';
import { colors, gradients } from '../theme/colors';

export default function LeaderboardScreen() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userRank, setUserRank] = useState(null);

    const loadLeaderboard = async () => {
        try {
            setIsLoading(true);
            const result = await getLeaderboard(100); // Get top 100 users

            if (result.success) {
                setLeaderboard(result.data);

                // Find current user's rank
                const userIndex = result.data.findIndex(u => u.id === user?.uid);
                if (userIndex !== -1) {
                    setUserRank(userIndex + 1);
                }
            } else {
                console.error('Failed to load leaderboard:', result.error);
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
            case 1: return '#FFD700'; // Gold
            case 2: return '#C0C0C0'; // Silver
            case 3: return '#CD7F32'; // Bronze
            default: return colors.text.secondary;
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return 'trophy';
            case 2: return 'medal-outline';
            case 3: return 'medal-outline';
            default: return null;
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
                <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color={colors.primary.main} />
                        <Text style={styles.loadingText}>Loading leaderboard...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                {/* Header */}
                <LinearGradient
                    colors={gradients.backgroundPrimary}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Eco Leaderboard</Text>
                        <Text style={styles.headerSubtitle}>
                            {userRank ? `Your Rank: #${userRank}` : 'Keep recycling to rank!'}
                        </Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="trophy" size={40} color="white" />
                    </View>
                </LinearGradient>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Top 3 Podium */}
                    {leaderboard.length >= 3 && (
                        <View style={styles.podium}>
                            {/* 2nd Place */}
                            <View style={styles.podiumPosition}>
                                <LinearGradient
                                    colors={['#C0C0C0', '#A8A8A8']}
                                    style={[styles.podiumPlace, styles.secondPlace]}
                                >
                                    <Avatar.Text
                                        size={50}
                                        label={(leaderboard[1]?.displayName || 'U').charAt(0).toUpperCase()}
                                        style={styles.podiumAvatar}
                                        labelStyle={styles.podiumAvatarLabel}
                                    />
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {leaderboard[1]?.displayName || 'User'}
                                    </Text>
                                    <Text style={styles.podiumPoints}>
                                        {formatPoints(leaderboard[1]?.points || 0)}
                                    </Text>
                                    <View style={styles.podiumRank}>
                                        <Text style={styles.podiumRankText}>2</Text>
                                    </View>
                                </LinearGradient>
                            </View>

                            {/* 1st Place */}
                            <View style={styles.podiumPosition}>
                                <LinearGradient
                                    colors={['#FFD700', '#FFA500']}
                                    style={[styles.podiumPlace, styles.firstPlace]}
                                >
                                    <Avatar.Text
                                        size={60}
                                        label={(leaderboard[0]?.displayName || 'U').charAt(0).toUpperCase()}
                                        style={styles.podiumAvatar}
                                        labelStyle={styles.podiumAvatarLabel}
                                    />
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {leaderboard[0]?.displayName || 'User'}
                                    </Text>
                                    <Text style={styles.podiumPoints}>
                                        {formatPoints(leaderboard[0]?.points || 0)}
                                    </Text>
                                    <View style={styles.podiumRank}>
                                        <Ionicons name="crown" size={16} color="white" />
                                    </View>
                                </LinearGradient>
                            </View>

                            {/* 3rd Place */}
                            <View style={styles.podiumPosition}>
                                <LinearGradient
                                    colors={['#CD7F32', '#B8860B']}
                                    style={[styles.podiumPlace, styles.thirdPlace]}
                                >
                                    <Avatar.Text
                                        size={50}
                                        label={(leaderboard[2]?.displayName || 'U').charAt(0).toUpperCase()}
                                        style={styles.podiumAvatar}
                                        labelStyle={styles.podiumAvatarLabel}
                                    />
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {leaderboard[2]?.displayName || 'User'}
                                    </Text>
                                    <Text style={styles.podiumPoints}>
                                        {formatPoints(leaderboard[2]?.points || 0)}
                                    </Text>
                                    <View style={styles.podiumRank}>
                                        <Text style={styles.podiumRankText}>3</Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        </View>
                    )}

                    {/* Full Leaderboard */}
                    <Card style={styles.leaderboardCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Full Rankings</Text>
                            <Text style={styles.totalUsers}>{leaderboard.length} Recyclers</Text>
                        </View>

                        {leaderboard.map((userItem, index) => {
                            const rank = index + 1;
                            const isCurrentUser = userItem.id === user?.uid;

                            return (
                                <View
                                    key={userItem.id}
                                    style={[
                                        styles.leaderboardItem,
                                        isCurrentUser && styles.currentUserItem
                                    ]}
                                >
                                    <View style={styles.rankContainer}>
                                        {getRankIcon(rank) ? (
                                            <Ionicons
                                                name={getRankIcon(rank)}
                                                size={20}
                                                color={getRankColor(rank)}
                                            />
                                        ) : (
                                            <Text style={[styles.rankText, { color: getRankColor(rank) }]}>
                                                #{rank}
                                            </Text>
                                        )}
                                    </View>

                                    <Avatar.Text
                                        size={40}
                                        label={(userItem.displayName || 'U').charAt(0).toUpperCase()}
                                        style={styles.avatar}
                                        labelStyle={styles.avatarLabel}
                                    />

                                    <View style={styles.userInfo}>
                                        <Text style={[
                                            styles.userName,
                                            isCurrentUser && styles.currentUserName
                                        ]}>
                                            {userItem.displayName || 'User'}
                                            {isCurrentUser && ' (You)'}
                                        </Text>
                                        <Text style={styles.userStats}>
                                            Level {userItem.level || 1} • {userItem.totalScans || 0} items
                                        </Text>
                                    </View>

                                    <View style={styles.pointsContainer}>
                                        <LinearGradient
                                            colors={gradients.accent}
                                            style={styles.pointsBadge}
                                        >
                                            <Ionicons name="star" size={14} color="white" />
                                            <Text style={styles.pointsText}>
                                                {formatPoints(userItem.points || 0)}
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                </View>
                            );
                        })}
                    </Card>

                    {/* Encouragement Card */}
                    <Card style={styles.encouragementCard}>
                        <LinearGradient
                            colors={gradients.success}
                            style={styles.encouragementGradient}
                        >
                            <Ionicons name="leaf" size={30} color="white" />
                            <Text style={styles.encouragementTitle}>
                                Keep Making a Difference!
                            </Text>
                            <Text style={styles.encouragementText}>
                                Every item you recycle helps create a cleaner, greener campus for everyone.
                            </Text>
                        </LinearGradient>
                    </Card>
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
        color: colors.text.secondary,
        fontWeight: '500',
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 30,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    headerIcon: {
        marginLeft: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 0,
    },
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    podiumPosition: {
        flex: 1,
        alignItems: 'center',
    },
    podiumPlace: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        width: '90%',
        position: 'relative',
    },
    firstPlace: {
        height: 140,
        marginHorizontal: 8,
    },
    secondPlace: {
        height: 120,
        marginRight: 4,
    },
    thirdPlace: {
        height: 120,
        marginLeft: 4,
    },
    podiumAvatar: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginBottom: 8,
    },
    podiumAvatarLabel: {
        color: 'white',
        fontWeight: '700',
    },
    podiumName: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 4,
    },
    podiumPoints: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    podiumRank: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumRankText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
    },
    leaderboardCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    totalUsers: {
        fontSize: 14,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    currentUserItem: {
        backgroundColor: colors.primary.light + '20',
        marginHorizontal: -12,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 16,
        fontWeight: '700',
    },
    avatar: {
        backgroundColor: colors.primary.light,
        marginRight: 12,
    },
    avatarLabel: {
        color: 'white',
        fontWeight: '600',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 2,
    },
    currentUserName: {
        color: colors.primary.main,
    },
    userStats: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    pointsContainer: {
        alignItems: 'flex-end',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pointsText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    encouragementCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    encouragementGradient: {
        padding: 20,
        alignItems: 'center',
    },
    encouragementTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginTop: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    encouragementText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 20,
    },
});
