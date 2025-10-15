import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { updateUserProfile } from '../services/database';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    SafeAreaView,
    TouchableOpacity
} from 'react-native';
import {
    Text,
    Card,
    ProgressBar,
    Avatar,
    Badge
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getUserAchievements, getUserScans } from '../services/database';
import { colors, gradients, recyclingColors } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const { user, userProfile } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const addTestPoints = async () => {
        if (!__DEV__) return; // Only in development mode

        Alert.alert(
            'Add Test Points',
            'How many points would you like to add?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: '+500 Points', onPress: () => addPoints(500) },
                { text: '+1000 Points', onPress: () => addPoints(1000) },
                { text: '+2000 Points', onPress: () => addPoints(2000) },
            ]
        );
    };

    const addPoints = async (pointsToAdd) => {
        try {
            const currentPoints = userProfile?.points || 0;
            const newPoints = currentPoints + pointsToAdd;
            const newLevel = Math.floor(newPoints / 100) + 1;

            const result = await updateUserProfile(user.uid, {
                points: newPoints,
                level: newLevel,
                updatedAt: new Date().toISOString()
            });

            if (result.success) {
                Alert.alert(
                    'Points Added! 🎉',
                    `Added ${pointsToAdd} points!\nTotal Points: ${newPoints}\nLevel: ${newLevel}`,
                    [{ text: 'OK' }]
                );

                // Refresh dashboard data
                await loadDashboardData();
            } else {
                Alert.alert('Error', 'Failed to add points');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add points: ' + error.message);
        }
    };

    const loadDashboardData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Load user statistics
            const statsResult = await getUserStats(user.uid);
            if (statsResult.success) {
                setStats(statsResult.data);

                // Load user achievements
                const userAchievements = getUserAchievements(statsResult.data.achievements);
                setAchievements(userAchievements);
            }

            // Load recent scans
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
        setIsRefreshing(false);
    };

    const getNextLevelProgress = () => {
        if (!stats) return 0;
        const currentLevelPoints = (stats.level - 1) * 100;
        const nextLevelPoints = stats.level * 100;
        const progress = (stats.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints);
        return Math.min(Math.max(progress, 0), 1);
    };

    const getMaterialIcon = (materialType) => {
        const type = materialType.toLowerCase();
        if (type.includes('plastic')) return 'water-outline';
        if (type.includes('glass')) return 'wine-outline';
        if (type.includes('aluminum')) return 'nutrition-outline';
        if (type.includes('paper')) return 'newspaper-outline';
        return 'leaf-outline';
    };

    const getMaterialColor = (materialType) => {
        const type = materialType.toLowerCase();
        if (type.includes('plastic')) return recyclingColors.plastic;
        if (type.includes('glass')) return recyclingColors.glass;
        if (type.includes('metal') || type.includes('aluminum')) return recyclingColors.metal;
        if (type.includes('paper')) return recyclingColors.paper;
        return colors.success.main;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <Ionicons name="leaf" size={60} color={colors.primary.main} />
                        <Text style={styles.loadingText}>Loading your eco-journey...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Card */}
                    <LinearGradient
                        colors={gradients.backgroundPrimary}
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
                                <Text style={styles.levelText}>Level {stats?.level || 1} Recycler</Text>
                            </View>

                            <View style={styles.avatarContainer}>
                                <Avatar.Text
                                    size={60}
                                    label={(userProfile?.displayName || 'E').charAt(0).toUpperCase()}
                                    style={styles.avatar}
                                    labelStyle={styles.avatarLabel}
                                />
                                <Badge style={styles.levelBadge} size={20}>
                                    {stats?.level || 1}
                                </Badge>
                            </View>
                        </View>

                        {/* Level Progress */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressInfo}>
                                <Text style={styles.progressLabel}>
                                    Level {stats?.level || 1} Progress
                                </Text>
                                <Text style={styles.progressPoints}>
                                    {stats?.totalPoints || 0} / {(stats?.level || 1) * 100} points
                                </Text>
                            </View>
                            <ProgressBar
                                progress={getNextLevelProgress()}
                                color={colors.accent.main}
                                style={styles.progressBar}
                            />
                        </View>
                    </LinearGradient>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <Card style={[styles.statCard, styles.statCard1]}>
                            <LinearGradient
                                colors={[colors.success.main, colors.success.light]}
                                style={styles.statGradient}
                            >
                                <Ionicons name="leaf" size={24} color="white" />
                                <Text style={styles.statValue}>{stats?.totalScans || 0}</Text>
                                <Text style={styles.statLabel}>Items Recycled</Text>
                            </LinearGradient>
                        </Card>

                        <Card style={[styles.statCard, styles.statCard2]}>
                            <LinearGradient
                                colors={[colors.primary.main, colors.primary.light]}
                                style={styles.statGradient}
                            >
                                <Ionicons name="star" size={24} color="white" />
                                <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
                                <Text style={styles.statLabel}>Total Points</Text>
                            </LinearGradient>
                        </Card>

                        <Card style={[styles.statCard, styles.statCard3]}>
                            <LinearGradient
                                colors={[colors.accent.main, colors.accent.light]}
                                style={styles.statGradient}
                            >
                                <Ionicons name="trending-up" size={24} color="white" />
                                <Text style={styles.statValue}>{stats?.scansThisWeek || 0}</Text>
                                <Text style={styles.statLabel}>This Week</Text>
                            </LinearGradient>
                        </Card>

                        <Card style={[styles.statCard, styles.statCard4]}>
                            <LinearGradient
                                colors={[colors.secondary.main, colors.secondary.light]}
                                style={styles.statGradient}
                            >
                                <Ionicons name="trophy" size={24} color="white" />
                                <Text style={styles.statValue}>{achievements.length}</Text>
                                <Text style={styles.statLabel}>Achievements</Text>
                            </LinearGradient>
                        </Card>
                    </View>

                    {/* Material Breakdown */}
                    {stats?.materialBreakdown && (
                        <Card style={styles.materialCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Material Breakdown</Text>
                                <Ionicons name="analytics-outline" size={20} color={colors.text.secondary} />
                            </View>

                            <View style={styles.materialGrid}>
                                {Object.entries(stats.materialBreakdown).map(([material, count]) => (
                                    <View key={material} style={styles.materialItem}>
                                        <View
                                            style={[
                                                styles.materialIcon,
                                                { backgroundColor: recyclingColors[material] || colors.success.main }
                                            ]}
                                        >
                                            <Ionicons
                                                name={getMaterialIcon(material)}
                                                size={16}
                                                color="white"
                                            />
                                        </View>
                                        <Text style={styles.materialLabel}>
                                            {material.charAt(0).toUpperCase() + material.slice(1)}
                                        </Text>
                                        <Text style={styles.materialCount}>{count}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* Recent Activity */}
                    {recentScans.length > 0 && (
                        <Card style={styles.activityCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Recent Activity</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Scanner')}>
                                    <Text style={styles.viewAllText}>Scan More</Text>
                                </TouchableOpacity>
                            </View>

                            {recentScans.map((scan, index) => (
                                <View key={index} style={styles.activityItem}>
                                    <View
                                        style={[
                                            styles.activityIcon,
                                            { backgroundColor: getMaterialColor(scan.materialType) }
                                        ]}
                                    >
                                        <Ionicons
                                            name={getMaterialIcon(scan.materialType)}
                                            size={16}
                                            color="white"
                                        />
                                    </View>
                                    <View style={styles.activityInfo}>
                                        <Text style={styles.activityTitle}>{scan.materialType}</Text>
                                        <Text style={styles.activityTime}>
                                            {new Date(scan.timestamp).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={styles.activityPoints}>+{scan.points}</Text>
                                </View>
                            ))}
                        </Card>
                    )}

                    {/* Recent Achievements */}
                    {achievements.length > 0 && (
                        <Card style={styles.achievementsCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Your Achievements</Text>
                                <Ionicons name="trophy-outline" size={20} color={colors.text.secondary} />
                            </View>

                            <View style={styles.achievementsGrid}>
                                {achievements.slice(0, 4).map((achievement, index) => (
                                    <View key={index} style={styles.achievementItem}>
                                        <LinearGradient
                                            colors={[colors.accent.main, colors.accent.light]}
                                            style={styles.achievementIcon}
                                        >
                                            <Ionicons
                                                name={achievement.icon || 'star'}
                                                size={16}
                                                color="white"
                                            />
                                        </LinearGradient>
                                        <Text style={styles.achievementName}>{achievement.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Scanner')}
                        >
                            <LinearGradient
                                colors={gradients.success}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="scan" size={24} color="white" />
                                <Text style={styles.actionText}>Scan Item</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Rewards')}
                        >
                            <LinearGradient
                                colors={gradients.primary}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="gift" size={24} color="white" />
                                <Text style={styles.actionText}>Rewards</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    {/* Add this after the existing quickActions View, only in development */}
                    {__DEV__ && (
                        <TouchableOpacity
                            style={[styles.actionButton, { marginTop: 16 }]}
                            onPress={addTestPoints}
                        >
                            <LinearGradient
                                colors={['#f59e0b', '#f97316']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="add-circle" size={24} color="white" />
                                <Text style={styles.actionText}>Add Test Points</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    headerCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        shadowColor: colors.shadow.medium,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
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
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    nameText: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    levelText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    avatarLabel: {
        color: 'white',
        fontWeight: '700',
    },
    levelBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.accent.main,
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
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    progressPoints: {
        fontSize: 14,
        color: 'white',
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 12,
    },
    statCard: {
        width: (width - 44) / 2,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: colors.shadow.light,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statGradient: {
        padding: 20,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '500',
    },
    materialCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: colors.shadow.light,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        color: colors.text.primary,
    },
    materialGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    materialItem: {
        alignItems: 'center',
        flex: 1,
    },
    materialIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    materialLabel: {
        fontSize: 12,
        color: colors.text.secondary,
        fontWeight: '500',
        textAlign: 'center',
    },
    materialCount: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginTop: 4,
    },
    activityCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
    },
    viewAllText: {
        fontSize: 14,
        color: colors.primary.main,
        fontWeight: '600',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    activityTime: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 2,
    },
    activityPoints: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.success.main,
    },
    achievementsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    achievementItem: {
        alignItems: 'center',
        width: (width - 76) / 4,
    },
    achievementIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    achievementName: {
        fontSize: 10,
        color: colors.text.secondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: colors.shadow.medium,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    actionGradient: {
        padding: 20,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginTop: 8,
    },
});
