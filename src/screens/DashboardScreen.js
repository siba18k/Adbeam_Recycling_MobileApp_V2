import React, { useState, useEffect } from 'react';

import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { Text, Card, Avatar, ProgressBar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserAchievements } from '../services/database';

import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const { user, userProfile, refreshUserProfile } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [achievements, setAchievements] = useState([]);

    useEffect(() => {
        if (userProfile?.achievements) {
            const userAchievements = getUserAchievements(userProfile.achievements);
            setAchievements(userAchievements);
        }
    }, [userProfile]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshUserProfile();
        setRefreshing(false);
    };

    if (!userProfile) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    const currentLevel = userProfile.level || 1;
    const currentPoints = userProfile.points || 0;
    const pointsToNextLevel = (currentLevel * 100) - currentPoints;
    const progressToNextLevel = (currentPoints % 100) / 100;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header Card */}
            <Card style={styles.headerCard}>
                <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <Avatar.Text
                            size={70}
                            label={userProfile.displayName?.charAt(0) || 'U'}
                            style={styles.avatar}
                        />
                        <View style={styles.headerText}>
                            <Text style={styles.welcomeText}>Welcome back,</Text>
                            <Text style={styles.nameText}>{userProfile.displayName}</Text>
                            <Chip icon="school" style={styles.studentChip}>
                                {userProfile.studentNumber}
                            </Chip>
                        </View>
                    </View>
                </LinearGradient>
            </Card>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                    <Card.Content style={styles.statContent}>
                        <Ionicons name="trophy" size={30} color="#FFD700" />
                        <Text style={styles.statValue}>{currentPoints}</Text>
                        <Text style={styles.statLabel}>Total Points</Text>
                    </Card.Content>
                </Card>

                <Card style={styles.statCard}>
                    <Card.Content style={styles.statContent}>
                        <Ionicons name="trending-up" size={30} color="#4CAF50" />
                        <Text style={styles.statValue}>Level {currentLevel}</Text>
                        <Text style={styles.statLabel}>Current Level</Text>
                    </Card.Content>
                </Card>

                <Card style={styles.statCard}>
                    <Card.Content style={styles.statContent}>
                        <Ionicons name="flame" size={30} color="#FF5722" />
                        <Text style={styles.statValue}>{userProfile.streak || 0}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </Card.Content>
                </Card>

                <Card style={styles.statCard}>
                    <Card.Content style={styles.statContent}>
                        <Ionicons name="leaf" size={30} color="#8BC34A" />
                        <Text style={styles.statValue}>{userProfile.totalScans || 0}</Text>
                        <Text style={styles.statLabel}>Items Recycled</Text>
                    </Card.Content>
                </Card>
            </View>

            {/* Level Progress */}
            <Card style={styles.progressCard}>
                <Card.Content>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Level Progress</Text>
                        <Text style={styles.progressPoints}>
                            {pointsToNextLevel} points to Level {currentLevel + 1}
                        </Text>
                    </View>
                    <ProgressBar
                        progress={progressToNextLevel}
                        color="#4CAF50"
                        style={styles.progressBar}
                    />
                </Card.Content>
            </Card>

            {/* Quick Actions */}
            <Card style={styles.actionsCard}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Scanner')}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#45a049']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="scan" size={30} color="white" />
                                <Text style={styles.actionText}>Scan Item</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Rewards')}
                        >
                            <LinearGradient
                                colors={['#FF9800', '#F57C00']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="gift" size={30} color="white" />
                                <Text style={styles.actionText}>Rewards</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Leaderboard')}
                        >
                            <LinearGradient
                                colors={['#2196F3', '#1976D2']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="podium" size={30} color="white" />
                                <Text style={styles.actionText}>Leaderboard</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Card.Content>
            </Card>

            {/* Achievements */}
            {achievements.length > 0 && (
                <Card style={styles.achievementsCard}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Recent Achievements</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {achievements.slice(-3).map((achievement, index) => (
                                <View key={index} style={styles.achievementBadge}>
                                    <Ionicons name="medal" size={40} color="#FFD700" />
                                    <Text style={styles.achievementName}>{achievement.name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </Card.Content>
                </Card>
            )}

            {/* Environmental Impact */}
            <Card style={styles.impactCard}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>Your Impact</Text>
                    <View style={styles.impactStats}>
                        <View style={styles.impactItem}>
                            <Ionicons name="water" size={24} color="#2196F3" />
                            <Text style={styles.impactValue}>
                                {(userProfile.totalScans * 0.5).toFixed(1)}L
                            </Text>
                            <Text style={styles.impactLabel}>Water Saved</Text>
                        </View>
                        <View style={styles.impactItem}>
                            <Ionicons name="leaf" size={24} color="#4CAF50" />
                            <Text style={styles.impactValue}>
                                {(userProfile.totalScans * 0.2).toFixed(1)}kg
                            </Text>
                            <Text style={styles.impactLabel}>CO₂ Reduced</Text>
                        </View>
                        <View style={styles.impactItem}>
                            <Ionicons name="flash" size={24} color="#FF9800" />
                            <Text style={styles.impactValue}>
                                {(userProfile.totalScans * 0.3).toFixed(1)}kWh
                            </Text>
                            <Text style={styles.impactLabel}>Energy Saved</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCard: {
        margin: 0,
        borderRadius: 0,
        elevation: 4,
    },
    headerGradient: {
        padding: 20,
        paddingTop: 40,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    headerText: {
        marginLeft: 15,
        flex: 1,
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    nameText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    studentChip: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
    },
    statCard: {
        width: (width - 30) / 2,
        margin: 5,
        elevation: 2,
    },
    statContent: {
        alignItems: 'center',
        padding: 15,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    progressCard: {
        margin: 10,
        elevation: 2,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    progressPoints: {
        fontSize: 12,
        color: '#666',
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
    },
    actionsCard: {
        margin: 10,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    actionGradient: {
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    achievementsCard: {
        margin: 10,
        elevation: 2,
    },
    achievementBadge: {
        alignItems: 'center',
        marginRight: 20,
        padding: 10,
    },
    achievementName: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    impactCard: {
        margin: 10,
        marginBottom: 20,
        elevation: 2,
    },
    impactStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    impactItem: {
        alignItems: 'center',
    },
    impactValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    impactLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
    },
});
