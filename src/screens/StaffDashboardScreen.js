import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Dimensions,
    Animated,
    FlatList,
} from 'react-native';
import {
    Text,
    Card,
    ActivityIndicator,
    Badge,
    Searchbar,
    Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import {
    getAllVouchers,
    getStaffDashboardData,
    getStaffRedemptionHistory,
} from '../services/database';
import { colors, gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function StaffDashboardScreen({ navigation }) {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [filteredVouchers, setFilteredVouchers] = useState([]);
    const [redemptionHistory, setRedemptionHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [voucherFilter, setVoucherFilter] = useState('all'); // all, active, redeemed

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Entrance animations
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideUpAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        loadStaffData();
    }, []);

    // Voucher search and filtering
    useEffect(() => {
        let filtered = vouchers;

        // Apply status filter
        if (voucherFilter !== 'all') {
            filtered = filtered.filter(voucher => voucher.status === voucherFilter);
        }

        // Apply search filter
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(voucher =>
                (voucher.rewardName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (voucher.voucherCode?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (voucher.userId?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredVouchers(filtered);
    }, [searchQuery, vouchers, voucherFilter]);

    const loadStaffData = async () => {
        try {
            setIsLoading(true);
            const [dashboardResult, vouchersResult, historyResult] = await Promise.all([
                getStaffDashboardData(),
                getAllVouchers(),
                getStaffRedemptionHistory(user.uid, 50)
            ]);

            if (dashboardResult.success) setDashboardData(dashboardResult.data);
            if (vouchersResult.success) {
                const sortedVouchers = vouchersResult.data.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setVouchers(sortedVouchers);
                setFilteredVouchers(sortedVouchers);
            }
            if (historyResult.success) setRedemptionHistory(historyResult.data);

        } catch (error) {
            console.error('Error loading staff data:', error);
            Alert.alert('Error', 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadStaffData();
        setIsRefreshing(false);
    };

    const getVoucherStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#22c55e';
            case 'redeemed':
                return '#3b82f6';
            case 'expired':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderVoucherItem = ({ item: voucher }) => (
        <Animated.View
            style={[
                styles.voucherItemAnimated,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
                },
            ]}
        >
            <Card style={styles.voucherCard}>
                <View style={styles.voucherItem}>
                    <View style={styles.voucherInfo}>
                        <View style={styles.voucherHeader}>
                            <Text style={styles.voucherRewardName}>{voucher.rewardName}</Text>
                            <Badge
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: getVoucherStatusColor(voucher.status) }
                                ]}
                            >
                                {voucher.status}
                            </Badge>
                        </View>
                        <Text style={styles.voucherCode}>Code: {voucher.voucherCode}</Text>
                        <Text style={styles.voucherMeta}>
                            {voucher.pointsCost} pts • {getTimeAgo(voucher.createdAt)}
                        </Text>
                        {voucher.status === 'redeemed' && voucher.redeemedByName && (
                            <Text style={styles.redeemedBy}>
                                Redeemed by: {voucher.redeemedByName}
                            </Text>
                        )}
                    </View>
                    <View style={styles.voucherActions}>
                        {voucher.status === 'active' && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('SharedStaffScanner')}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    style={styles.actionButtonGradient}
                                >
                                    <Ionicons name="qr-code" size={16} color="white" />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Card>
        </Animated.View>
    );

    const renderHistoryItem = ({ item: redemption }) => (
        <Animated.View
            style={[
                styles.historyItemAnimated,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                },
            ]}
        >
            <Card style={styles.historyCard}>
                <View style={styles.historyItem}>
                    <View style={styles.historyIcon}>
                        <LinearGradient
                            colors={['#22c55e', '#16a34a']}
                            style={styles.historyIconGradient}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="white" />
                        </LinearGradient>
                    </View>
                    <View style={styles.historyInfo}>
                        <Text style={styles.historyReward}>{redemption.rewardName}</Text>
                        <Text style={styles.historyCode}>Code: {redemption.voucherCode}</Text>
                        <Text style={styles.historyTime}>
                            {getTimeAgo(redemption.redeemedAt)} • {redemption.pointsCost} pts
                        </Text>
                    </View>
                </View>
            </Card>
        </Animated.View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={['#fed7aa', '#fdba74', '#ffffff']} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#f59e0b" />
                        <Text style={styles.loadingText}>Loading staff dashboard...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fed7aa', '#fdba74', '#ffffff']} style={styles.gradient}>
                {/* Enhanced Header */}
                <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    style={styles.header}
                >
                    <Animated.View
                        style={[
                            styles.headerContent,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideUpAnim }],
                            },
                        ]}
                    >
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerTitle}>Staff Dashboard</Text>
                            <Text style={styles.headerSubtitle}>
                                Welcome, {userProfile?.displayName || 'Staff Member'}! 🎫
                            </Text>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('SharedStaffScanner')}
                                style={styles.scannerButton}
                            >
                                <Ionicons name="qr-code-outline" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </LinearGradient>

                {/* Tab Navigation */}
                <Animated.View
                    style={[
                        styles.tabContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { key: 'overview', title: 'Overview', icon: 'analytics-outline', color: '#f59e0b' },
                            { key: 'vouchers', title: 'Vouchers', icon: 'qr-code-outline', color: '#3b82f6' },
                            { key: 'history', title: 'My Scans', icon: 'time-outline', color: '#22c55e' }
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <LinearGradient
                                    colors={activeTab === tab.key ? [tab.color, tab.color + '80'] : ['transparent', 'transparent']}
                                    style={styles.tabGradient}
                                >
                                    <Ionicons
                                        name={tab.icon}
                                        size={18}
                                        color={activeTab === tab.key ? 'white' : '#7f8c8d'}
                                    />
                                    <Text style={[
                                        styles.tabText,
                                        activeTab === tab.key && styles.activeTabText
                                    ]}>
                                        {tab.title}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* FIXED: Conditional content rendering to avoid VirtualizedList nesting */}
                {activeTab === 'overview' && (
                    // Overview tab uses ScrollView - no VirtualizedList
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={['#f59e0b']}
                                tintColor={'#f59e0b'}
                            />
                        }
                    >
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideUpAnim }],
                            }}
                        >
                            {/* Stats Grid */}
                            <View style={styles.statsGrid}>
                                <Card style={styles.statCard}>
                                    <LinearGradient
                                        colors={['#22c55e', '#16a34a']}
                                        style={styles.statGradient}
                                    >
                                        <Ionicons name="qr-code" size={28} color="white" />
                                        <Text style={styles.statValue}>{dashboardData?.activeVouchers || 0}</Text>
                                        <Text style={styles.statLabel}>Active Vouchers</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.statCard}>
                                    <LinearGradient
                                        colors={['#3b82f6', '#2563eb']}
                                        style={styles.statGradient}
                                    >
                                        <Ionicons name="checkmark-circle" size={28} color="white" />
                                        <Text style={styles.statValue}>{dashboardData?.redeemedVouchers || 0}</Text>
                                        <Text style={styles.statLabel}>Total Redeemed</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.statCard}>
                                    <LinearGradient
                                        colors={['#f59e0b', '#d97706']}
                                        style={styles.statGradient}
                                    >
                                        <Ionicons name="today" size={28} color="white" />
                                        <Text style={styles.statValue}>{dashboardData?.todayRedemptions || 0}</Text>
                                        <Text style={styles.statLabel}>Today</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.statCard}>
                                    <LinearGradient
                                        colors={['#8b5cf6', '#7c3aed']}
                                        style={styles.statGradient}
                                    >
                                        <Ionicons name="calendar" size={28} color="white" />
                                        <Text style={styles.statValue}>{dashboardData?.weekRedemptions || 0}</Text>
                                        <Text style={styles.statLabel}>This Week</Text>
                                    </LinearGradient>
                                </Card>
                            </View>

                            {/* Recent Activity */}
                            <Card style={styles.activityCard}>
                                <LinearGradient
                                    colors={['#f59e0b', '#fbbf24']}
                                    style={styles.activityHeader}
                                >
                                    <Ionicons name="pulse" size={24} color="white" />
                                    <Text style={styles.activityTitle}>📊 Quick Stats</Text>
                                </LinearGradient>
                                <View style={styles.activityContent}>
                                    <View style={styles.quickStat}>
                                        <Text style={styles.quickStatValue}>{dashboardData?.totalUsers || 0}</Text>
                                        <Text style={styles.quickStatLabel}>Total Students</Text>
                                    </View>
                                    <View style={styles.quickStat}>
                                        <Text style={styles.quickStatValue}>{dashboardData?.activeStudents || 0}</Text>
                                        <Text style={styles.quickStatLabel}>Active Students</Text>
                                    </View>
                                    <View style={styles.quickStat}>
                                        <Text style={styles.quickStatValue}>{dashboardData?.availableRewards || 0}</Text>
                                        <Text style={styles.quickStatLabel}>Available Rewards</Text>
                                    </View>
                                </View>
                            </Card>

                            {/* Popular Rewards */}
                            {dashboardData?.popularRewards && dashboardData.popularRewards.length > 0 && (
                                <Card style={styles.popularCard}>
                                    <View style={styles.popularHeader}>
                                        <Text style={styles.popularTitle}>🏆 Popular Rewards</Text>
                                    </View>
                                    <View style={styles.popularContent}>
                                        {dashboardData.popularRewards.slice(0, 3).map(([rewardName, count], index) => (
                                            <View key={index} style={styles.popularItem}>
                                                <View style={styles.popularRank}>
                                                    <Text style={styles.popularRankText}>#{index + 1}</Text>
                                                </View>
                                                <Text style={styles.popularName}>{rewardName}</Text>
                                                <Text style={styles.popularCount}>{count} redeemed</Text>
                                            </View>
                                        ))}
                                    </View>
                                </Card>
                            )}
                        </Animated.View>
                    </ScrollView>
                )}

                {/* FIXED: Vouchers Tab - Direct container without nested ScrollView */}
                {activeTab === 'vouchers' && (
                    <View style={styles.vouchersTabContainer}>
                        {/* Search and Filter */}
                        <Card style={styles.searchCard}>
                            <Searchbar
                                placeholder="Search vouchers by code, reward, or user..."
                                onChangeText={setSearchQuery}
                                value={searchQuery}
                                style={styles.searchBar}
                                iconColor="#f59e0b"
                                inputStyle={styles.searchInput}
                            />
                            <View style={styles.filterChips}>
                                {[
                                    { key: 'all', label: 'All', count: vouchers.length },
                                    { key: 'active', label: 'Active', count: vouchers.filter(v => v.status === 'active').length },
                                    { key: 'redeemed', label: 'Redeemed', count: vouchers.filter(v => v.status === 'redeemed').length }
                                ].map(filter => (
                                    <Chip
                                        key={filter.key}
                                        selected={voucherFilter === filter.key}
                                        onPress={() => setVoucherFilter(filter.key)}
                                        style={[
                                            styles.filterChip,
                                            voucherFilter === filter.key && styles.selectedChip
                                        ]}
                                        textStyle={[
                                            styles.filterChipText,
                                            voucherFilter === filter.key && styles.selectedChipText
                                        ]}
                                    >
                                        {filter.label} ({filter.count})
                                    </Chip>
                                ))}
                            </View>
                            <Text style={styles.searchResults}>
                                {filteredVouchers.length} of {vouchers.length} vouchers
                            </Text>
                        </Card>

                        {/* FIXED: Direct FlatList without ScrollView wrapper */}
                        <FlatList
                            data={filteredVouchers}
                            renderItem={renderVoucherItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.vouchersList}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefreshing}
                                    onRefresh={handleRefresh}
                                    colors={['#f59e0b']}
                                    tintColor={'#f59e0b'}
                                />
                            }
                            style={styles.vouchersListContainer}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="qr-code-outline" size={64} color="#d1d5db" />
                                    <Text style={styles.emptyTitle}>No vouchers found</Text>
                                    <Text style={styles.emptyText}>
                                        {searchQuery ? 'Try adjusting your search terms' : 'Vouchers will appear here when students redeem rewards'}
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                )}

                {/* FIXED: History Tab - Direct container without nested ScrollView */}
                {activeTab === 'history' && (
                    <View style={styles.historyTabContainer}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.sectionTitle}>🕒 My Redemption History</Text>
                            <Text style={styles.sectionSubtitle}>
                                Vouchers you've personally redeemed ({redemptionHistory.length})
                            </Text>
                        </View>

                        {/* FIXED: Direct FlatList without ScrollView wrapper */}
                        <FlatList
                            data={redemptionHistory}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.historyList}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefreshing}
                                    onRefresh={handleRefresh}
                                    colors={['#f59e0b']}
                                    tintColor={'#f59e0b'}
                                />
                            }
                            style={styles.historyListContainer}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="time-outline" size={64} color="#d1d5db" />
                                    <Text style={styles.emptyTitle}>No redemptions yet</Text>
                                    <Text style={styles.emptyText}>
                                        Start scanning student vouchers to see your redemption history here
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.scanButton}
                                        onPress={() => navigation.navigate('SharedStaffScanner')}
                                    >
                                        <LinearGradient
                                            colors={['#f59e0b', '#d97706']}
                                            style={styles.scanButtonGradient}
                                        >
                                            <Ionicons name="qr-code" size={20} color="white" />
                                            <Text style={styles.scanButtonText}>Start Scanning</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    </View>
                )}
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
        color: '#f59e0b',
        fontWeight: '600',
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
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    scannerButton: {
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    tab: {
        marginRight: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    activeTab: {
        elevation: 2,
    },
    tabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    tabText: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '500',
        marginLeft: 6,
    },
    activeTabText: {
        color: 'white',
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    // FIXED: New container styles for tabs with FlatList
    vouchersTabContainer: {
        flex: 1,
        padding: 16,
    },
    vouchersListContainer: {
        flex: 1,
    },
    historyTabContainer: {
        flex: 1,
        padding: 16,
    },
    historyListContainer: {
        flex: 1,
    },
    historyHeader: {
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        width: '47%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
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
        marginTop: 4,
        textAlign: 'center',
    },
    activityCard: {
        borderRadius: 16,
        elevation: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    activityTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    activityContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: 'white',
    },
    quickStat: {
        alignItems: 'center',
    },
    quickStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    quickStatLabel: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    popularCard: {
        borderRadius: 16,
        elevation: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    popularHeader: {
        padding: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    popularTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
    },
    popularContent: {
        padding: 16,
        backgroundColor: 'white',
    },
    popularItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    popularRank: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    popularRankText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    popularName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    popularCount: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    searchCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    searchBar: {
        borderRadius: 12,
        elevation: 0,
        backgroundColor: '#f8f9fa',
    },
    searchInput: {
        fontSize: 16,
    },
    filterChips: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        flexWrap: 'wrap',
    },
    filterChip: {
        backgroundColor: '#f1f5f9',
    },
    selectedChip: {
        backgroundColor: '#f59e0b',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    selectedChipText: {
        color: 'white',
    },
    searchResults: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
    vouchersList: {
        paddingBottom: 80,
    },
    voucherItemAnimated: {
        marginBottom: 12,
    },
    voucherCard: {
        borderRadius: 16,
        elevation: 2,
    },
    voucherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    voucherInfo: {
        flex: 1,
    },
    voucherHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    voucherRewardName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginRight: 8,
        flex: 1,
    },
    statusBadge: {
        fontSize: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    voucherCode: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'monospace',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    voucherMeta: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    redeemedBy: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
    },
    voucherActions: {
        marginLeft: 12,
    },
    actionButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    historyList: {
        paddingBottom: 80,
    },
    historyItemAnimated: {
        marginBottom: 8,
    },
    historyCard: {
        borderRadius: 12,
        elevation: 1,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    historyIcon: {
        marginRight: 12,
    },
    historyIconGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyInfo: {
        flex: 1,
    },
    historyReward: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    historyCode: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'monospace',
        marginBottom: 2,
    },
    historyTime: {
        fontSize: 11,
        color: '#9ca3af',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    scanButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    scanButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    scanButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
