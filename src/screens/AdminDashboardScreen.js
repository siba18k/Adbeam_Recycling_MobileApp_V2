import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    Modal,
    RefreshControl,
    Dimensions,
    Animated,
    FlatList,
} from 'react-native';
import {
    Text,
    Card,
    Button,
    TextInput,
    ActivityIndicator,
    Badge,
    Chip,
    Switch,
    Searchbar,
    FAB
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
    createBonusEvent,
    addTestPoints,
    resetUserPoints
} from '../services/database';
import { colors, gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
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
    const [searchQuery, setSearchQuery] = useState('');
    const [pointsToAdd, setPointsToAdd] = useState('1000');
    const [showDevTools, setShowDevTools] = useState(false);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
        
        loadAdminData();
    }, []);

    // User search functionality
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user => 
                (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.role?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

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
            if (usersResult.success) {
                setUsers(usersResult.data);
                setFilteredUsers(usersResult.data);
            }
            if (rewardsResult.success) setRewards(rewardsResult.data);
            if (vouchersResult.success) setVouchers(vouchersResult.data);

        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadAdminData();
        setIsRefreshing(false);
    };

    // Development tools functions
    const handleAddPoints = async () => {
        const points = parseInt(pointsToAdd);
        if (isNaN(points) || points <= 0) {
            Alert.alert('Error', 'Please enter a valid number of points');
            return;
        }

        const result = await addTestPoints(user.uid, points);
        if (result.success) {
            Alert.alert(
                'Success! 🎉',
                `Added ${result.pointsAdded} points!\nTotal: ${result.newPoints}\nLevel: ${result.newLevel}`
            );
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleResetPoints = async () => {
        Alert.alert(
            'Reset Points',
            'Are you sure you want to reset all points to 0?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await resetUserPoints(user.uid);
                        if (result.success) {
                            Alert.alert('Success', 'Points reset to 0');
                        } else {
                            Alert.alert('Error', result.error);
                        }
                    }
                }
            ]
        );
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

    const renderUserItem = ({ item: user }) => (
        <Animated.View
            style={[
                styles.userItemAnimated,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
                },
            ]}
        >
            <Card style={styles.userCard}>
                <View style={styles.userItem}>
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
            </Card>
        </Animated.View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={['#a8e6cf', '#dcedc1', '#ffffff']} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#27ae60" />
                        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#a8e6cf', '#dcedc1', '#ffffff']} style={styles.gradient}>
                {/* Enhanced Header with Animation */}
                <LinearGradient
                    colors={['#27ae60', '#229954']}
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
                            <Text style={styles.headerTitle}>Admin Dashboard</Text>
                            <Text style={styles.headerSubtitle}>
                                Welcome, {userProfile?.displayName || 'Administrator'}! 🌱
                            </Text>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('StaffScanner')}
                                style={styles.scannerButton}
                            >
                                <Ionicons name="qr-code-outline" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </LinearGradient>

                {/* Development Tools Section */}
                {showDevTools && (
                    <Animated.View
                        style={[
                            styles.devToolsSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <Card style={styles.devToolsCard}>
                            <Card.Content>
                                <Text style={styles.devToolsTitle}>🛠️ Development Tools</Text>
                                <View style={styles.devToolsRow}>
                                    <TextInput
                                        label="Points to Add"
                                        value={pointsToAdd}
                                        onChangeText={setPointsToAdd}
                                        keyboardType="numeric"
                                        mode="outlined"
                                        style={styles.pointsInput}
                                    />
                                    <TouchableOpacity
                                        onPress={handleAddPoints}
                                        style={styles.devButton}
                                    >
                                        <LinearGradient
                                            colors={['#27ae60', '#229954']}
                                            style={styles.devButtonGradient}
                                        >
                                            <Text style={styles.devButtonText}>Add</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    onPress={handleResetPoints}
                                    style={styles.resetButton}
                                >
                                    <Text style={styles.resetButtonText}>Reset Points to 0</Text>
                                </TouchableOpacity>
                            </Card.Content>
                        </Card>
                    </Animated.View>
                )}

                {/* Enhanced Tab Navigation */}
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
                            { key: 'overview', title: 'Overview', icon: 'analytics-outline', color: '#27ae60' },
                            { key: 'users', title: 'Users', icon: 'people-outline', color: '#3498db' },
                            { key: 'rewards', title: 'Rewards', icon: 'gift-outline', color: '#e74c3c' },
                            { key: 'vouchers', title: 'Vouchers', icon: 'qr-code-outline', color: '#f39c12' }
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

                {/* Main Content Area */}
                {activeTab !== 'users' ? (
                    // For all tabs except users, use ScrollView
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl 
                                refreshing={isRefreshing} 
                                onRefresh={handleRefresh}
                                colors={['#27ae60']}
                                tintColor={'#27ae60'}
                            />
                        }
                    >
                        {activeTab === 'overview' && (
                            <Animated.View
                                style={{
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideUpAnim }],
                                }}
                            >
                                <View style={styles.statsGrid}>
                                    <Card style={styles.statCard}>
                                        <LinearGradient
                                            colors={['#3498db', '#5dade2']}
                                            style={styles.statGradient}
                                        >
                                            <Ionicons name="people" size={28} color="white" />
                                            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
                                            <Text style={styles.statLabel}>Total Users</Text>
                                        </LinearGradient>
                                    </Card>

                                    <Card style={styles.statCard}>
                                        <LinearGradient
                                            colors={['#27ae60', '#58d68d']}
                                            style={styles.statGradient}
                                        >
                                            <Ionicons name="leaf" size={28} color="white" />
                                            <Text style={styles.statValue}>{stats?.totalScans || 0}</Text>
                                            <Text style={styles.statLabel}>Items Recycled</Text>
                                        </LinearGradient>
                                    </Card>

                                    <Card style={styles.statCard}>
                                        <LinearGradient
                                            colors={['#f39c12', '#f7dc6f']}
                                            style={styles.statGradient}
                                        >
                                            <Ionicons name="qr-code" size={28} color="white" />
                                            <Text style={styles.statValue}>{stats?.activeVouchers || 0}</Text>
                                            <Text style={styles.statLabel}>Active Vouchers</Text>
                                        </LinearGradient>
                                    </Card>

                                    <Card style={styles.statCard}>
                                        <LinearGradient
                                            colors={['#e74c3c', '#ec7063']}
                                            style={styles.statGradient}
                                        >
                                            <Ionicons name="star" size={28} color="white" />
                                            <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
                                            <Text style={styles.statLabel}>Points Earned</Text>
                                        </LinearGradient>
                                    </Card>
                                </View>

                                {/* Enhanced Top Users */}
                                <Card style={styles.topUsersCard}>
                                    <LinearGradient
                                        colors={['#8e44ad', '#bb8fce']}
                                        style={styles.topUsersHeader}
                                    >
                                        <Ionicons name="trophy" size={24} color="white" />
                                        <Text style={styles.topUsersTitle}>🏆 Top Recyclers</Text>
                                    </LinearGradient>
                                    <View style={styles.topUsersContent}>
                                        {stats?.topUsers?.slice(0, 5).map((user, index) => (
                                            <View key={user.id} style={styles.topUserItem}>
                                                <View style={styles.topUserRankContainer}>
                                                    <Text style={[
                                                        styles.topUserRank,
                                                        index === 0 && { color: '#f1c40f' },
                                                        index === 1 && { color: '#95a5a6' },
                                                        index === 2 && { color: '#d4ac0d' }
                                                    ]}>#{index + 1}</Text>
                                                </View>
                                                <Text style={styles.topUserName}>{user.displayName || 'User'}</Text>
                                                <Text style={styles.topUserPoints}>{user.points || 0} pts</Text>
                                            </View>
                                        ))}
                                    </View>
                                </Card>
                            </Animated.View>
                        )}

                        {/* Enhanced Rewards Tab */}
                        {activeTab === 'rewards' && (
                            <Animated.View
                                style={{
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideUpAnim }],
                                }}
                            >
                                <View style={styles.rewardsHeader}>
                                    <Text style={styles.sectionTitle}>🎁 Rewards Management</Text>
                                </View>
                                
                                <View style={styles.headerButtonsContainer}>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => setShowEventModal(true)}
                                    >
                                        <LinearGradient
                                            colors={['#f39c12', '#f7dc6f']}
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
                                            colors={['#27ae60', '#58d68d']}
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
                                                <View style={styles.rewardHeader}>
                                                    <Text style={styles.rewardName}>{reward.name}</Text>
                                                    <Switch
                                                        value={reward.available}
                                                        onValueChange={() => handleToggleRewardAvailability(reward)}
                                                        color="#27ae60"
                                                    />
                                                </View>
                                                <Text style={styles.rewardDescription}>{reward.description}</Text>
                                                <View style={styles.rewardMeta}>
                                                    <Chip icon="star" textStyle={styles.chipText} style={{ backgroundColor: '#f39c12' + '30' }}>
                                                        {reward.points} pts
                                                    </Chip>
                                                    <Chip icon="tag" textStyle={styles.chipText} style={{ backgroundColor: '#3498db' + '30' }}>
                                                        {reward.category}
                                                    </Chip>
                                                    <Chip icon="package" textStyle={styles.chipText} style={{ backgroundColor: '#9b59b6' + '30' }}>
                                                        Stock: {reward.stock || 'N/A'}
                                                    </Chip>
                                                    <Chip
                                                        icon={reward.available ? "check-circle" : "close-circle"}
                                                        textStyle={styles.chipText}
                                                        style={{ backgroundColor: reward.available ? '#27ae60' + '30' : '#e74c3c' + '30' }}
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
                                                        colors={['#3498db', '#5dade2']}
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
                                                        colors={['#e74c3c', '#ec7063']}
                                                        style={styles.deleteButtonGradient}
                                                    >
                                                        <Ionicons name="trash" size={16} color="white" />
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Card>
                                ))}
                            </Animated.View>
                        )}

                        {/* Enhanced Vouchers Tab */}
                        {activeTab === 'vouchers' && (
                            <Animated.View
                                style={{
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideUpAnim }],
                                }}
                            >
                                <Text style={styles.sectionTitle}>🎫 Voucher Management</Text>

                                <View style={styles.voucherStats}>
                                    <Card style={styles.voucherStatCard}>
                                        <LinearGradient colors={['#27ae60', '#58d68d']} style={styles.voucherStatGradient}>
                                            <Ionicons name="checkmark-circle" size={24} color="white" />
                                            <Text style={styles.voucherStatValue}>{vouchers.filter(v => v.status === 'active').length}</Text>
                                            <Text style={styles.voucherStatLabel}>Active</Text>
                                        </LinearGradient>
                                    </Card>
                                    <Card style={styles.voucherStatCard}>
                                        <LinearGradient colors={['#f39c12', '#f7dc6f']} style={styles.voucherStatGradient}>
                                            <Ionicons name="gift" size={24} color="white" />
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
                                                            { backgroundColor: voucher.status === 'active' ? '#27ae60' : '#95a5a6' }
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
                            </Animated.View>
                        )}
                    </ScrollView>
                ) : (
                    // FIXED: For users tab, use FlatList directly without ScrollView
                    <View style={styles.usersTabContainer}>
                        {/* Search Bar */}
                        <Card style={styles.searchCard}>
                            <Searchbar
                                placeholder="Search users by name, email, or role..."
                                onChangeText={setSearchQuery}
                                value={searchQuery}
                                style={styles.searchBar}
                                iconColor="#27ae60"
                                inputStyle={styles.searchInput}
                            />
                            <Text style={styles.searchResults}>
                                {filteredUsers.length} of {users.length} users
                            </Text>
                        </Card>

                        {/* Users List - Direct FlatList without ScrollView */}
                        <FlatList
                            data={filteredUsers}
                            renderItem={renderUserItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.usersList}
                            refreshControl={
                                <RefreshControl 
                                    refreshing={isRefreshing} 
                                    onRefresh={handleRefresh}
                                    colors={['#27ae60']}
                                    tintColor={'#27ae60'}
                                />
                            }
                            style={styles.usersListContainer}
                        />
                    </View>
                )}

                {/* Floating Action Button */}
                <FAB
                    style={styles.fab}
                    icon="plus"
                    color="white"
                    onPress={() => {
                        if (activeTab === 'rewards') {
                            setShowCreateModal(true);
                        } else if (activeTab === 'users') {
                            Alert.alert('Add User', 'Users can only register through the app authentication system.');
                        }
                    }}
                />

                {/* All Modals remain the same but with enhanced styling */}
                {/* Create Reward Modal */}
                <Modal
                    visible={showCreateModal}
                    onDismiss={() => setShowCreateModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card style={styles.modalCard}>
                        <LinearGradient
                            colors={['#27ae60', '#58d68d']}
                            style={styles.modalHeader}
                        >
                            <Text style={styles.modalTitle}>✨ Create New Reward</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                label="Reward Name *"
                                value={newReward.name}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, name: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#27ae60' } }}
                            />

                            <TextInput
                                label="Description *"
                                value={newReward.description}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, description: text }))}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#27ae60' } }}
                            />

                            <TextInput
                                label="Points Required *"
                                value={newReward.points}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, points: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#27ae60' } }}
                            />

                            <TextInput
                                label="Category"
                                value={newReward.category}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, category: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#27ae60' } }}
                            />

                            <TextInput
                                label="Stock Quantity"
                                value={newReward.stock}
                                onChangeText={(text) => setNewReward(prev => ({ ...prev, stock: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#27ae60' } }}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={handleCreateReward}
                                >
                                    <LinearGradient
                                        colors={['#27ae60', '#58d68d']}
                                        style={styles.createButtonGradient}
                                    >
                                        <Ionicons name="checkmark" size={20} color="white" />
                                        <Text style={styles.createButtonText}>Create Reward</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Card>
                </Modal>

                {/* Edit Reward Modal - Similar structure with updated colors */}
                <Modal
                    visible={showEditModal}
                    onDismiss={() => setShowEditModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card style={styles.modalCard}>
                        <LinearGradient
                            colors={['#3498db', '#5dade2']}
                            style={styles.modalHeader}
                        >
                            <Text style={styles.modalTitle}>✏️ Edit Reward</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                label="Reward Name *"
                                value={editRewardData.name}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, name: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#3498db' } }}
                            />

                            <TextInput
                                label="Description *"
                                value={editRewardData.description}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, description: text }))}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#3498db' } }}
                            />

                            <TextInput
                                label="Points Required *"
                                value={editRewardData.points}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, points: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#3498db' } }}
                            />

                            <TextInput
                                label="Category"
                                value={editRewardData.category}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, category: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#3498db' } }}
                            />

                            <TextInput
                                label="Stock Quantity"
                                value={editRewardData.stock}
                                onChangeText={(text) => setEditRewardData(prev => ({ ...prev, stock: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#3498db' } }}
                            />

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Available for redemption</Text>
                                <Switch
                                    value={editRewardData.available}
                                    onValueChange={(value) => setEditRewardData(prev => ({ ...prev, available: value }))}
                                    color="#27ae60"
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={handleEditReward}
                                >
                                    <LinearGradient
                                        colors={['#3498db', '#5dade2']}
                                        style={styles.createButtonGradient}
                                    >
                                        <Ionicons name="save" size={20} color="white" />
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
                        <LinearGradient
                            colors={['#9b59b6', '#bb8fce']}
                            style={styles.modalHeader}
                        >
                            <Text style={styles.modalTitle}>👤 Edit User</Text>
                            <TouchableOpacity onPress={() => setShowUserEditModal(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                label="Display Name *"
                                value={editUserData.displayName}
                                onChangeText={(text) => setEditUserData(prev => ({ ...prev, displayName: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#9b59b6' } }}
                            />

                            <TextInput
                                label="Email *"
                                value={editUserData.email}
                                onChangeText={(text) => setEditUserData(prev => ({ ...prev, email: text }))}
                                mode="outlined"
                                keyboardType="email-address"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#9b59b6' } }}
                            />

                            <TextInput
                                label="Points"
                                value={editUserData.points}
                                onChangeText={(text) => setEditUserData(prev => ({ ...prev, points: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#9b59b6' } }}
                            />

                            <TextInput
                                label="Level"
                                value={editUserData.level}
                                onChangeText={(text) => setEditUserData(prev => ({ ...prev, level: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                theme={{ colors: { primary: '#9b59b6' } }}
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
                                        colors={['#9b59b6', '#bb8fce']}
                                        style={styles.createButtonGradient}
                                    >
                                        <Ionicons name="person-add" size={20} color="white" />
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
                        <LinearGradient
                            colors={['#f39c12', '#f7dc6f']}
                            style={styles.modalHeader}
                        >
                            <Text style={styles.modalTitle}>⚡ Create Bonus Event</Text>
                            <TouchableOpacity onPress={() => setShowEventModal(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                label="Event Name *"
                                value={newEvent.name}
                                onChangeText={(text) => setNewEvent(prev => ({ ...prev, name: text }))}
                                mode="outlined"
                                style={styles.modalInput}
                                placeholder="e.g. Double Points Weekend"
                                theme={{ colors: { primary: '#f39c12' } }}
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
                                theme={{ colors: { primary: '#f39c12' } }}
                            />

                            <TextInput
                                label="Bonus Multiplier *"
                                value={newEvent.bonusMultiplier}
                                onChangeText={(text) => setNewEvent(prev => ({ ...prev, bonusMultiplier: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                placeholder="2 = 2x points, 3 = 3x points"
                                theme={{ colors: { primary: '#f39c12' } }}
                            />

                            <TextInput
                                label="Duration (Hours) *"
                                value={newEvent.durationHours}
                                onChangeText={(text) => setNewEvent(prev => ({ ...prev, durationHours: text }))}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.modalInput}
                                placeholder="24 = 1 day, 168 = 1 week"
                                theme={{ colors: { primary: '#f39c12' } }}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={handleCreateBonusEvent}
                                >
                                    <LinearGradient
                                        colors={['#f39c12', '#f7dc6f']}
                                        style={styles.createButtonGradient}
                                    >
                                        <Ionicons name="flash" size={20} color="white" />
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
        color: '#27ae60',
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
    devToolsButton: {
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
    },
    scannerButton: {
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    devToolsSection: {
        margin: 16,
        marginBottom: 8,
    },
    devToolsCard: {
        borderRadius: 16,
        elevation: 4,
    },
    devToolsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#27ae60',
        marginBottom: 16,
    },
    devToolsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        marginBottom: 12,
    },
    pointsInput: {
        flex: 1,
    },
    devButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    devButtonGradient: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    devButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    resetButton: {
        backgroundColor: '#ecf0f1',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#7f8c8d',
        fontWeight: '600',
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
    },
    // FIXED: New styles for users tab container
    usersTabContainer: {
        flex: 1,
        padding: 16,
    },
    usersListContainer: {
        flex: 1,
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
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 8,
        textAlign: 'center',
    },
    topUsersCard: {
        borderRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    topUsersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    topUsersTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    topUsersContent: {
        padding: 20,
    },
    topUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    topUserRankContainer: {
        width: 40,
        alignItems: 'center',
    },
    topUserRank: {
        fontSize: 18,
        fontWeight: '700',
        color: '#27ae60',
    },
    topUserName: {
        flex: 1,
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
        marginLeft: 12,
    },
    topUserPoints: {
        fontSize: 16,
        fontWeight: '700',
        color: '#27ae60',
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
    searchResults: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
    usersList: {
        paddingBottom: 80,
    },
    userItemAnimated: {
        marginBottom: 12,
    },
    userCard: {
        borderRadius: 16,
        elevation: 2,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
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
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginRight: 8,
    },
    roleBadge: {
        fontSize: 10,
    },
    userEmail: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 2,
    },
    userStats: {
        fontSize: 14,
        color: '#95a5a6',
    },
    userActions: {
        flexDirection: 'row',
        gap: 6,
        marginLeft: 12,
        minWidth: 100,
        justifyContent: 'flex-end',
    },
    actionButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardsHeader: {
        marginBottom: 16,
    },
    headerButtonsContainer: {
        flexDirection: width < 400 ? 'column' : 'row',
        gap: 12,
        marginBottom: 16,
    },
    addButton: {
        borderRadius: 12,
        overflow: 'hidden',
        flex: width < 400 ? 1 : 0,
        minWidth: width < 400 ? '100%' : 140,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    rewardItem: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    rewardContent: {
        flexDirection: 'column',
    },
    rewardInfo: {
        flex: 1,
        marginBottom: 12,
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rewardName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        flex: 1,
        marginRight: 8,
    },
    rewardDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 12,
        lineHeight: 20,
    },
    rewardMeta: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    rewardActions: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    editButton: {
        borderRadius: 8,
        overflow: 'hidden',
        flex: 1,
    },
    editButtonGradient: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    deleteButton: {
        borderRadius: 8,
        overflow: 'hidden',
        flex: 1,
    },
    deleteButtonGradient: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    voucherStats: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    voucherStatCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
    },
    voucherStatGradient: {
        padding: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    voucherStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    voucherStatLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    voucherItem: {
        borderRadius: 16,
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
        color: '#2c3e50',
    },
    voucherCode: {
        fontSize: 14,
        color: '#7f8c8d',
        fontFamily: 'monospace',
        marginTop: 4,
        backgroundColor: '#f8f9fa',
        padding: 4,
        borderRadius: 4,
    },
    voucherUser: {
        fontSize: 12,
        color: '#95a5a6',
        marginTop: 4,
    },
    voucherStatus: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        marginBottom: 4,
    },
    voucherDate: {
        fontSize: 12,
        color: '#95a5a6',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        borderRadius: 20,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    modalContent: {
        padding: 20,
        backgroundColor: 'white',
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
        color: '#2c3e50',
        fontWeight: '500',
    },
    roleSelector: {
        marginBottom: 16,
    },
    roleSelectorLabel: {
        fontSize: 16,
        color: '#2c3e50',
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
        borderColor: '#bdc3c7',
        alignItems: 'center',
    },
    activeRoleOption: {
        backgroundColor: '#9b59b6',
        borderColor: '#9b59b6',
    },
    roleOptionText: {
        fontSize: 14,
        color: '#7f8c8d',
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
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#27ae60',
    },
});