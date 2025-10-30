import React, { useState, useEffect, useRef } from 'react';
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
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getRewards, redeemRewardWithVoucher, initializeRewards } from '../services/database';

const { width } = Dimensions.get('window');

export default function RewardsScreen({ navigation }) {
    const { user, userProfile, refreshUserProfile } = useAuth();
    const [rewards, setRewards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [redeeming, setRedeeming] = useState({});

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
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

    const loadRewards = async () => {
        try {
            setIsLoading(true);
            const result = await getRewards();

            if (result.success) {
                if (result.data.length === 0) {
                    console.log('No rewards found, initializing...');
                    const initResult = await initializeRewards();
                    if (initResult.success) {
                        const reloadResult = await getRewards();
                        if (reloadResult.success) {
                            setRewards(reloadResult.data);
                        }
                    }
                } else {
                    setRewards(result.data);
                }
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
        await refreshUserProfile();
        setIsRefreshing(false);
    };

    const handleManualInit = async () => {
        Alert.alert('Initialize Rewards', 'This will add sample rewards to the database. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Initialize',
                onPress: async () => {
                    try {
                        const result = await initializeRewards();
                        if (result.success) {
                            Alert.alert('Success', 'Rewards initialized successfully!');
                            await loadRewards();
                        } else {
                            Alert.alert('Error', result.error || 'Failed to initialize rewards');
                        }
                    } catch (error) {
                        Alert.alert('Error', 'Failed to initialize: ' + error.message);
                    }
                },
            },
        ]);
    };

    const handleRedeem = async (reward) => {
        const userPoints = userProfile?.points || 0;

        if (userPoints < reward.points) {
            Alert.alert(
                'Insufficient Points',
                `You need ${reward.points - userPoints} more points to redeem this reward.\n\nTip: Scan more items to earn points!`,
                [{ text: 'OK' }, { text: 'Start Scanning', onPress: () => navigation.navigate('Scanner') }]
            );
            return;
        }

        Alert.alert(
            'Confirm Redemption',
            `Redeem "${reward.name}" for ${reward.points} points?\n\nYou'll receive a QR code voucher.\n\nRemaining points: ${userPoints - reward.points}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Redeem',
                    onPress: async () => {
                        setRedeeming((prev) => ({ ...prev, [reward.id]: true }));

                        try {
                            const result = await redeemRewardWithVoucher(user.uid, reward.id, reward.points);

                            if (result.success) {
                                Alert.alert(
                                    'Voucher Created! 🎉',
                                    `Your "${reward.name}" voucher has been created!\n\nVoucher Code: ${result.voucherCode}\n\nFind it in the Vouchers tab.`,
                                    [
                                        { text: 'View Vouchers', onPress: () => navigation.navigate('Vouchers') },
                                        { text: 'OK' },
                                    ]
                                );
                            } else {
                                Alert.alert('Redemption Failed', result.error);
                            }
                        } catch (error) {
                            console.error('Redemption error:', error);
                            Alert.alert('Error', 'Failed to create voucher. Please try again.');
                        } finally {
                            setRedeeming((prev) => ({ ...prev, [reward.id]: false }));
                        }
                    },
                },
            ]
        );
    };

    const getCategoryIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'food':
                return 'restaurant-outline';
            case 'education':
                return 'school-outline';
            case 'merchandise':
                return 'shirt-outline';
            case 'fitness':
                return 'fitness-outline';
            default:
                return 'gift-outline';
        }
    };

    const getCategoryColor = (category) => {
        switch (category?.toLowerCase()) {
            case 'food':
                return ['#f59e0b', '#d97706'];
            case 'education':
                return ['#3b82f6', '#2563eb'];
            case 'merchandise':
                return ['#8b5cf6', '#7c3aed'];
            case 'fitness':
                return ['#ec4899', '#db2777'];
            default:
                return ['#27ae60', '#229954'];
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={['#f0fdf4', '#dcfce7', '#bbf7d0']} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#27ae60" />
                        <Text style={styles.loadingText}>Loading rewards...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#f0fdf4', '#dcfce7', '#ffffff']} style={styles.gradient}>
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
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ scale: headerScale }],
                    }}
                >
                    <LinearGradient colors={['#27ae60', '#229954', '#1e8449']} style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Eco Rewards</Text>
                            <View style={styles.pointsContainer}>
                                <Ionicons name="star" size={20} color="#fbbf24" />
                                <Text style={styles.headerSubtitle}>{userProfile?.points || 0} Points</Text>
                            </View>
                        </View>
                        <View style={styles.headerIconContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                style={styles.headerIcon}
                            >
                                <Ionicons name="gift" size={32} color="white" />
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
                    {/* Rewards Grid */}
                    {rewards.length > 0 ? (
                        <Animated.View
                            style={[
                                styles.rewardsGrid,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            {rewards.map((reward, index) => (
                                <Animated.View
                                    key={reward.id}
                                    style={[
                                        styles.rewardCard,
                                        {
                                            opacity: fadeAnim,
                                            transform: [
                                                {
                                                    translateX: fadeAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [index % 2 === 0 ? -50 : 50, 0],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#ffffff', '#f9fafb']}
                                        style={styles.cardGradient}
                                    >
                                        <View style={styles.cardContent}>
                                            {/* Icon */}
                                            <LinearGradient
                                                colors={getCategoryColor(reward.category)}
                                                style={styles.rewardImageContainer}
                                            >
                                                <Ionicons
                                                    name={getCategoryIcon(reward.category)}
                                                    size={32}
                                                    color="white"
                                                />
                                            </LinearGradient>

                                            {/* Info */}
                                            <View style={styles.rewardInfo}>
                                                <Text style={styles.rewardName} numberOfLines={2}>
                                                    {reward.name}
                                                </Text>
                                                <Text style={styles.rewardDescription} numberOfLines={2}>
                                                    {reward.description}
                                                </Text>

                                                <View style={styles.rewardFooter}>
                                                    <LinearGradient
                                                        colors={['#fbbf24', '#f59e0b']}
                                                        style={styles.pointsBadge}
                                                    >
                                                        <Ionicons name="star" size={14} color="white" />
                                                        <Text style={styles.pointsText}>{reward.points} pts</Text>
                                                    </LinearGradient>

                                                    <TouchableOpacity
                                                        style={styles.redeemButton}
                                                        onPress={() => handleRedeem(reward)}
                                                        disabled={
                                                            (userProfile?.points || 0) < reward.points ||
                                                            redeeming[reward.id] ||
                                                            !reward.available
                                                        }
                                                        activeOpacity={0.8}
                                                    >
                                                        <LinearGradient
                                                            colors={
                                                                (userProfile?.points || 0) >= reward.points
                                                                    ? ['#27ae60', '#229954']
                                                                    : ['#9ca3af', '#6b7280']
                                                            }
                                                            style={styles.redeemButtonGradient}
                                                        >
                                                            {redeeming[reward.id] ? (
                                                                <ActivityIndicator size="small" color="white" />
                                                            ) : (
                                                                <>
                                                                    <Text style={styles.redeemButtonText}>
                                                                        {(userProfile?.points || 0) >= reward.points
                                                                            ? 'Redeem'
                                                                            : 'Locked'}
                                                                    </Text>
                                                                    <Ionicons
                                                                        name={
                                                                            (userProfile?.points || 0) >= reward.points
                                                                                ? 'checkmark-circle'
                                                                                : 'lock-closed'
                                                                        }
                                                                        size={16}
                                                                        color="white"
                                                                    />
                                                                </>
                                                            )}
                                                        </LinearGradient>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </Animated.View>
                            ))}
                        </Animated.View>
                    ) : (
                        <Animated.View
                            style={[styles.emptyState, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}
                        >
                            <View style={styles.emptyIconContainer}>
                                <LinearGradient
                                    colors={['rgba(39, 174, 96, 0.2)', 'rgba(39, 174, 96, 0.05)']}
                                    style={styles.emptyIconCircle}
                                >
                                    <Ionicons name="gift-outline" size={60} color="#27ae60" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.emptyTitle}>No Rewards Available</Text>
                            <Text style={styles.emptySubtitle}>Initialize sample rewards to get started</Text>
                            <TouchableOpacity style={styles.initButton} onPress={handleManualInit} activeOpacity={0.8}>
                                <LinearGradient colors={['#27ae60', '#229954']} style={styles.initButtonGradient}>
                                    <Ionicons name="add-circle" size={20} color="white" />
                                    <Text style={styles.initButtonText}>Initialize Rewards</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Info Card */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <View style={styles.infoIconCircle}>
                                    <Ionicons name="information-circle" size={24} color="white" />
                                </View>
                                <Text style={styles.infoTitle}>How to Earn Points</Text>
                            </View>
                            <View style={styles.infoList}>
                                {[
                                    { icon: 'newspaper-outline', text: 'Paper/Cardboard: +3 pts', color: '#8b5cf6' },
                                    { icon: 'water-outline', text: 'Plastic Bottles: +5 pts', color: '#3b82f6' },
                                    { icon: 'nutrition-outline', text: 'Aluminum Cans: +7 pts', color: '#f59e0b' },
                                    { icon: 'wine-outline', text: 'Glass Bottles: +10 pts', color: '#10b981' },
                                ].map((item, index) => (
                                    <View key={index} style={styles.infoItem}>
                                        <View style={[styles.infoItemIcon, { backgroundColor: item.color }]}>
                                            <Ionicons name={item.icon} size={16} color="white" />
                                        </View>
                                        <Text style={styles.infoText}>{item.text}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={styles.scanButton}
                                onPress={() => navigation.navigate('Scanner')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                                    style={styles.scanButtonGradient}
                                >
                                    <Ionicons name="scan" size={20} color="white" />
                                    <Text style={styles.scanButtonText}>Start Scanning</Text>
                                </LinearGradient>
                            </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#27ae60',
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
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    headerSubtitle: {
        fontSize: 16,
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
    rewardsGrid: {
        gap: 16,
    },
    rewardCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardGradient: {
        padding: 16,
    },
    cardContent: {
        flexDirection: 'row',
    },
    rewardImageContainer: {
        width: 72,
        height: 72,
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
        fontSize: 17,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    rewardDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    rewardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    redeemButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    redeemButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    redeemButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    initButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    initButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 8,
    },
    initButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    infoCard: {
        borderRadius: 20,
        padding: 20,
        marginTop: 16,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    infoList: {
        marginBottom: 16,
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItemIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '600',
    },
    scanButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    scanButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
    },
    scanButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
