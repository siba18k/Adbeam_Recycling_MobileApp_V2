import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    Modal,
    RefreshControl,
    FlatList
} from 'react-native';
import {
    Text,
    Card,
    Button,
    TextInput,
    ActivityIndicator,
    Badge,
    Chip
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import {
    getAllUsers,
    getAllVouchers,
    getAppStats,
    createReward,
    updateReward,
    deleteReward,
    updateUserRole,
    getRewards
} from '../services/database';
import { colors, gradients } from '../theme/colors';

export default function AdminDashboardScreen({ navigation }) {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingReward, setEditingReward] = useState(null);

    const [newReward, setNewReward] = useState({
        name: '',
        description: '',
        points: '',
        category: 'merchandise',
        stock: '100',
        available: true
    });

    const loadAdminData = async () => {
        try {
            setIsLoading(true);
            const [statsResult, usersResult, rewardsResult, vouchersResult] = await Promise.all([
                getAppStats(),
                getAllUsers(),
                getRewards(),
                getAllVouchers()
            ]);

            if (statsResult.success) setStats(statsResult.data);
            if (usersResult.success) setUsers(usersResult.data);
            if (rewardsResult.success) setRewards(rewardsResult.data);
            if (vouchersResult.success) setVouchers(vouchersResult.data);

        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadAdminData();
        setIsRefreshing(false);
    };

    const handleCreateReward = async () => {
        if (!newReward.name || !newReward.description || !newReward.points) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const rewardData = {
            ...newReward,
            points: parseInt(newReward.points),
            stock: parseInt(newReward.stock),
        };

        const result = await createReward(rewardData);

        if (result.success) {
            Alert.alert('Success', 'Reward created successfully!');
            setShowCreateModal(false);
            setNewReward({
                name: '',
                description: '',
                points: '',
                category: 'merchandise',
                stock: '100',
                available: true
            });
            await loadAdminData();
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleDeleteReward = (reward) => {
        Alert.alert(
            'Delete Reward',
            `Are you sure you want to delete "${reward.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await deleteReward(reward.id);
                        if (result.success) {
                            Alert.alert('Success', 'Reward deleted successfully');
                            await loadAdminData();
                        } else {
                            Alert.alert('Error', result.error);
                        }
                    }
                }
            ]
        );
    };

    const handleToggleUserRole = (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        Alert.alert(
            'Change User Role',
            `Make ${user.displayName || user.email} ${newRole === 'admin' ? 'an admin' : 'a regular user'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: `Make ${newRole === 'admin' ? 'Admin' : 'User'}`,
                    onPress: async () => {
                        const result = await updateUserRole(user.id, newRole);
                        if (result.success) {
                            Alert.alert('Success', `User role updated to ${newRole}`);
                            await loadAdminData();
                        } else {
                            Alert.alert('Error', result.error);
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
                        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
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
                        <Text style={styles.headerTitle}>Admin Dashboard</Text>
                        <Text style={styles.headerSubtitle}>
                            {userProfile?.displayName || 'Administrator'}
                        </Text>
                    </View>
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
                </LinearGradient>

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { key: 'overview', title: 'Overview', icon: 'analytics-outline' },
                            { key: 'users', title: 'Users', icon: 'people-outline' },
                            { key: 'rewards', title: 'Rewards', icon: 'gift-outline' },
                            { key: 'vouchers', title: 'Vouchers', icon: 'qr-code-outline' }
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <LinearGradient
                                    colors={activeTab === tab.key ? gradients.primary : ['transparent', 'transparent']}
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
                            <View style={styles.statsGrid}>
                                <Card style={styles.statCard}>
                                    <LinearGradient
                                        colors={[colors.primary.main, colors.primary.light]}
                                        style={styles.statGradient}
                                    >
                                        <Ionicons name="people" size={24} color="white" />
                                        <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
                                        <Text style={styles.statLabel}>Total Users</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.statCard}>
                                    <LinearGradient
                                        colors={[colors.success.main, colors.success.light]}
                                        style={styles.statGradient}
                                    >
                                        <Ionicons name="leaf" size={24} color="white" />
                                        <Text style={styles.statValue}>{stats?.totalScans || 0}</Text>
                                        <Text style={styles.statLabel}>Items Recycled</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.statCard}>
                                    <LinearGradient
                                        colors={[colors.accent.main, colors.accent.light]}
                                        style={styles.statGradient}
                                    >
                                        <Ionicons name="qr-code" size={24} color="white" />
                                        <Text style={styles.statValue}>{stats?.activeVouchers || 0}</Text>
                                        <Text style={styles.statLabel}>Active Vouchers</Text>
                                    </LinearGradient>
                                </Card>

                                <Card style={styles.statCard}>
                                    <LinearGradient
                                        colors={[colors.secondary.main, colors.secondary.light]}
                                        style={styles.statGradient}
                                    >
                                        <Ionicons name="star" size={24} color="white" />
                                        <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
                                        <Text style={styles.statLabel}>Points Earned</Text>
                                    </LinearGradient>
                                </Card>
                            </View>

                            {/* Top Users */}
                            <Card style={styles.topUsersCard}>
                                <Text style={styles.cardTitle}>Top Recyclers</Text>
                                {stats?.topUsers?.slice(0, 5).map((user, index) => (
                                    <View key={user.id} style={styles.topUserItem}>
                                        <Text style={styles.topUserRank}>#{index + 1}</Text>
                                        <Text style={styles.topUserName}>{user.displayName || 'User'}</Text>
                                        <Text style={styles.topUserPoints}>{user.points || 0} pts</Text>
                                    </View>
                                ))}
                            </Card>
                        </View>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <View>
                            <Card style={styles.usersCard}>
                                <Text style={styles.cardTitle}>User Management ({users.length} users)</Text>

                                {users.map((user) => (
                                    <View key={user.id} style={styles.userItem}>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{user.displayName || 'User'}</Text>
                                            <Text style={styles.userEmail}>{user.email}</Text>
                                            <Text style={styles.userStats}>
                                                {user.points || 0} pts • Level {user.level || 1} • {user.totalScans || 0} scans
                                            </Text>
                                        </View>
                                        <View style={styles.userActions}>
                                            <TouchableOpacity
                                                style={styles.roleButton}
                                                onPress={() => handleToggleUserRole(user)}
                                            >
                                                <LinearGradient
                                                    colors={user.role === 'admin' ? gradients.secondary : gradients.primary}
                                                    style={styles.roleButtonGradient}
                                                >
                                                    <Text style={styles.roleButtonText}>
                                                        {user.role === 'admin' ? 'Admin' : 'Make Admin'}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </Card>
                        </View>
                    )}

                    {/* Rewards Tab */}
                    {activeTab === 'rewards' && (
                        <View>
                            <View style={styles.rewardsHeader}>
                                <Text style={styles.sectionTitle}>Rewards Management</Text>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => setShowCreateModal(true)}
                                >
                                    <LinearGradient
                                        colors={gradients.success}
                                        style={styles.addButtonGradient}
                                    >
                                        <Ionicons name="add" size={20} color="white" />
                                        <Text style={styles.addButtonText}>Add Reward</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {rewards.map((reward) => (
                                <Card key={reward.id} style={styles.rewardItem}>
                                    <View style={styles.rewardContent}>
                                        <View style={styles.rewardInfo}>
                                            <Text style={styles.rewardName}>{reward.name}</Text>
                                            <Text style={styles.rewardDescription}>{reward.description}</Text>
                                            <View style={styles.rewardMeta}>
                                                <Chip icon="star" textStyle={styles.chipText}>{reward.points} pts</Chip>
                                                <Chip icon="tag" textStyle={styles.chipText}>{reward.category}</Chip>
                                                <Chip
                                                    icon={reward.available ? "check-circle" : "close-circle"}
                                                    textStyle={styles.chipText}
                                                >
                                                    {reward.available ? 'Available' : 'Unavailable'}
                                                </Chip>
                                            </View>
                                        </View>
                                        <View style={styles.rewardActions}>
                                            <TouchableOpacity
                                                style={styles.editButton}
                                                onPress={() => setEditingReward(reward)}
                                            >
                                                <Ionicons name="pencil" size={16} color={colors.primary.main} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteReward(reward)}
                                            >
                                                <Ionicons name="trash" size={16} color={colors.status.error} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    )}

                    {/* Vouchers Tab */}
                    {activeTab === 'vouchers' && (
                        <View>
                            <Text style={styles.sectionTitle}>Voucher Management</Text>

                            <View style={styles.voucherStats}>
                                <Card style={styles.voucherStatCard}>
                                    <LinearGradient colors={gradients.success} style={styles.voucherStatGradient}>
                                        <Text style={styles.voucherStatValue}>{vouchers.filter(v => v.status === 'active').length}</Text>
                                        <Text style={styles.voucherStatLabel}>Active</Text>
                                    </LinearGradient>
                                </Card>
                                <Card style={styles.voucherStatCard}>
                                    <LinearGradient colors={gradients.accent} style={styles.voucherStatGradient}>
                                        <Text style={styles.voucherStatValue}>{vouchers.filter(v => v.status === 'redeemed').length}</Text>
                                        <Text style={styles.voucherStatLabel}>Redeemed</Text>
                                    </LinearGradient>
                                </Card>
                            </View>

                            {vouchers
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .map((voucher) => (
                                    <Card key={voucher.id} style={styles.voucherItem}>
                                        <View style={styles.voucherContent}>
                                            <View style={styles.voucherInfo}>
                                                <Text style={styles.voucherRewardName}>{voucher.rewardName}</Text>
                                                <Text style={styles.voucherCode}>{voucher.voucherCode}</Text>
                                                <Text style={styles.voucherUser}>
                                                    User ID: {voucher.userId?.substring(0, 8)}...
                                                </Text>
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
                                                <Text style={styles.voucherDate}>
                                                    {new Date(voucher.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </Card>
                                ))}
                        </View>
                    )}
                </ScrollView>

                {/* Create Reward Modal */}
                <Modal
                    visible={showCreateModal}
                    onDismiss={() => setShowCreateModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Reward</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                label="Reward Name *"
                                value={newReward.name}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, name: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Description *"
                                value={newReward.description}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, description: text }))}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Points Required *"
                                value={newReward.points}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, points: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Category"
                                value={newReward.category}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, category: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Stock Quantity"
                                value={newReward.stock}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, stock: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={handleCreateReward}
                                >
                                    <LinearGradient
                                        colors={gradients.success}
                                        style={styles.createButtonGradient}
                                    >
                                        <Text style={styles.createButtonText}>Create Reward</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Card>
                </Modal>
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
    tabContainer: {
        backgroundColor: colors.surface.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
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
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 16,
    },
    topUsersCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 16,
    },
    topUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    topUserRank: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.accent.main,
        width: 40,
    },
    topUserName: {
        flex: 1,
        fontSize: 14,
        color: colors.text.primary,
        fontWeight: '500',
    },
    topUserPoints: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.success.main,
    },
    usersCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 2,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    userEmail: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 2,
    },
    userStats: {
        fontSize: 12,
        color: colors.text.light,
        marginTop: 4,
    },
    userActions: {
        marginLeft: 12,
    },
    roleButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    roleButtonGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    roleButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    rewardsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    rewardItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    rewardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rewardInfo: {
        flex: 1,
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
        marginBottom: 8,
    },
    rewardMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    chipText: {
        fontSize: 10,
    },
    rewardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        padding: 8,
    },
    deleteButton: {
        padding: 8,
    },
    voucherStats: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    voucherStatCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    voucherStatGradient: {
        padding: 16,
        alignItems: 'center',
    },
    voucherStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    voucherStatLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    voucherItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    voucherContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    voucherInfo: {
        flex: 1,
    },
    voucherRewardName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    voucherCode: {
        fontSize: 12,
        color: colors.text.secondary,
        fontFamily: 'monospace',
        marginTop: 2,
    },
    voucherUser: {
        fontSize: 11,
        color: colors.text.light,
        marginTop: 4,
    },
    voucherStatus: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        marginBottom: 4,
    },
    voucherDate: {
        fontSize: 11,
        color: colors.text.light,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        borderRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.light,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.primary,
    },
    modalContent: {
        padding: 20,
    },
    modalInput: {
        marginBottom: 16,
    },
    modalActions: {
        marginTop: 16,
    },
    createButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    createButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
