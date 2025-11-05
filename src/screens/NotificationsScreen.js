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
import { ref, onValue, off, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function NotificationsScreen({ navigation }) {
    const { user } = useAuth();

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

    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('notifications');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadNotificationSettings();

        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();

        // Background animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, { toValue: -25, duration: 3500, useNativeDriver: true }),
                Animated.timing(float1, { toValue: 25, duration: 3500, useNativeDriver: true }),
                Animated.timing(float1, { toValue: 0, duration: 3500, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 15000, useNativeDriver: true })).start();
    }, []);

    // Realtime notifications listener
    useEffect(() => {
        if (!user) return;
        const notifRef = ref(database, `notifications/${user.uid}`);
        const unsubscribe = onValue(notifRef, (snapshot) => {
            if (snapshot.exists()) {
                const list = [];
                snapshot.forEach((child) => {
                    const n = child.val();
                    list.push({
                        id: child.key,
                        title: n.title || 'Notification',
                        message: n.body || n.message || '',
                        read: !!n.read,
                        timestamp: n.createdAt ? new Date(n.createdAt) : new Date(),
                        category: n.category || 'SYSTEM',
                    });
                });
                list.sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
                setNotifications(list);
            } else {
                setNotifications([]);
            }
        });
        return () => off(notifRef);
    }, [user]);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    const loadNotificationSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('notificationSettings');
            if (saved) {
                setNotificationSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
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

    const formatTimestamp = (ts) => {
        const date = ts instanceof Date ? ts : new Date(ts);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const categoryStyle = (category) => {
        switch (category) {
            case 'VOUCHER_REDEEMED':
                return { icon: 'checkmark-circle', color: '#22c55e' };
            case 'VOUCHER_EXPIRING':
                return { icon: 'time', color: '#f59e0b' };
            case 'NEW_REWARD':
                return { icon: 'gift', color: '#3b82f6' };
            case 'ACHIEVEMENT_UNLOCKED':
                return { icon: 'trophy', color: '#8b5cf6' };
            case 'LEVEL_UP':
                return { icon: 'rocket', color: '#3b82f6' };
            case 'MILESTONE':
                return { icon: 'flag', color: '#10b981' };
            case 'REMINDER':
                return { icon: 'leaf', color: '#6b7280' };
            case 'LEADERBOARD':
                return { icon: 'podium', color: '#f59e0b' };
            default:
                return { icon: 'notifications', color: '#059669' };
        }
    };

    const clearAllNotifications = () => {
        if (!user) return;
        Alert.alert(
            'Clear All Notifications',
            'This will permanently remove all notifications from your account.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await remove(ref(database, `notifications/${user.uid}`));
                            // UI will update via realtime listener
                        } catch (e) {
                            Alert.alert('Error', e.message || 'Failed to clear notifications');
                        }
                    }
                }
            ]
        );
    };

    const renderNotificationItem = ({ item, index }) => {
        const style = categoryStyle(item.category);
        return (
            <Animated.View
                style={[
                    styles.notificationItem,
                    { opacity: fadeAnim, transform: [{ translateX: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [index % 2 === 0 ? -30 : 30, 0] }) }] }
                ]}
            >
                <LinearGradient colors={item.read ? ['#ffffff', '#f9fafb'] : ['#ecfdf5', '#f0fdf4']} style={styles.notificationItemGradient}>
                    <View style={[styles.notificationIcon, { backgroundColor: style.color }]}>
                        <Ionicons name={style.icon} size={20} color="white" />
                    </View>
                    <View style={styles.notificationContent}>
                        <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
                        <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
                        <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fef3c7', '#fde68a', '#ffffff']} style={styles.gradient}>
                {/* Floating elements */}
                <Animated.View style={[styles.floatingElement, styles.element1, { backgroundColor: '#f59e0b', opacity: 0.15, transform: [{ translateY: float1 }, { rotate: spin }] }]} />
                <Animated.View style={[styles.floatingElement, styles.element2, { backgroundColor: '#059669', opacity: 0.12, transform: [{ translateY: float2 }, { scale: pulseAnim }] }]} />

                {/* Header */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: pulseAnim }] }}>
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
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

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={styles.headerIconButton} onPress={clearAllNotifications} activeOpacity={0.7}>
                                <Ionicons name="trash" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tabSwitchButton} onPress={() => setActiveTab(activeTab === 'notifications' ? 'settings' : 'notifications')} activeOpacity={0.7}>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Ionicons name={activeTab === 'notifications' ? 'settings' : 'list'} size={20} color="white" />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Tabs */}
                {activeTab === 'notifications' ? (
                    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {notifications.length > 0 ? (
                            <FlatList data={notifications} renderItem={renderNotificationItem} keyExtractor={(item) => item.id} style={styles.notificationsList} contentContainerStyle={styles.notificationsListContent} showsVerticalScrollIndicator={false} />
                        ) : (
                            <View style={styles.emptyState}>
                                <LinearGradient colors={['#ffffff', '#f9fafb']} style={styles.emptyStateCard}>
                                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                        <Ionicons name="notifications-off" size={48} color="#6b7280" />
                                    </Animated.View>
                                    <Text style={styles.emptyStateTitle}>No Notifications</Text>
                                    <Text style={styles.emptyStateText}>New notifications will appear here.</Text>
                                </LinearGradient>
                            </View>
                        )}
                    </Animated.View>
                ) : (
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <LinearGradient colors={['#ffffff', '#f9fafb']} style={[styles.sectionCard, { marginBottom: 20 }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="notifications-circle" size={20} color="#f59e0b" />
                                <Text style={styles.sectionTitle}>Notification Types</Text>
                            </View>
                            <View style={styles.settingsGroup}>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Scan Reminders</Text>
                                        <Text style={styles.settingDescription}>Weekly reminders to recycle items</Text>
                                    </View>
                                    <Switch value={notificationSettings.scanReminders} onValueChange={(v) => updateNotificationSetting('scanReminders', v)} trackColor={{ false: '#d1d5db', true: '#fbbf24' }} thumbColor={notificationSettings.scanReminders ? '#f59e0b' : '#6b7280'} />
                                </View>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Reward Alerts</Text>
                                        <Text style={styles.settingDescription}>Notify when new rewards are available</Text>
                                    </View>
                                    <Switch value={notificationSettings.rewardAlerts} onValueChange={(v) => updateNotificationSetting('rewardAlerts', v)} trackColor={{ false: '#d1d5db', true: '#fbbf24' }} thumbColor={notificationSettings.rewardAlerts ? '#f59e0b' : '#6b7280'} />
                                </View>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Achievement Badges</Text>
                                        <Text style={styles.settingDescription}>Celebrate your eco-milestones</Text>
                                    </View>
                                    <Switch value={notificationSettings.achievementBadges} onValueChange={(v) => updateNotificationSetting('achievementBadges', v)} trackColor={{ false: '#d1d5db', true: '#fbbf24' }} thumbColor={notificationSettings.achievementBadges ? '#f59e0b' : '#6b7280'} />
                                </View>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Leaderboard Updates</Text>
                                        <Text style={styles.settingDescription}>Ranking changes and competitions</Text>
                                    </View>
                                    <Switch value={notificationSettings.leaderboardUpdates} onValueChange={(v) => updateNotificationSetting('leaderboardUpdates', v)} trackColor={{ false: '#d1d5db', true: '#fbbf24' }} thumbColor={notificationSettings.leaderboardUpdates ? '#f59e0b' : '#6b7280'} />
                                </View>
                                <View style={styles.settingItem}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingTitle}>Weekly Report</Text>
                                        <Text style={styles.settingDescription}>Your recycling impact summary</Text>
                                    </View>
                                    <Switch value={notificationSettings.weeklyReport} onValueChange={(v) => updateNotificationSetting('weeklyReport', v)} trackColor={{ false: '#d1d5db', true: '#fbbf24' }} thumbColor={notificationSettings.weeklyReport ? '#f59e0b' : '#6b7280'} />
                                </View>
                            </View>
                        </LinearGradient>
                    </ScrollView>
                )}
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    floatingElement: { position: 'absolute', borderRadius: 200, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3 },
    element1: { width: 140, height: 140, top: 100, right: -50 },
    element2: { width: 120, height: 120, bottom: 200, left: -40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    backButton: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
    headerCenter: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', position: 'relative' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: 'white', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
    headerBadge: { position: 'absolute', top: -12, right: -30, width: 24, height: 24, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'white', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
    headerBadgeGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
    tabSwitchButton: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
    headerIconButton: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
    contentContainer: { flex: 1, padding: 16 },
    notificationsList: { flex: 1 },
    notificationsListContent: { paddingBottom: 20 },
    notificationItem: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    notificationItemGradient: { padding: 16, flexDirection: 'row', alignItems: 'flex-start' },
    notificationIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
    notificationContent: { flex: 1 },
    notificationTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
    unreadTitle: { fontWeight: '700', color: '#059669' },
    notificationMessage: { fontSize: 14, color: '#4b5563', lineHeight: 20, marginBottom: 6 },
    notificationTime: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyStateCard: { padding: 32, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, width: '100%' },
    emptyStateTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginTop: 16, marginBottom: 8 },
    emptyStateText: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 120 },
    sectionCard: { borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#f3f4f6' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginLeft: 12 },
    settingsGroup: { gap: 16 },
    settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    settingInfo: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
    settingDescription: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
});
