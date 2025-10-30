import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    SafeAreaView,
    TouchableOpacity,
    Share,
    Dimensions,
    Animated,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';
import { getUserVouchers } from '../services/database';

const { width } = Dimensions.get('window');

export default function VouchersScreen({ navigation }) {
    const { user } = useAuth();
    const [vouchers, setVouchers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedVoucher, setExpandedVoucher] = useState(null);

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

    const loadVouchers = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const result = await getUserVouchers(user.uid);

            if (result.success) {
                setVouchers(result.data);
            } else {
                setVouchers([]);
            }
        } catch (error) {
            console.error('Error loading vouchers:', error);
            setVouchers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVouchers();
    }, [user]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadVouchers();
        setIsRefreshing(false);
    };

    const shareVoucher = async (voucher) => {
        try {
            const message = `My Adbeam Recycling Voucher\n\nReward: ${voucher.rewardName}\nCode: ${voucher.voucherCode}\nPoints Used: ${voucher.pointsCost}`;
            await Share.share({ message, title: 'My Eco Reward Voucher' });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return ['#27ae60', '#229954'];
            case 'redeemed':
                return ['#9ca3af', '#6b7280'];
            case 'expired':
                return ['#ef4444', '#dc2626'];
            default:
                return ['#3b82f6', '#2563eb'];
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return 'qr-code';
            case 'redeemed':
                return 'checkmark-circle';
            case 'expired':
                return 'time';
            default:
                return 'help-circle';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active':
                return 'Ready to Use';
            case 'redeemed':
                return 'Redeemed';
            case 'expired':
                return 'Expired';
            default:
                return 'Unknown';
        }
    };

    const isVoucherExpired = (voucher) => {
        if (voucher.status === 'redeemed') return false;
        const now = new Date();
        const expiryDate = new Date(voucher.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000);
        return now > expiryDate;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={['#f0fdf4', '#dcfce7', '#bbf7d0']} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#27ae60" />
                        <Text style={styles.loadingText}>Loading your vouchers...</Text>
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
                    style={[styles.floatingCircle, styles.
                        circle2, { transform: [{ translateY: float2 }] }]}
                />

                {/* Header */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: headerScale }] }}>
                    <LinearGradient colors={['#8b5cf6', '#7c3aed', '#6d28d9']} style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>My Vouchers</Text>
                            <View style={styles.voucherCountBadge}>
                                <Ionicons name="ticket" size={16} color="white" />
                                <Text style={styles.headerSubtitle}>
                                    {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.headerIconContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                style={styles.headerIcon}
                            >
                                <Ionicons name="qr-code" size={32} color="white" />
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
                    {vouchers.length > 0 ? (
                        <Animated.View
                            style={[styles.vouchersGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
                        >
                            {vouchers.map((voucher, index) => {
                                const isExpired = isVoucherExpired(voucher);
                                const currentStatus = isExpired && voucher.status === 'active' ? 'expired' : voucher.status;
                                const isExpanded = expandedVoucher === voucher.id;

                                return (
                                    <Animated.View
                                        key={voucher.id}
                                        style={[
                                            styles.voucherCard,
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
                                        <TouchableOpacity
                                            onPress={() => setExpandedVoucher(isExpanded ? null : voucher.id)}
                                            activeOpacity={0.9}
                                        >
                                            <LinearGradient colors={getStatusColor(currentStatus)} style={styles.voucherHeader}>
                                                <View style={styles.voucherHeaderContent}>
                                                    <View style={styles.voucherInfo}>
                                                        <Text style={styles.voucherRewardName} numberOfLines={2}>
                                                            {voucher.rewardName}
                                                        </Text>
                                                        <Text style={styles.voucherCode}>#{voucher.voucherCode}</Text>
                                                        <View style={styles.voucherMeta}>
                                                            <View style={styles.metaBadge}>
                                                                <Ionicons name="star" size={12} color="#fbbf24" />
                                                                <Text style={styles.metaText}>{voucher.pointsCost} pts</Text>
                                                            </View>
                                                            <View style={styles.metaBadge}>
                                                                <Ionicons name={getStatusIcon(currentStatus)} size={12} color="white" />
                                                                <Text style={styles.metaText}>{getStatusText(currentStatus)}</Text>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    <View style={styles.expandIcon}>
                                                        <Ionicons
                                                            name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                                                            size={28}
                                                            color="rgba(255,255,255,0.9)"
                                                        />
                                                    </View>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        {/* Expanded Section */}
                                        {isExpanded && (
                                            <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.voucherBody}>
                                                {currentStatus === 'active' ? (
                                                    <View style={styles.qrSection}>
                                                        <Text style={styles.qrTitle}>Show this QR code to redeem</Text>

                                                        <View style={styles.qrContainer}>
                                                            <View style={styles.qrBackground}>
                                                                <QRCode
                                                                    value={voucher.voucherCode}
                                                                    size={180}
                                                                    color="#1f2937"
                                                                    backgroundColor="white"
                                                                />
                                                            </View>
                                                        </View>

                                                        <View style={styles.codeContainer}>
                                                            <Text style={styles.qrCodeText}>{voucher.voucherCode}</Text>
                                                        </View>

                                                        <TouchableOpacity
                                                            style={styles.shareButton}
                                                            onPress={() => shareVoucher(voucher)}
                                                            activeOpacity={0.8}
                                                        >
                                                            <LinearGradient
                                                                colors={['#8b5cf6', '#7c3aed']}
                                                                style={styles.shareButtonGradient}
                                                            >
                                                                <Ionicons name="share-social" size={18} color="white" />
                                                                <Text style={styles.shareButtonText}>Share Voucher</Text>
                                                            </LinearGradient>
                                                        </TouchableOpacity>

                                                        <View style={styles.expiryInfo}>
                                                            <Ionicons name="time-outline" size={16} color="#6b7280" />
                                                            <Text style={styles.expiryText}>
                                                                Valid until{' '}
                                                                {new Date(
                                                                    voucher.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000
                                                                ).toLocaleDateString()}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ) : (
                                                    <View style={styles.redeemedSection}>
                                                        <LinearGradient
                                                            colors={getStatusColor(currentStatus)}
                                                            style={styles.redeemedIconGradient}
                                                        >
                                                            <Ionicons
                                                                name={
                                                                    currentStatus === 'redeemed'
                                                                        ? 'checkmark-circle'
                                                                        : 'time'
                                                                }
                                                                size={48}
                                                                color="white"
                                                            />
                                                        </LinearGradient>
                                                        <Text style={styles.redeemedTitle}>
                                                            {currentStatus === 'redeemed' ? 'Voucher Redeemed!' : 'Voucher Expired'}
                                                        </Text>
                                                        <Text style={styles.redeemedSubtitle}>
                                                            {currentStatus === 'redeemed'
                                                                ? 'This voucher has been successfully used'
                                                                : 'This voucher is no longer valid'}
                                                        </Text>
                                                        {voucher.redeemedAt && (
                                                            <Text style={styles.redeemedDate}>
                                                                {new Date(voucher.redeemedAt).toLocaleDateString()}
                                                            </Text>
                                                        )}
                                                    </View>
                                                )}
                                            </LinearGradient>
                                        )}
                                    </Animated.View>
                                );
                            })}
                        </Animated.View>
                    ) : (
                        <Animated.View
                            style={[styles.emptyState, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}
                        >
                            <LinearGradient
                                colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
                                style={styles.emptyIconContainer}
                            >
                                <Ionicons name="qr-code-outline" size={60} color="#8b5cf6" />
                            </LinearGradient>
                            <Text style={styles.emptyTitle}>No Vouchers Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Redeem rewards to get voucher codes that you can use on campus
                            </Text>
                            <TouchableOpacity
                                style={styles.rewardsButton}
                                onPress={() => navigation.navigate('Rewards')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.rewardsButtonGradient}>
                                    <Ionicons name="gift" size={20} color="white" />
                                    <Text style={styles.rewardsButtonText}>Browse Rewards</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Instructions Card */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.instructionsCard}>
                            <View style={styles.instructionsHeader}>
                                <View style={styles.instructionIconCircle}>
                                    <Ionicons name="information-circle" size={24} color="white" />
                                </View>
                                <Text style={styles.instructionsTitle}>How to Use Vouchers</Text>
                            </View>
                            <View style={styles.instructionsList}>
                                {[
                                    { num: '1', text: 'Redeem a reward to get a voucher QR code', icon: 'gift' },
                                    { num: '2', text: 'Show the QR code at the campus office', icon: 'qr-code' },
                                    { num: '3', text: 'Staff will scan it to complete redemption', icon: 'scan' },
                                    { num: '4', text: 'Receive your reward and notification!', icon: 'checkmark-circle' },
                                ].map((item, index) => (
                                    <View key={index} style={styles.instructionItem}>
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                                            style={styles.instructionNumber}
                                        >
                                            <Text style={styles.instructionNumText}>{item.num}</Text>
                                        </LinearGradient>
                                        <View style={styles.instructionTextContainer}>
                                            <Ionicons name={item.icon} size={16} color="rgba(255,255,255,0.9)" />
                                            <Text style={styles.instructionText}>{item.text}</Text>
                                        </View>
                                    </View>
                                ))}
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
        opacity: 0.1,
        backgroundColor: '#8b5cf6',
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
        shadowColor: '#8b5cf6',
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
    voucherCountBadge: {
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
    vouchersGrid: {
        gap: 16,
    },
    voucherCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    voucherHeader: {
        padding: 18,
    },
    voucherHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    voucherInfo: {
        flex: 1,
    },
    voucherRewardName: {
        fontSize: 17,
        fontWeight: '700',
        color: 'white',
        marginBottom: 6,
    },
    voucherCode: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 10,
    },
    voucherMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    metaText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    expandIcon: {
        marginLeft: 12,
    },
    voucherBody: {
        padding: 24,
    },
    qrSection: {
        alignItems: 'center',
    },
    qrTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 24,
        textAlign: 'center',
    },
    qrContainer: {
        marginBottom: 20,
    },
    qrBackground: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    codeContainer: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    qrCodeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        letterSpacing: 2,
        textAlign: 'center',
    },
    shareButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    shareButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    expiryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        gap: 8,
    },
    expiryText: {
        fontSize: 13,
        color: '#92400e',
        fontWeight: '600',
    },
    redeemedSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    redeemedIconGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    redeemedTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    redeemedSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
    },
    redeemedDate: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
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
        marginBottom: 28,
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    rewardsButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    rewardsButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 16,
        gap: 8,
    },
    rewardsButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    instructionsCard: {
        borderRadius: 20,
        padding: 24,
        marginTop: 16,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    instructionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    instructionsList: {
        gap: 14,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    instructionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    instructionNumText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    instructionTextContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: 'rgba(255,255,255,0.95)',
        lineHeight: 20,
        fontWeight: '500',
    },
});
