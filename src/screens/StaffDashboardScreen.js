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
    Avatar
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getAllVouchers, getStaffStats, getAllUsers } from '../services/database';
import { colors, gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function StaffDashboardScreen({ navigation }) {
    const { user, userProfile } = useAuth();
    const [vouchers, setVouchers] = useState([]);
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadStaffData = async () => {
        try {
            setIsLoading(true);
            const [vouchersResult, statsResult, usersResult] = await Promise.all([
                getAllVouchers(),
                getStaffStats(),
                getAllUsers()
            ]);

            if (vouchersResult.success) {
                // Filter to show recent vouchers only
                const recentVouchers = vouchersResult.data
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 20);
                setVouchers(recentVouchers);
            }

            if (statsResult.success) setStats(statsResult.data);

            if (usersResult.success) {
                // Show recent active users
                const activeUsers = usersResult.data
                    .filter(u => u.role === 'user' && u.totalScans > 0)
                    .sort((a, b) => (b.totalScans || 0) - (a.totalScans || 0))
                    .slice(0, 10);
                setRecentUsers(activeUsers);
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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadStaffData();
        setIsRefreshing(false);
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
                    colors={gradients.backgroundPrimary}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Staff Dashboard</Text>
                        <Text style={styles.headerSubtitle}>
                            {userProfile?.displayName || 'Staff Member'}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={handleRefresh}
                            style={styles.refreshButton}
                        >
                            <LinearGradient
                                colors={gradients.secondary}
                                style={styles.refreshButtonGradient}
                            >
                                <Ionicons name="refresh" size={20} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('StaffScanner')}
                            style={styles.scannerButton}
                        >
                            <LinearGradient
                                colors={gradients.accent}
                                style={styles.scannerButtonGradient}
                            >
                                <Ionicons name="qr-code-outline" size={24} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                >
                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('StaffScanner')}
                        >
                            <LinearGradient
                                colors={gradients.accent}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="qr-code" size={32} color="white" />
                                <Text style={styles.actionTitle}>Scan Vouchers</Text>
                                <Text style={styles.actionSubtitle}>Redeem student vouchers</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => Alert.alert('Feature Coming Soon', 'Student verification feature will be available soon')}
                        >
                            <LinearGradient
                                colors={gradients.secondary}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="school" size={32} color="white" />
                                <Text style={styles.actionTitle}>Verify Students</Text>
                                <Text style={styles.actionSubtitle}>Check student IDs</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Enhanced Stats Overview */}
                    <View style={styles.statsGrid}>
                        <Card style={styles.statCard}>
                            <LinearGradient
                                colors={[colors.success.main, colors.success.light]}
                                style={styles.statGradient}
                            >
                                <Ionicons name="checkmark-circle" size={24} color="white" />
                                <Text style={styles.statValue}>{stats?.todayRedemptions || 0}</Text>
                                <Text style={styles.statLabel}>Redeemed Today</Text>
                            </LinearGradient>
                        </Card>

                        <Card style={styles.statCard}>
                            <LinearGradient
                                colors={[colors.primary.main, colors.primary.light]}
                                style={styles.statGradient}
                            >
                                <Ionicons name="time" size={24} color="white" />
                                <Text style={styles.statValue}>{stats?.activeVouchers || 0}</Text>
                                <Text style={styles.statLabel}>Pending Vouchers</Text>
                            </LinearGradient>
                        </Card>

                        <Card style={styles.statCard}>
                            <LinearGradient
                                colors={[colors.accent.main, colors.accent.light]}
                                style={styles.statGradient}
                            >
                                <Ionicons name="calendar" size={24} color="white" />
                                <Text style={styles.statValue}>{stats?.weekRedemptions || 0}</Text>
                                <Text style={styles.statLabel}>This Week</Text>
                            </LinearGradient>
                        </Card>

                        <Card style={styles.statCard}>
                            <LinearGradient
                                colors={[colors.secondary.main, colors.secondary.light]}
                                style={styles.statGradient}
                            >
                                <Ionicons name="people" size={24} color="white" />
                                <Text style={styles.statValue}>{stats?.activeStudents || 0}</Text>
                                <Text style={styles.statLabel}>Active Students</Text>
                            </LinearGradient>
                        </Card>
                    </View>

                    {/* Active Students Overview */}
                    <Card style={styles.studentsCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Top Active Students</Text>
                            <Badge style={{ backgroundColor: colors.primary.main }}>
                                {recentUsers.length}
                            </Badge>
                        </View>

                        {recentUsers.slice(0, 8).map((student, index) => (
                            <View key={student.id} style={styles.studentItem}>
                                <View style={styles.studentRank}>
                                    <LinearGradient
                                        colors={index < 3 ? gradients.accent : gradients.primary}
                                        style={styles.rankBadge}
                                    >
                                        <Text style={styles.rankText}>#{index + 1}</Text>
                                    </LinearGradient>
                                </View>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.displayName || 'Student'}</Text>
                                    <Text style={styles.studentStats}>
                                        {student.totalScans || 0} scans • {student.points || 0} points
                                    </Text>
                                </View>
                                <View style={styles.studentLevel}>
                                    <Text style={styles.levelText}>L{student.level || 1}</Text>
                                </View>
                            </View>
                        ))}

                        {recentUsers.length === 0 && (
                            <View style={styles.emptyStudents}>
                                <Ionicons name="school-outline" size={40} color={colors.text.light} />
                                <Text style={styles.emptyText}>No active students</Text>
                                <Text style={styles.emptySubtext}>Students will appear here after they start recycling</Text>
                            </View>
                        )}
                    </Card>

                    {/* Recent Vouchers */}
                    <Card style={styles.vouchersCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Recent Vouchers</Text>
                            <Badge style={{ backgroundColor: colors.accent.main }}>
                                {vouchers.filter(v => v.status === 'active').length} active
                            </Badge>
                        </View>

                        {vouchers.slice(0, 10).map((voucher) => (
                            <View key={voucher.id} style={styles.voucherItem}>
                                <View style={styles.voucherIconContainer}>
                                    <LinearGradient
                                        colors={voucher.status === 'active' ? gradients.success : [colors.text.secondary, colors.text.light]}
                                        style={styles.voucherIcon}
                                    >
                                        <Ionicons
                                            name={voucher.status === 'active' ? 'qr-code' : 'checkmark-circle'}
                                            size={16}
                                            color="white"
                                        />
                                    </LinearGradient>
                                </View>
                                <View style={styles.voucherInfo}>
                                    <Text style={styles.voucherRewardName}>{voucher.rewardName}</Text>
                                    <Text style={styles.voucherCode}>{voucher.voucherCode}</Text>
                                    <Text style={styles.voucherDate}>
                                        Created: {new Date(voucher.createdAt).toLocaleDateString()}
                                    </Text>
                                    {voucher.redeemedAt && (
                                        <Text style={styles.voucherRedeemedDate}>
                                            Redeemed: {new Date(voucher.redeemedAt).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.voucherStatus}>
                                    <Badge
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: voucher.status === 'active' ? colors.success.main : colors.text.secondary }
                                        ]}
                                    >
                                        {voucher.status}
                                    </Badge>
                                </View>
                            </View>
                        ))}

                        {vouchers.length === 0 && (
                            <View style={styles.emptyVouchers}>
                                <Ionicons name="qr-code-outline" size={40} color={colors.text.light} />
                                <Text style={styles.emptyText}>No vouchers found</Text>
                                <Text style={styles.emptySubtext}>Vouchers will appear here when students redeem rewards</Text>
                            </View>
                        )}
                    </Card>

                    {/* Staff Instructions */}
                    <Card style={styles.instructionsCard}>
                        <LinearGradient
                            colors={[colors.accent.main, colors.accent.light]}
                            style={styles.instructionsGradient}
                        >
                            <View style={styles.instructionsHeader}>
                                <Ionicons name="information-circle" size={24} color="white" />
                                <Text style={styles.instructionsTitle}>Staff Instructions</Text>
                            </View>
                            <View style={styles.instructionsList}>
                                <View style={styles.instructionItem}>
                                    <Text style={styles.instructionNumber}>1</Text>
                                    <Text style={styles.instructionText}>Student shows you their voucher QR code</Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <Text style={styles.instructionNumber}>2</Text>
                                    <Text style={styles.instructionText}>Tap "Scan Vouchers" to open the scanner</Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <Text style={styles.instructionNumber}>3</Text>
                                    <Text style={styles.instructionText}>Point camera at the QR code to scan</Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <Text style={styles.instructionNumber}>4</Text>
                                    <Text style={styles.instructionText}>Give student their reward after successful scan</Text>
                                </View>
                            </View>
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
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    refreshButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    refreshButtonGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    scannerButtonGradient: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    actionGradient: {
        padding: 20,
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginTop: 12,
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        width: (width - 44) / 2,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    statGradient: {
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
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
    studentsCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        marginBottom: 16,
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
    studentItem: {
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
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    studentStats: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 2,
    },
    studentLevel: {
        marginLeft: 12,
    },
    levelText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.accent.main,
    },
    emptyStudents: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    vouchersCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        marginBottom: 16,
    },
    voucherItem: {
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
    voucherInfo: {
        flex: 1,
    },
    voucherRewardName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    voucherCode: {
        fontSize: 11,
        color: colors.text.secondary,
        fontFamily: 'monospace',
        marginTop: 2,
    },
    voucherDate: {
        fontSize: 10,
        color: colors.text.light,
        marginTop: 2,
    },
    voucherRedeemedDate: {
        fontSize: 10,
        color: colors.success.main,
        marginTop: 1,
    },
    voucherStatus: {
        marginLeft: 12,
    },
    statusBadge: {
        fontSize: 10,
    },
    emptyVouchers: {
        alignItems: 'center',
        paddingVertical: 40,
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
    instructionsCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    instructionsGradient: {
        padding: 20,
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginLeft: 8,
    },
    instructionsList: {
        gap: 12,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    instructionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginRight: 12,
        paddingTop: 4,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
    },
});
