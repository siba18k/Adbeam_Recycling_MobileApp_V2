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
} from 'react-native';
import {
    Text,
    Card,
    Button,
    TextInput,
    ActivityIndicator,
    Badge,
    Chip,
    Switch
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import {
    getAllUsers,
    getAllVouchers,
    getAppStats,
    createReward,
    editReward,
    deleteReward,
    updateUserRole,
    deleteUser,
    updateUserData,
    promoteToStaff,
    toggleRewardAvailability,
    getRewards,
    createRewardWithNotification,
    createBonusEvent
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUserEditModal, setShowUserEditModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    const [newReward, setNewReward] = useState({
        name: '',
        description: '',
        points: '',
        category: 'merchandise',
        stock: '100',
        available: true
    });

    const [editRewardData, setEditRewardData] = useState({
        name: '',
        description: '',
        points: '',
        category: '',
        stock: '',
        available: true
    });

    const [editUserData, setEditUserData] = useState({
        displayName: '',
        email: '',
        points: '',
        level: '',
        role: 'user'
    });

    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        bonusMultiplier: '2',
        durationHours: '24'
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

    // Reward Management Functions
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

        // Use the enhanced function that sends notifications
        const result = await createRewardWithNotification(rewardData);

        if (result.success) {
            Alert.alert('Success', 'Reward created and users have been notified!');
            setShowCreateModal(false);
            resetNewReward();
            await loadAdminData();
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleCreateBonusEvent = async () => {
        if (!newEvent.name || !newEvent.description) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const eventData = {
            name: newEvent.name,
            description: newEvent.description,
            bonusMultiplier: parseInt(newEvent.bonusMultiplier),
            endsAt: new Date(Date.now() + parseInt(newEvent.durationHours) * 60 * 60 * 1000).toISOString()
        };

        const result = await createBonusEvent(eventData);

        if (result.success) {
            Alert.alert('Success', 'Bonus event created and all active users have been notified!');
            setShowEventModal(false);
            setNewEvent({
                name: '',
                description: '',
                bonusMultiplier: '2',
                durationHours: '24'
            });
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleEditReward = async () => {
        if (!editRewardData.name || !editRewardData.description || !editRewardData.points) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const updates = {
            ...editRewardData,
            points: parseInt(editRewardData.points),
            stock: parseInt(editRewardData.stock),
        };

        const result = await editReward(editingReward.id, updates);

        if (result.success) {
            Alert.alert('Success', 'Reward updated successfully!');
            setShowEditModal(false);
            setEditingReward(null);
            await loadAdminData();
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleDeleteReward = (reward) => {
        Alert.alert(
            'Delete Reward',
            `Are you sure you want to delete "${reward.name}"?\n\nThis action cannot be undone.`,
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

    const handleToggleRewardAvailability = async (reward) => {
        const result = await toggleRewardAvailability(reward.id, !reward.available);
        if (result.success) {
            await loadAdminData();
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const openEditRewardModal = (reward) => {
        setEditingReward(reward);
        setEditRewardData({
            name: reward.name,
            description: reward.description,
            points: reward.points.toString(),
            category: reward.category,
            stock: reward.stock?.toString() || '100',
            available: reward.available
        });
        setShowEditModal(true);
    };

    // User Management Functions
    const handleDeleteUser = (userToDelete) => {
        if (userToDelete.role === 'admin') {
            Alert.alert('Error', 'Cannot delete admin users');
            return;
        }

        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${userToDelete.displayName || userToDelete.email}?\n\nThis will remove all their data including scans and vouchers.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await deleteUser(userToDelete.id);
                        if (result.success) {
                            Alert.alert('Success', 'User deleted successfully');
                            await loadAdminData();
                        } else {
                            Alert.alert('Error', result.error);
                        }
                    }
                }
            ]
        );
    };

    const handleEditUser = (userToEdit) => {
        setEditingUser(userToEdit);
        setEditUserData({
            displayName: userToEdit.displayName || '',
            email: userToEdit.email || '',
            points: (userToEdit.points || 0).toString(),
            level: (userToEdit.level || 1).toString(),
            role: userToEdit.role || 'user'
        });
        setShowUserEditModal(true);
    };

    const handleUpdateUser = async () => {
        if (!editUserData.displayName || !editUserData.email) {
            Alert.alert('Error', 'Name and email are required');
            return;
        }

        const updates = {
            displayName: editUserData.displayName,
            email: editUserData.email,
            points: parseInt(editUserData.points) || 0,
            level: parseInt(editUserData.level) || 1,
            role: editUserData.role
        };

        const result = await updateUserData(editingUser.id, updates);

        if (result.success) {
            Alert.alert('Success', 'User updated successfully!');
            setShowUserEditModal(false);
            setEditingUser(null);
            await loadAdminData();
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handlePromoteToStaff = (userToPromote) => {
        Alert.alert(
            'Promote to Staff',
            `Promote ${userToPromote.displayName || userToPromote.email} to staff member?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Promote',
                    onPress: async () => {
                        const result = await promoteToStaff(userToPromote.id);
                        if (result.success) {
                            Alert.alert('Success', 'User promoted to staff');
                            await loadAdminData();
                        } else {
                            Alert.alert('Error', result.error);
                        }
                    }
                }
            ]
        );
    };

    const resetNewReward = () => {
        setNewReward({
            name: '',
            description: '',
            points: '',
            category: 'merchandise',
            stock: '100',
            available: true
        });
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

                    {/* Enhanced Users Tab with CRUD */}
                    {activeTab === 'users' && (
                        <View>
                            <Card style={styles.usersCard}>
                                <Text style={styles.cardTitle}>User Management ({users.length} users)</Text>

                                {users.map((user) => (
                                    <View key={user.id} style={styles.userItem}>
                                        <View style={styles.userInfo}>
                                            <View style={styles.userHeader}>
                                                <Text style={styles.userName}>{user.displayName || 'User'}</Text>
                                                <Badge
                                                    style={[
                                                        styles.roleBadge,
                                                        { backgroundColor: user.role === 'admin' ? '#8b5cf6' : user.role === 'staff' ? '#f59e0b' : colors.primary.main }
                                                    ]}
                                                >
                                                    {user.role || 'user'}
                                                </Badge>
                                            </View>
                                            <Text style={styles.userEmail}>{user.email}</Text>
                                            <Text style={styles.userStats}>
                                                {user.points || 0} pts • Level {user.level || 1} • {user.totalScans || 0} scans
                                            </Text>
                                        </View>
                                        <View style={styles.userActions}>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => handleEditUser(user)}
                                            >
                                                <LinearGradient
                                                    colors={gradients.primary}
                                                    style={styles.actionButtonGradient}
                                                >
                                                    <Ionicons name="pencil" size={14} color="white" />
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            {user.role === 'user' && (
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => handlePromoteToStaff(user)}
                                                >
                                                    <LinearGradient
                                                        colors={gradients.accent}
                                                        style={styles.actionButtonGradient}
                                                    >
                                                        <Ionicons name="arrow-up" size={14} color="white" />
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            )}

                                            {user.role !== 'admin' && (
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => handleDeleteUser(user)}
                                                >
                                                    <LinearGradient
                                                        colors={['#ef4444', '#dc2626']}
                                                        style={styles.actionButtonGradient}
                                                    >
                                                        <Ionicons name="trash" size={14} color="white" />
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </Card>
                        </View>
                    )}

                    {/* Enhanced Rewards Tab with Full CRUD */}
                    {activeTab === 'rewards' && (
                        <View>
                            <View style={styles.rewardsHeader}>
                                <Text style={styles.sectionTitle}>Rewards Management</Text>
                                <View style={styles.headerButtons}>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => setShowEventModal(true)}
                                    >
                                        <LinearGradient
                                            colors={gradients.accent}
                                            style={styles.addButtonGradient}
                                        >
                                            <Ionicons name="flash" size={20} color="white" />
                                            <Text style={styles.addButtonText}>Bonus Event</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
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
                            </View>

                            {rewards.map((reward) => (
                                <Card key={reward.id} style={styles.rewardItem}>
                                    <View style={styles.rewardContent}>
                                        <View style={styles.rewardInfo}>
                                            <View style={styles.rewardHeader}>
                                                <Text style={styles.rewardName}>{reward.name}</Text>
                                                <Switch
                                                    value={reward.available}
                                                    onValueChange={() => handleToggleRewardAvailability(reward)}
                                                    color={colors.success.main}
                                                />
                                            </View>
                                            <Text style={styles.rewardDescription}>{reward.description}</Text>
                                            <View style={styles.rewardMeta}>
                                                <Chip icon="star" textStyle={styles.chipText}>{reward.points} pts</Chip>
                                                <Chip icon="tag" textStyle={styles.chipText}>{reward.category}</Chip>
                                                <Chip icon="package" textStyle={styles.chipText}>Stock: {reward.stock || 'N/A'}</Chip>
                                                <Chip
                                                    icon={reward.available ? "check-circle" : "close-circle"}
                                                    textStyle={styles.chipText}
                                                    style={{ backgroundColor: reward.available ? colors.success.light : colors.status.error + '30' }}
                                                >
                                                    {reward.available ? 'Available' : 'Unavailable'}
                                                </Chip>
                                            </View>
                                        </View>
                                        <View style={styles.rewardActions}>
                                            <TouchableOpacity
                                                style={styles.editButton}
                                                onPress={() => openEditRewardModal(reward)}
                                            >
                                                <LinearGradient
                                                    colors={gradients.primary}
                                                    style={styles.editButtonGradient}
                                                >
                                                    <Ionicons name="pencil" size={16} color="white" />
                                                </LinearGradient>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteReward(reward)}
                                            >
                                                <LinearGradient
                                                    colors={['#ef4444', '#dc2626']}
                                                    style={styles.deleteButtonGradient}
                                                >
                                                    <Ionicons name="trash" size={16} color="white" />
                                                </LinearGradient>
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

                {/* Edit Reward Modal */}
                <Modal
                    visible={showEditModal}
                    onDismiss={() => setShowEditModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Reward</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                label="Reward Name *"
                                value={editRewardData.name}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, name: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Description *"
                                value={editRewardData.description}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, description: text }))}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Points Required *"
                                value={editRewardData.points}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, points: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Category"
                                value={editRewardData.category}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, category: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Stock Quantity"
                                value={editRewardData.stock}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, stock: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                            />

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Available for redemption</Text>
                                <Switch
                                    value={editRewardData.available}
                                    onValueChange={(value) => setEditRewardData(prev => ({ ...prev, available: value }))}
                                    color={colors.success.main}
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={handleEditReward}
                                >
                                    <LinearGradient
                                        colors={gradients.primary}
                                        style={styles.createButtonGradient}
                                    >
                                        <Text style={styles.createButtonText}>Update Reward</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Card>
                </Modal>

                {/* Edit User Modal */}
                <Modal
                    visible={showUserEditModal}
                    onDismiss={() => setShowUserEditModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit User</Text>
                            <TouchableOpacity onPress={() => setShowUserEditModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                label="Display Name *"
                                value={editUserData.displayName}
                                onChangeText={(text) => setEditUserData(prev => ({ ...prev, displayName: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Email *"
                                value={editUserData.email}
                                onChangeText={(text) => setEditUserData(prev => ({ ...prev, email: text }))}
                                mode="outlined"
                                keyboardType="email-address"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Points"
                                value={editUserData.points}
                                onChangeText={(text) => setEditUserData(prev => ({ ...prev, points: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                            />

                            <TextInput
                                label="Level"
                                value={editUserData.level}
                                onChangeText={(text) => setEditUserData(prev => ({ ...prev, level: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                            />

                            <View style={styles.roleSelector}>
                                <Text style={styles.roleSelectorLabel}>User Role</Text>
                                <View style={styles.roleOptions}>
                                    {['user', 'staff', 'admin'].map((role) => (
                                        <TouchableOpacity
                                            key={role}
                                            style={[
                                                styles.roleOption,
                                                editUserData.role === role && styles.activeRoleOption
                                            ]}
                                            onPress={() => setEditUserData(prev => ({ ...prev, role }))}
                                        >
                                            <Text style={[
                                                styles.roleOptionText,
                                                editUserData.role === role && styles.activeRoleOptionText
                                            ]}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={handleUpdateUser}
                                >
                                    <LinearGradient
                                        colors={gradients.success}
                                        style={styles.createButtonGradient}
                                    >
                                        <Text style={styles.createButtonText}>Update User</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Card>
                </Modal>

                {/* Create Bonus Event Modal */}
                <Modal
                    visible={showEventModal}
                    onDismiss={() => setShowEventModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Bonus Event</Text>
                            <TouchableOpacity onPress={() => setShowEventModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                label="Event Name *"
                                value={newEvent.name}
                                onChangeText={(text) => setNewEvent(prev => ({ ...prev, name: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                                placeholder="e.g. Double Points Weekend"
                            />

                            <TextInput
                                label="Description *"
                                value={newEvent.description}
                                onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.modalInput}
                                placeholder="Describe the bonus event..."
                            />

                            <TextInput
                                label="Bonus Multiplier *"
                                value={newEvent.bonusMultiplier}
                                onChangeText={(text) => setNewEvent(prev => ({ ...prev, bonusMultiplier: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                placeholder="2 = 2x points, 3 = 3x points"
                            />

                            <TextInput
                                label="Duration (Hours) *"
                                value={newEvent.durationHours}
                                onChangeText={(text) => setNewEvent(prev => ({ ...prev, durationHours: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                placeholder="24 = 1 day, 168 = 1 week"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={handleCreateBonusEvent}
                                >
                                    <LinearGradient
                                        colors={gradients.accent}
                                        style={styles.createButtonGradient}
                                    >
                                        <Text style={styles.createButtonText}>Create & Notify Users</Text>
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
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginRight: 8,
    },
    roleBadge: {
        fontSize: 10,
    },
    userEmail: {
        fontSize: 12,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    userStats: {
        fontSize: 12,
        color: colors.text.light,
    },
    userActions: {
        flexDirection: 'row',
        gap: 4,
        marginLeft: 12,
    },
    actionButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
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
        alignItems: 'flex-start',
    },
    rewardInfo: {
        flex: 1,
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    rewardName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        flex: 1,
        marginRight: 8,
    },
    rewardDescription: {
        fontSize: 14,
        color: colors.text.secondary,
        marginBottom: 8,
    },
    rewardMeta: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    chipText: {
        fontSize: 10,
    },
    rewardActions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 12,
    },
    editButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    editButtonGradient: {
        padding: 8,
    },
    deleteButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    deleteButtonGradient: {
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
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 16,
    },
    switchLabel: {
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: '500',
    },
    roleSelector: {
        marginBottom: 16,
    },
    roleSelectorLabel: {
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: '500',
        marginBottom: 8,
    },
    roleOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    roleOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.surface.medium,
        alignItems: 'center',
    },
    activeRoleOption: {
        backgroundColor: colors.primary.main,
        borderColor: colors.primary.main,
    },
    roleOptionText: {
        fontSize: 14,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    activeRoleOptionText: {
        color: 'white',
        fontWeight: '700',
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
