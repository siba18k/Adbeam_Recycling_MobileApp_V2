import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Animated,
    FlatList,
    Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Mock notifications data - replace with real data from your backend
const MOCK_NOTIFICATIONS = [
    {
        id: '1',
        type: 'achievement',
        title: '🏆 New Achievement Unlocked!',
        message: 'You\'ve reached Level 5! Keep up the great recycling work.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        icon: 'trophy',
        color: '#f59e0b',
    },
    {
        id: '2',
        type: 'reward',
        title: '🎁 New Reward Available',
        message: 'A new eco-friendly water bottle is now available in rewards!',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        read: false,
        icon: 'gift',
        color: '#3b82f6',
    },
    {
        id: '3',
        type: 'reminder',
        title: '♻️ Recycling Reminder',
        message: 'Don\'t forget to scan your recyclables today!',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        icon: 'leaf',
        color: '#059669',
    },
    {
        id: '4',
        type: 'system',
        title: '📱 App Update Available',
        message: 'New features and improvements are now available.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        read: true,
        icon: 'download',
        color: '#8b5cf6',
    },
];

export default function NotificationsScreen({ navigation }) {
    const [notificationSettings, setNotificationSettings] = useState({
        pushEnabled: true,
        scanReminders: true,
        rewardAlerts: true,
        leaderboardUpdates: true,
        systemAlerts: true,
        marketingMessages: false,
        weeklyReport: true,
        achievementBadges: true,
        reminderTime: '18:00',
        reminderDays: ['monday', 'wednesday', 'friday'],
    });

    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'settings'
    const [isLoading, setIsLoading] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadNotificationSettings();
        markAllAsRead();

        // Enhanced entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Enhanced background animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Floating elements
        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: -25,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 25,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 3500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, {
                    toValue: -20,
                    duration: 4500,
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 20,
                    duration: 4500,
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 0,
                    duration: 4500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 15000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const loadNotificationSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('notificationSettings');
            if (saved) {
                setNotificationSettings({ ...notificationSettings, ...JSON.parse(saved) });
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    };

    const saveNotificationSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
            setNotificationSettings(newSettings);
        } catch (error) {
            console.error('Error saving notification settings:', error);
            Alert.alert('Error', 'Failed to save notification settings');
        }
    };

    const updateNotificationSetting = (key, value) => {
        const newSettings = { ...notificationSettings, [key]: value };
        saveNotificationSettings(newSettings);
    };

    const markAllAsRead = () => {
        const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
        setNotifications(updatedNotifications);
    };

    const clearAllNotifications = () => {
        Alert.alert(
            'Clear All Notifications',
            'This will remove all notifications from your list.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                        setNotifications([]);
                        Alert.alert('Success', 'All notifications cleared');
                    },
                },
            ]
        );
    };

    const testNotification = () => {
        const newNotification = {
            id: Date.now().toString(),
            type: 'test',
            title: '🧪 Test Notification',
            message: 'This is a test notification to verify the system is working correctly!',
            timestamp: new Date(),
            read: false,
            icon: 'flask',
            color: '#8b5cf6',
        };

        setNotifications(prev => [newNotification, ...prev]);
        Alert.alert('Test Sent!', 'Check your notifications list above.');
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const renderNotificationItem = ({ item, index }) => (
        <Animated.View
            style={[
                styles.notificationItem,
                {
                    opacity: fadeAnim,
                    transform: [{
                        translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [index % 2 === 0 ? -30 : 30, 0],
                        }),
                    }],
                }
            ]}
        >
            <LinearGradient
                colors={item.read ? ['#ffffff', '#f9fafb'] : ['#ecfdf5', '#f0fdf4']}
                style={styles.notificationItemGradient}
            >
                <View style={[styles.notificationIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={20} color="white" />
                </View>

                <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
                        {item.title}
                    </Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {formatTimestamp(item.timestamp)}
                    </Text>
                </View>

                {!item.read && (
                    <Animated.View style={[styles.unreadIndicator, { transform: [{ scale: pulseAnim }] }]}>
                        <LinearGradient colors={['#059669', '#047857']} style={styles.unreadIndicatorGradient} />
                    </Animated.View>
                )}
            </LinearGradient>
        </Animated.View>
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fef3c7', '#fde68a', '#ffffff']} style={styles.gradient}>
                {/* Enhanced floating background elements */}
                <Animated.View
                    style={[
                        styles.floatingElement,
                        styles.element1,
                        {
                            backgroundColor: '#f59e0b',
                            opacity: 0.15,
                            transform: [{ translateY: float1 }, { rotate: spin }]
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.floatingElement,
                        styles.element2,
                        {
                            backgroundColor: '#059669',
                            opacity: 0.12,
                            transform: [{ translateY: float2 }, { scale: pulseAnim }]
                        }
                    ]}
                />

                {/* Enhanced Header */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: pulseAnim }] }}>
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Notifications</Text>
                            {unreadCount > 0 && (
                                <Animated.View style={[styles.headerBadge, { transform: [{ scale: pulseAnim }] }]}>
                                    <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.headerBadgeGradient}>
                                        <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                                    </LinearGradient>
                                </Animated.View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.tabSwitchButton}
                            onPress={() => setActiveTab(activeTab === 'notifications' ? 'settings' : 'notifications')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                <Ionicons
                                    name={activeTab === 'notifications' ? 'settings' : 'list'}
                                    size={20}
                                    color="white"
                                />
                            </Animated.View>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>

                {/* Tab Content */}
                {activeTab === 'notifications' ? (
                    // Notifications List Tab
                    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {notifications.length > 0 ? (
                            <>
                                {/* Action buttons */}
                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={testNotification}
                                        activeOpacity={0.7}
                                    >
                                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionButtonGradient}>
                                            <Ionicons name="flash" size={16} color="white" />
                                            <Text style={styles.actionButtonText}>Test</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={clearAllNotifications}
                                        activeOpacity={0.7}
                                    >
                                        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.actionButtonGradient}>
                                            <Ionicons name="trash" size={16} color="white" />
                                            <Text style={styles.actionButtonText}>Clear</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                <FlatList
                                    data={notifications}
                                    renderItem={renderNotificationItem}
                                    keyExtractor={(item) => item.id}
                                    style={styles.notificationsList}
                                    contentContainerStyle={styles.notificationsListContent}
                                    showsVerticalScrollIndicator={false}
                                />
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.emptyStateCard}>
                                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                        <Ionicons name="notifications-off" size={48} color="#6b7280" />
                                    </Animated.View>
                                    <Text style={styles.emptyStateTitle}>No Notifications</Text>
                                    <Text style={styles.emptyStateText}>
                                        You're all caught up! New notifications will appear here.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.testNotificationButton}
                                        onPress={testNotification}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient colors={['#059669', '#047857']} style={styles.testNotificationGradient}>
                                            <Text style={styles.testNotificationText}>Send Test Notification</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        )}
                    </Animated.View>
                ) : (
                    // Settings Tab
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Notification Types */}
                        <Animated.View
                            style={[
                                styles.settingsSection,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="notifications-circle" size={20} color="#f59e0b" />
                                    <Text style={styles.sectionTitle}>Notification Types</Text>
                                </View>

                                <View style={styles.settingsGroup}>
                                    <View style={styles.settingItem}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingTitle}>Scan Reminders</Text>
                                            <Text style={styles.settingDescription}>
                                                Weekly reminders to recycle items
                                            </Text>
                                        </View>
                                        <Switch
                                            value={notificationSettings.scanReminders}
                                            onValueChange={(value) => updateNotificationSetting('scanReminders', value)}
                                            trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                            thumbColor={notificationSettings.scanReminders ? '#f59e0b' : '#6b7280'}
                                        />
                                    </View>

                                    <View style={styles.settingItem}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingTitle}>Reward Alerts</Text>
                                            <Text style={styles.settingDescription}>
                                                Notify when new rewards are available
                                            </Text>
                                        </View>
                                        <Switch
                                            value={notificationSettings.rewardAlerts}
                                            onValueChange={(value) => updateNotificationSetting('rewardAlerts', value)}
                                            trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                            thumbColor={notificationSettings.rewardAlerts ? '#f59e0b' : '#6b7280'}
                                        />
                                    </View>

                                    <View style={styles.settingItem}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingTitle}>Achievement Badges</Text>
                                            <Text style={styles.settingDescription}>
                                                Celebrate your eco-milestones
                                            </Text>
                                        </View>
                                        <Switch
                                            value={notificationSettings.achievementBadges}
                                            onValueChange={(value) => updateNotificationSetting('achievementBadges', value)}
                                            trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                            thumbColor={notificationSettings.achievementBadges ? '#f59e0b' : '#6b7280'}
                                        />
                                    </View>

                                    <View style={styles.settingItem}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingTitle}>Leaderboard Updates</Text>
                                            <Text style={styles.settingDescription}>
                                                Ranking changes and competitions
                                            </Text>
                                        </View>
                                        <Switch
                                            value={notificationSettings.leaderboardUpdates}
                                            onValueChange={(value) => updateNotificationSetting('leaderboardUpdates', value)}
                                            trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                            thumbColor={notificationSettings.leaderboardUpdates ? '#f59e0b' : '#6b7280'}
                                        />
                                    </View>

                                    <View style={styles.settingItem}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingTitle}>Weekly Report</Text>
                                            <Text style={styles.settingDescription}>
                                                Your recycling impact summary
                                            </Text>
                                        </View>
                                        <Switch
                                            value={notificationSettings.weeklyReport}
                                            onValueChange={(value) => updateNotificationSetting('weeklyReport', value)}
                                            trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                                            thumbColor={notificationSettings.weeklyReport ? '#f59e0b' : '#6b7280'}
                                        />
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        {/* Reminder Schedule */}
                        <Animated.View
                            style={[
                                styles.settingsSection,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="time" size={20} color="#059669" />
                                    <Text style={styles.sectionTitle}>Reminder Schedule</Text>
                                </View>

                                <View style={styles.settingsGroup}>
                                    <View style={styles.scheduleItem}>
                                        <Text style={styles.scheduleLabel}>Reminder Time</Text>
                                        <View style={styles.timeContainer}>
                                            <Ionicons name="time-outline" size={18} color="#059669" />
                                            <Text style={styles.timeText}>{notificationSettings.reminderTime}</Text>
                                            <TouchableOpacity
                                                style={styles.changeTimeButton}
                                                onPress={() => Alert.alert('Coming Soon', 'Time picker will be available soon')}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.changeTimeText}>Change</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.scheduleItem}>
                                        <Text style={styles.scheduleLabel}>Reminder Days</Text>
                                        <View style={styles.daysContainer}>
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                                const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
                                                const isSelected = notificationSettings.reminderDays.includes(dayKey);

                                                return (
                                                    <TouchableOpacity
                                                        key={day}
                                                        style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                                                        onPress={() => {
                                                            const newDays = isSelected
                                                                ? notificationSettings.reminderDays.filter(d => d !== dayKey)
                                                                : [...notificationSettings.reminderDays, dayKey];
                                                            updateNotificationSetting('reminderDays', newDays);
                                                        }}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                                                            {day}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        {/* Info Card */}
                        <Animated.View style={{ opacity: fadeAnim }}>
                            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.infoCard}>
                                <View style={styles.infoHeader}>
                                    <Animated.View
                                        style={[styles.infoIconCircle, { transform: [{ rotate: spin }] }]}
                                    >
                                        <Ionicons name="bulb" size={24} color="white" />
                                    </Animated.View>
                                    <Text style={styles.infoTitle}>Notification Tips</Text>
                                </View>
                                <View style={styles.tipsList}>
                                    <View style={styles.tipItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.tipText}>Set reminders to maintain recycling habits</Text>
                                    </View>
                                    <View style={styles.tipItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.tipText}>Enable achievement alerts to track progress</Text>
                                    </View>
                                    <View style={styles.tipItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.tipText}>Weekly reports show your environmental impact</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    </ScrollView>
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
    // Enhanced floating elements
    floatingElement: {
        position: 'absolute',
        borderRadius: 200,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 3,
    },
    element1: {
        width: 140,
        height: 140,
        top: 100,
        right: -50,
    },
    element2: {
        width: 120,
        height: 120,
        bottom: 200,
        left: -40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 24,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'relative',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    headerBadge: {
        position: 'absolute',
        top: -12,
        right: -30,
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    headerBadgeGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    tabSwitchButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 6,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    notificationsList: {
        flex: 1,
    },
    notificationsListContent: {
        paddingBottom: 20,
    },
    notificationItem: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationItemGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    unreadTitle: {
        fontWeight: '700',
        color: '#059669',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginLeft: 8,
        marginTop: 4,
    },
    unreadIndicatorGradient: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyStateCard: {
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        width: '100%',
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    testNotificationButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    testNotificationGradient: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    testNotificationText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
    },
    settingsSection: {
        marginBottom: 20,
    },
    sectionCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginLeft: 12,
    },
    settingsGroup: {
        gap: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    scheduleItem: {
        gap: 12,
    },
    scheduleLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginLeft: 8,
        flex: 1,
    },
    changeTimeButton: {
        backgroundColor: '#059669',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    changeTimeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    daysContainer: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    dayButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    dayButtonSelected: {
        backgroundColor: '#ecfdf5',
        borderColor: '#10b981',
    },
    dayText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    dayTextSelected: {
        color: '#059669',
    },
    infoCard: {
        borderRadius: 20,
        padding: 24,
        marginTop: 8,
        shadowColor: '#f59e0b',
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
    tipsList: {
        gap: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    tipText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
        flex: 1,
    },
});
