import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Dimensions
} from 'react-native';
import {
    Text,
    Card,
    ActivityIndicator,
    Badge,
    Avatar,
    Searchbar
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import {
    getStaffDashboardData,
    getStaffRedemptionHistory
} from '../services/database';
import { colors, gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function StaffDashboardScreen({ navigation }) {
    const { user, userProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState(null);
    const [redemptionHistory, setRedemptionHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredVouchers, setFilteredVouchers] = useState([]);

    const loadStaffData = async () => {
        try {
            setIsLoading(true);
            const [dashboardResult, historyResult] = await Promise.all([
                getStaffDashboardData(),
                getStaffRedemptionHistory(user.uid, 30)
            ]);

            if (dashboardResult.success) {
                setDashboardData(dashboardResult.data);
                setFilteredVouchers(dashboardResult.data.recentVouchers);
            }

            if (historyResult.success) {
                setRedemptionHistory(historyResult.data);
            }

        } catch (error) {
            console.error('Error loading staff data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStaffData();
    }, []);

    useEffect(() => {
        if (dashboardData?.recentVouchers) {
            const filtered = dashboardData.recentVouchers.filter(voucher =>
                voucher.rewardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                voucher.voucherCode.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredVouchers(filtered);
        }
    }, [searchQuery, dashboardData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadStaffData();
        setIsRefreshing(false);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout from staff dashboard?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await logout();
                        if (!result.success) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color={colors.primary.main} />
                        <Text style={styles.loadingText}>Loading staff dashboard...</Text>
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
                    colors={[colors.accent.main, colors.accent.light, '#fbbf24']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>Staff Dashboard</Text>
                            <Text style={styles.headerSubtitle}>
                                Welcome back, {userProfile?.displayName || 'Staff Member'}
                            </Text>
                            <View style={styles.staffBadge}>
                                <Ionicons name="shield-checkmark" size={14} color="white" />
                                <Text style={styles.staffBadgeText}>STAFF MEMBER</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={handleRefresh}
                                style={styles.refreshButton}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                                    style={styles.headerButtonGradient}
                                >
                                    <Ionicons name="refresh" size={20} color="white" />
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleLogout}
                                style={styles.logoutButton}
                            >
                                <LinearGradient
                                    colors={['rgba(239,68,68,0.8)', 'rgba(220,38,38,0.8)']}
                                    style={styles.headerButtonGradient}
                                >
                                    <Ionicons name="log-out-outline" size={20} color="white" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { key: 'overview', title: 'Overview', icon: 'analytics-outline' },
                            { key: 'scanner', title: 'Scanner', icon: 'qr-code-outline' },
                            { key: 'vouchers', title: 'Vouchers', icon: 'ticket-outline' },
                            { key: 'students', title: 'Students', icon: 'school-outline' },
                            { key: 'history', title: 'History', icon: 'time-outline' }
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <LinearGradient
                                    colors={activeTab === tab.key ? gradients.accent : ['transparent', 'transparent']}
                                    style={styles.tabGradient}
                                >
                                    <Ionicons
                                        name={tab.icon}
                                        size={18}
                                        color={activeTab === tab.key ? 'white' : colors.text.secondary}
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
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                >
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <View>
                            {/* Main Stats */}
                            <View style={styles.mainStatsGrid}>
                                <Card style={styles.mainStatCard}>
                                    <LinearGradient
                                        colors={[colors.success.main, colors.success.light]}
                                        style={styles.mainStatGradient}
                                    >
                                        <View style={styles.mainStatContent}>
                                            <View style={styles.mainStatIcon}>
                                                <Ionicons name="checkmark-circle" size={32} color="white" />
                                            </View>
                                            <View style={styles.mainStatText}>
                                                <Text style={styles.mainStatValue}>{dashboardData?.todayRedemptions || 0}</Text>
                                                <Text style={styles.mainStatLabel}>Redeemed Today</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.mainStatCard}>
                                    <LinearGradient
                                        colors={[colors.primary.main, colors.primary.light]}
                                        style={styles.mainStatGradient}
                                    >
                                        <View style={styles.mainStatContent}>
                                            <View style={styles.mainStatIcon}>
                                                <Ionicons name="time" size={32} color="white" />
                                            </View>
                                            <View style={styles.mainStatText}>
                                                <Text style={styles.mainStatValue}>{dashboardData?.activeVouchers || 0}</Text>
                                                <Text style={styles.mainStatLabel}>Active Vouchers</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </Card>
                            </View>

                            {/* Quick Stats Row */}
                            <View style={styles.quickStatsRow}>
                                <Card style={styles.quickStatCard}>
                                    <LinearGradient
                                        colors={[colors.accent.main, colors.accent.light]}
                                        style={styles.quickStatGradient}
                                    >
                                        <Text style={styles.quickStatValue}>{dashboardData?.weekRedemptions || 0}</Text>
                                        <Text style={styles.quickStatLabel}>This Week</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.quickStatCard}>
                                    <LinearGradient
                                        colors={[colors.secondary.main, colors.secondary.light]}
                                        style={styles.quickStatGradient}
                                    >
                                        <Text style={styles.quickStatValue}>{dashboardData?.monthRedemptions || 0}</Text>
                                        <Text style={styles.quickStatLabel}>This Month</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.quickStatCard}>
                                    <LinearGradient
                                        colors={['#8b5cf6', '#a855f7']}
                                        style={styles.quickStatGradient}
                                    >
                                        <Text style={styles.quickStatValue}>{dashboardData?.activeStudents || 0}</Text>
                                        <Text style={styles.quickStatLabel}>Active Students</Text>
                                    </LinearGradient>
                                </Card>
                            </View>

                            {/* Popular Rewards */}
                            <Card style={styles.popularRewardsCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>Most Popular Rewards</Text>
                                    <Badge style={{ backgroundColor: colors.accent.main }}>
                                        Top 5
                                    </Badge>
                                </View>

                                {dashboardData?.popularRewards?.map(([rewardName, count], index) => (
                                    <View key={rewardName} style={styles.popularRewardItem}>
                                        <View style={styles.popularRewardRank}>
                                            <LinearGradient
                                                colors={index < 3 ? gradients.accent : gradients.primary}
                                                style={styles.popularRewardBadge}
                                            >
                                                <Text style={styles.popularRewardNumber}>#{index + 1}</Text>
                                            </LinearGradient>
                                        </View>
                                        <View style={styles.popularRewardInfo}>
                                            <Text style={styles.popularRewardName}>{rewardName}</Text>
                                            <Text style={styles.popularRewardCount}>{count} redemptions</Text>
                                        </View>
                                        <View style={styles.popularRewardStats}>
                                            <Text style={styles.popularRewardPercent}>
                                                {Math.round((count / (dashboardData?.redeemedVouchers || 1)) * 100)}%
                                            </Text>
                                        </View>
                                    </View>
                                ))}

                                {!dashboardData?.popularRewards?.length && (
                                    <View style={styles.emptyPopular}>
                                        <Text style={styles.emptyText}>No redemptions yet</Text>
                                    </View>
                                )}
                            </Card>
                        </View>
                    )}

                    {/* Scanner Tab */}
                    {activeTab === 'scanner' && (
                        <View>
                            {/* Big Scanner Button */}
                            <TouchableOpacity
                                style={styles.bigScannerButton}
                                onPress={() => navigation.navigate('StaffScanner')}
                            >
                                <LinearGradient
                                    colors={[colors.accent.main, colors.accent.light]}
                                    style={styles.bigScannerGradient}
                                >
                                    <View style={styles.scannerIconContainer}>
                                        <Ionicons name="qr-code" size={60} color="white" />
                                    </View>
                                    <Text style={styles.bigScannerTitle}>Scan Student Voucher</Text>
                                    <Text style={styles.bigScannerSubtitle}>
                                        Tap to open QR code scanner
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Today's Stats */}
                            <Card style={styles.todayStatsCard}>
                                <View style={styles.todayStatsHeader}>
                                    <Text style={styles.cardTitle}>Today's Activity</Text>
                                    <Badge style={{ backgroundColor: colors.success.main }}>
                                        {dashboardData?.todayRedemptions || 0} scanned
                                    </Badge>
                                </View>

                                <View style={styles.todayStatsGrid}>
                                    <View style={styles.todayStatItem}>
                                        <LinearGradient
                                            colors={gradients.success}
                                            style={styles.todayStatIcon}
                                        >
                                            <Ionicons name="checkmark-circle" size={20} color="white" />
                                        </LinearGradient>
                                        <Text style={styles.todayStatValue}>{dashboardData?.todayRedemptions || 0}</Text>
                                        <Text style={styles.todayStatLabel}>Scanned</Text>
                                    </View>

                                    <View style={styles.todayStatItem}>
                                        <LinearGradient
                                            colors={gradients.primary}
                                            style={styles.todayStatIcon}
                                        >
                                            <Ionicons name="time" size={20} color="white" />
                                        </LinearGradient>
                                        <Text style={styles.todayStatValue}>{dashboardData?.activeVouchers || 0}</Text>
                                        <Text style={styles.todayStatLabel}>Pending</Text>
                                    </View>

                                    <View style={styles.todayStatItem}>
                                        <LinearGradient
                                            colors={gradients.accent}
                                            style={styles.todayStatIcon}
                                        >
                                            <Ionicons name="people" size={20} color="white" />
                                        </LinearGradient>
                                        <Text style={styles.todayStatValue}>{dashboardData?.activeStudents || 0}</Text>
                                        <Text style={styles.todayStatLabel}>Students</Text>
                                    </View>
                                </View>
                            </Card>

                            {/* Quick Instructions */}
                            <Card style={styles.quickInstructionsCard}>
                                <LinearGradient
                                    colors={[colors.secondary.main, colors.secondary.light]}
                                    style={styles.quickInstructionsGradient}
                                >
                                    <View style={styles.quickInstructionsHeader}>
                                        <Ionicons name="help-circle" size={20} color="white" />
                                        <Text style={styles.quickInstructionsTitle}>Quick Guide</Text>
                                    </View>
                                    <Text style={styles.quickInstructionsText}>
                                        1. Student shows voucher QR code{'\n'}
                                        2. Tap "Scan Student Voucher" above{'\n'}
                                        3. Point camera at QR code{'\n'}
                                        4. Confirm redemption and give reward
                                    </Text>
                                </LinearGradient>
                            </Card>
                        </View>
                    )}

                    {/* Vouchers Tab */}
                    {activeTab === 'vouchers' && (
                        <View>
                            {/* Search Bar */}
                            <Searchbar
                                placeholder="Search vouchers..."
                                onChangeText={setSearchQuery}
                                value={searchQuery}
                                style={styles.searchBar}
                                theme={{
                                    colors: {
                                        primary: colors.accent.main,
                                    }
                                }}
                            />

                            {/* Voucher Status Overview */}
                            <View style={styles.voucherStatusGrid}>
                                <Card style={styles.statusCard}>
                                    <LinearGradient
                                        colors={gradients.success}
                                        style={styles.statusGradient}
                                    >
                                        <Ionicons name="qr-code" size={20} color="white" />
                                        <Text style={styles.statusValue}>{dashboardData?.activeVouchers || 0}</Text>
                                        <Text style={styles.statusLabel}>Active</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.statusCard}>
                                    <LinearGradient
                                        colors={[colors.text.secondary, colors.text.light]}
                                        style={styles.statusGradient}
                                    >
                                        <Ionicons name="checkmark-circle" size={20} color="white" />
                                        <Text style={styles.statusValue}>{dashboardData?.redeemedVouchers || 0}</Text>
                                        <Text style={styles.statusLabel}>Redeemed</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.statusCard}>
                                    <LinearGradient
                                        colors={['#ef4444', '#dc2626']}
                                        style={styles.statusGradient}
                                    >
                                        <Ionicons name="time" size={20} color="white" />
                                        <Text style={styles.statusValue}>{dashboardData?.expiredVouchers || 0}</Text>
                                        <Text style={styles.statusLabel}>Expired</Text>
                                    </LinearGradient>
                                </Card>
                            </View>

                            {/* Vouchers List */}
                            <Card style={styles.vouchersListCard}>
                                <Text style={styles.cardTitle}>All Vouchers ({filteredVouchers.length})</Text>

                                {filteredVouchers.map((voucher) => (
                                    <View key={voucher.id} style={styles.voucherListItem}>
                                        <View style={styles.voucherIconContainer}>
                                            <LinearGradient
                                                colors={voucher.status === 'active' ? gradients.success :
                                                    voucher.status === 'redeemed' ? [colors.text.secondary, colors.text.light] :
                                                        ['#ef4444', '#dc2626']}
                                                style={styles.voucherIcon}
                                            >
                                                <Ionicons
                                                    name={voucher.status === 'active' ? 'qr-code' :
                                                        voucher.status === 'redeemed' ? 'checkmark-circle' : 'time'}
                                                    size={16}
                                                    color="white"
                                                />
                                            </LinearGradient>
                                        </View>
                                        <View style={styles.voucherListInfo}>
                                            <Text style={styles.voucherListName}>{voucher.rewardName}</Text>
                                            <Text style={styles.voucherListCode}>{voucher.voucherCode}</Text>
                                            <Text style={styles.voucherListDate}>
                                                {new Date(voucher.createdAt).toLocaleDateString()} • {voucher.pointsCost} pts
                                            </Text>
                                        </View>
                                        <View style={styles.voucherListStatus}>
                                            <Badge
                                                style={[
                                                    styles.voucherStatusBadge,
                                                    { backgroundColor:
                                                            voucher.status === 'active' ? colors.success.main :
                                                                voucher.status === 'redeemed' ? colors.text.secondary : '#ef4444'
                                                    }
                                                ]}
                                            >
                                                {voucher.status}
                                            </Badge>
                                        </View>
                                    </View>
                                ))}

                                {filteredVouchers.length === 0 && (
                                    <View style={styles.emptyVouchers}>
                                        <Ionicons name="search" size={40} color={colors.text.light} />
                                        <Text style={styles.emptyText}>
                                            {searchQuery ? 'No vouchers match your search' : 'No vouchers found'}
                                        </Text>
                                    </View>
                                )}
                            </Card>
                        </View>
                    )}

                    {/* Students Tab */}
                    {activeTab === 'students' && (
                        <View>
                            <Card style={styles.studentsCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>Active Students</Text>
                                    <Badge style={{ backgroundColor: colors.primary.main }}>
                                        {dashboardData?.topStudents?.length || 0}
                                    </Badge>
                                </View>

                                {dashboardData?.topStudents?.map((student, index) => (
                                    <View key={student.id} style={styles.studentListItem}>
                                        <View style={styles.studentRank}>
                                            <LinearGradient
                                                colors={index < 3 ? gradients.accent : gradients.primary}
                                                style={styles.rankBadge}
                                            >
                                                <Text style={styles.rankText}>#{index + 1}</Text>
                                            </LinearGradient>
                                        </View>
                                        <View style={styles.studentListInfo}>
                                            <Text style={styles.studentListName}>{student.displayName || 'Student'}</Text>
                                            <Text style={styles.studentListEmail}>{student.email}</Text>
                                            <Text style={styles.studentListStats}>
                                                {student.totalScans || 0} items • {student.points || 0} pts • Level {student.level || 1}
                                            </Text>
                                        </View>
                                        <View style={styles.studentListLevel}>
                                            <LinearGradient
                                                colors={gradients.success}
                                                style={styles.levelBadge}
                                            >
                                                <Text style={styles.levelBadgeText}>L{student.level || 1}</Text>
                                            </LinearGradient>
                                        </View>
                                    </View>
                                ))}

                                {!dashboardData?.topStudents?.length && (
                                    <View style={styles.emptyStudents}>
                                        <Ionicons name="school-outline" size={40} color={colors.text.light} />
                                        <Text style={styles.emptyText}>No active students</Text>
                                    </View>
                                )}
                            </Card>
                        </View>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <View>
                            <Card style={styles.historyCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>My Redemption History</Text>
                                    <Badge style={{ backgroundColor: colors.accent.main }}>
                                        {redemptionHistory.length}
                                    </Badge>
                                </View>

                                {redemptionHistory.map((redemption) => (
                                    <View key={redemption.id} style={styles.historyItem}>
                                        <View style={styles.historyIcon}>
                                            <LinearGradient
                                                colors={gradients.success}
                                                style={styles.historyIconGradient}
                                            >
                                                <Ionicons name="checkmark-circle" size={16} color="white" />
                                            </LinearGradient>
                                        </View>
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyReward}>{redemption.rewardName}</Text>
                                            <Text style={styles.historyCode}>{redemption.voucherCode}</Text>
                                            <Text style={styles.historyDate}>
                                                {new Date(redemption.redeemedAt).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View style={styles.historyPoints}>
                                            <Text style={styles.historyPointsText}>{redemption.pointsCost} pts</Text>
                                        </View>
                                    </View>
                                ))}

                                {redemptionHistory.length === 0 && (
                                    <View style={styles.emptyHistory}>
                                        <Ionicons name="time-outline" size={40} color={colors.text.light} />
                                        <Text style={styles.emptyText}>No redemptions yet</Text>
                                        <Text style={styles.emptySubtext}>Your voucher scans will appear here</Text>
                                    </View>
                                )}
                            </Card>
                        </View>
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
    header: {
        padding: 20,
        paddingBottom: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        marginBottom: 12,
    },
    staffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    staffBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    refreshButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    logoutButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerButtonGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        backgroundColor: colors.surface.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        elevation: 2,
    },
    tab: {
        marginRight: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    activeTab: {
        elevation: 4,
    },
    tabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    tabText: {
        fontSize: 13,
        color: colors.text.secondary,
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
    },
    mainStatsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    mainStatCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 6,
    },
    mainStatGradient: {
        padding: 20,
    },
    mainStatContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainStatIcon: {
        marginRight: 16,
    },
    mainStatText: {
        flex: 1,
    },
    mainStatValue: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
        marginBottom: 4,
    },
    mainStatLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    quickStatsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    quickStatCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
    },
    quickStatGradient: {
        padding: 12,
        alignItems: 'center',
    },
    quickStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginBottom: 2,
    },
    quickStatLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    bigScannerButton: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 8,
    },
    bigScannerGradient: {
        padding: 40,
        alignItems: 'center',
    },
    scannerIconContainer: {
        marginBottom: 16,
    },
    bigScannerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: 'white',
        marginBottom: 8,
    },
    bigScannerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    todayStatsCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        marginBottom: 16,
    },
    todayStatsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    todayStatsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    todayStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    todayStatIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    todayStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    todayStatLabel: {
        fontSize: 12,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    quickInstructionsCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    quickInstructionsGradient: {
        padding: 16,
    },
    quickInstructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    quickInstructionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginLeft: 8,
    },
    quickInstructionsText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
    },
    searchBar: {
        marginBottom: 16,
        elevation: 2,
    },
    voucherStatusGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    statusCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
    },
    statusGradient: {
        padding: 12,
        alignItems: 'center',
    },
    statusValue: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginTop: 4,
    },
    statusLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    vouchersListCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 4,
    },
    voucherListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    voucherIconContainer: {
        marginRight: 12,
    },
    voucherIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voucherListInfo: {
        flex: 1,
    },
    voucherListName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    voucherListCode: {
        fontSize: 11,
        color: colors.text.secondary,
        fontFamily: 'monospace',
        marginTop: 2,
    },
    voucherListDate: {
        fontSize: 10,
        color: colors.text.light,
        marginTop: 2,
    },
    voucherListStatus: {
        marginLeft: 12,
    },
    voucherStatusBadge: {
        fontSize: 9,
    },
    studentsCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 4,
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
    studentListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    studentRank: {
        marginRight: 12,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
    },
    studentListInfo: {
        flex: 1,
    },
    studentListName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    studentListEmail: {
        fontSize: 11,
        color: colors.text.secondary,
        marginTop: 2,
    },
    studentListStats: {
        fontSize: 10,
        color: colors.text.light,
        marginTop: 2,
    },
    studentListLevel: {
        marginLeft: 12,
    },
    levelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'white',
    },
    popularRewardsCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 4,
    },
    popularRewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    popularRewardRank: {
        marginRight: 12,
    },
    popularRewardBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    popularRewardNumber: {
        fontSize: 11,
        fontWeight: '700',
        color: 'white',
    },
    popularRewardInfo: {
        flex: 1,
    },
    popularRewardName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    popularRewardCount: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 2,
    },
    popularRewardStats: {
        marginLeft: 12,
    },
    popularRewardPercent: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.accent.main,
    },
    historyCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 4,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    historyIcon: {
        marginRight: 12,
    },
    historyIconGradient: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyInfo: {
        flex: 1,
    },
    historyReward: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    historyCode: {
        fontSize: 11,
        color: colors.text.secondary,
        fontFamily: 'monospace',
        marginTop: 2,
    },
    historyDate: {
        fontSize: 10,
        color: colors.text.light,
        marginTop: 2,
    },
    historyPoints: {
        marginLeft: 12,
    },
    historyPointsText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.success.main,
    },
    emptyVouchers: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStudents: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyHistory: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyPopular: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.secondary,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 12,
        color: colors.text.light,
        textAlign: 'center',
        marginTop: 4,
    },
});
