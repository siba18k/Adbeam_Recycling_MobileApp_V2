import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    SafeAreaView,
    TouchableOpacity,
    Alert
} from 'react-native';
import {
    Text,
    Card,
    Button,
    ActivityIndicator
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getRewards, redeemReward, initializeRewards } from '../services/database';
import { colors, gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function RewardsScreen({ navigation }) {
    const { user, userProfile } = useAuth();
    const [rewards, setRewards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [redeeming, setRedeeming] = useState({});

    const loadRewards = async () => {
        try {
            setIsLoading(true);
            const result = await getRewards();

            if (result.success) {
                if (result.data.length === 0) {
                    // Initialize rewards if none exist
                    console.log('No rewards found, initializing...');
                    const initResult = await initializeRewards();
                    if (initResult.success) {
                        // Reload rewards after initialization
                        const reloadResult = await getRewards();
                        if (reloadResult.success) {
                            setRewards(reloadResult.data);
                        }
                    }
                } else {
                    setRewards(result.data);
                }
            } else {
                console.error('Failed to load rewards:', result.error);
            }
        } catch (error) {
            console.error('Error loading rewards:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRewards();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadRewards();
        setIsRefreshing(false);
    };

    const handleRedeem = async (reward) => {
        const userPoints = userProfile?.points || 0;

        if (userPoints < reward.points) {
            Alert.alert(
                'Insufficient Points',
                `You need ${reward.points - userPoints} more points to redeem this reward.`,
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Confirm Redemption',
            `Are you sure you want to redeem "${reward.name}" for ${reward.points} points?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Redeem',
                    onPress: async () => {
                        setRedeeming(prev => ({ ...prev, [reward.id]: true }));

                        try {
                            const result = await redeemReward(user.uid, reward.id, reward.points);

                            if (result.success) {
                                Alert.alert(
                                    'Success! 🎉',
                                    'Your reward has been redeemed! Please visit the campus office to collect it.',
                                    [{ text: 'OK' }]
                                );
                                // Refresh user profile to update points
                                // You might want to add a refresh function to AuthContext
                            } else {
                                Alert.alert('Error', result.error);
                            }
                        } catch (error) {
                            console.error('Redemption error:', error);
                            Alert.alert('Error', 'Failed to redeem reward. Please try again.');
                        } finally {
                            setRedeeming(prev => ({ ...prev, [reward.id]: false }));
                        }
                    }
                }
            ]
        );
    };

    const getCategoryIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'food': return 'restaurant-outline';
            case 'education': return 'school-outline';
            case 'merchandise': return 'shirt-outline';
            case 'fitness': return 'fitness-outline';
            default: return 'gift-outline';
        }
    };

    const getCategoryColor = (category) => {
        switch (category?.toLowerCase()) {
            case 'food': return colors.status.warning;
            case 'education': return colors.primary.main;
            case 'merchandise': return colors.success.main;
            case 'fitness': return colors.accent.main;
            default: return colors.secondary.main;
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color={colors.primary.main} />
                        <Text style={styles.loadingText}>Loading rewards...</Text>
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
                        <Text style={styles.headerTitle}>Eco Rewards</Text>
                        <Text style={styles.headerSubtitle}>
                            Your Points: {userProfile?.points || 0}
                        </Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="gift" size={40} color="white" />
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
                    {/* Rewards Grid */}
                    {rewards.length > 0 ? (
                        <View style={styles.rewardsGrid}>
                            {rewards.map((reward, index) => (
                                <Card key={reward.id} style={styles.rewardCard}>
                                    <View style={styles.cardContent}>
                                        {/* Reward Image/Icon */}
                                        <LinearGradient
                                            colors={[getCategoryColor(reward.category), getCategoryColor(reward.category) + '80']}
                                            style={styles.rewardImageContainer}
                                        >
                                            <Ionicons
                                                name={getCategoryIcon(reward.category)}
                                                size={40}
                                                color="white"
                                            />
                                        </LinearGradient>

                                        {/* Reward Info */}
                                        <View style={styles.rewardInfo}>
                                            <Text style={styles.rewardName} numberOfLines={2}>
                                                {reward.name}
                                            </Text>
                                            <Text style={styles.rewardDescription} numberOfLines={3}>
                                                {reward.description}
                                            </Text>

                                            <View style={styles.rewardFooter}>
                                                <View style={styles.pointsContainer}>
                                                    <LinearGradient
                                                        colors={gradients.accent}
                                                        style={styles.pointsBadge}
                                                    >
                                                        <Ionicons name="star" size={14} color="white" />
                                                        <Text style={styles.pointsText}>{reward.points}</Text>
                                                    </LinearGradient>
                                                </View>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.redeemButton,
                                                        (userProfile?.points || 0) < reward.points && styles.redeemButtonDisabled
                                                    ]}
                                                    onPress={() => handleRedeem(reward)}
                                                    disabled={
                                                        (userProfile?.points || 0) < reward.points ||
                                                        redeeming[reward.id] ||
                                                        !reward.available
                                                    }
                                                >
                                                    <LinearGradient
                                                        colors={
                                                            (userProfile?.points || 0) >= reward.points
                                                                ? gradients.success
                                                                : [colors.text.light, colors.text.light]
                                                        }
                                                        style={styles.redeemButtonGradient}
                                                    >
                                                        {redeeming[reward.id] ? (
                                                            <ActivityIndicator size="small" color="white" />
                                                        ) : (
                                                            <Text style={styles.redeemButtonText}>
                                                                {(userProfile?.points || 0) >= reward.points ? 'Redeem' : 'Not Enough'}
                                                            </Text>
                                                        )}
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="gift-outline" size={80} color={colors.text.light} />
                            <Text style={styles.emptyTitle}>No Rewards Available</Text>
                            <Text style={styles.emptySubtitle}>
                                Check back later for exciting eco-friendly rewards!
                            </Text>
                            <Button
                                mode="outlined"
                                onPress={handleRefresh}
                                style={styles.refreshButton}
                            >
                                Refresh
                            </Button>
                        </View>
                    )}

                    {/* How to Earn More Points */}
                    <Card style={styles.infoCard}>
                        <LinearGradient
                            colors={[colors.primary.main, colors.primary.light]}
                            style={styles.infoGradient}
                        >
                            <View style={styles.infoHeader}>
                                <Ionicons name="information-circle" size={24} color="white" />
                                <Text style={styles.infoTitle}>How to Earn More Points</Text>
                            </View>
                            <View style={styles.infoList}>
                                <View style={styles.infoItem}>
                                    <Ionicons name="scan" size={16} color="white" />
                                    <Text style={styles.infoText}>Scan plastic bottles: +5 points</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Ionicons name="scan" size={16} color="white" />
                                    <Text style={styles.infoText}>Scan aluminum cans: +7 points</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Ionicons name="scan" size={16} color="white" />
                                    <Text style={styles.infoText}>Scan glass bottles: +10 points</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.scanButton}
                                onPress={() => navigation.navigate('Scanner')}
                            >
                                <Text style={styles.scanButtonText}>Start Scanning</Text>
                            </TouchableOpacity>
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
    rewardsGrid: {
        gap: 16,
    },
    rewardCard: {
        borderRadius: 16,
        elevation: 4,
        shadowColor: colors.shadow.light,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 8,
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    rewardImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rewardInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    rewardName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    rewardDescription: {
        fontSize: 14,
        color: colors.text.secondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    rewardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pointsContainer: {
        flex: 1,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    pointsText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    redeemButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    redeemButtonDisabled: {
        opacity: 0.6,
    },
    redeemButtonGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    redeemButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    refreshButton: {
        borderColor: colors.primary.main,
    },
    infoCard: {
        borderRadius: 16,
        marginTop: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    infoGradient: {
        padding: 20,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginLeft: 8,
    },
    infoList: {
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginLeft: 8,
        fontWeight: '500',
    },
    scanButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignSelf: 'center',
    },
    scanButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
