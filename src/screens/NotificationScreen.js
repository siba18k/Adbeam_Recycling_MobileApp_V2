import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import {
    Text,
    Card,
    ActivityIndicator,
    Badge,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '../context/NotificationContext';
import { colors, gradients } from '../theme/colors';

export default function NotificationScreen({ navigation }) {
    const {
        notifications,
        markAsRead,
        refreshNotifications,
        loading,
    } = useNotifications();

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, unread, read

    const filteredNotifications = notifications.filter((notification) => {
        switch (filter) {
            case 'unread':
                return !notification.read;
            case 'read':
                return notification.read;
            default:
                return true;
        }
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshNotifications();
        setIsRefreshing(false);
    };

    const handleNotificationPress = async (notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        switch (notification.data?.type) {
            case 'new_reward':
                navigation.navigate('Rewards');
                break;
            case 'voucher_redeemed':
                navigation.navigate('Vouchers');
                break;
            case 'achievement_unlocked':
                navigation.navigate('Profile');
                break;
            case 'level_up':
                navigation.navigate('Leaderboard');
                break;
            default:
                break;
        }
    };

    const getNotificationIcon = (category) => {
        switch (category) {
            case 'VOUCHER_REDEEMED':
                return 'checkmark-circle';
            case 'VOUCHER_EXPIRING':
                return 'time';
            case 'NEW_REWARD':
                return 'gift';
            case 'ACHIEVEMENT_UNLOCKED':
                return 'trophy';
            case 'LEVEL_UP':
                return 'trending-up';
            case 'BONUS_EVENT':
                return 'flash';
            case 'MILESTONE':
                return 'flag';
            case 'REMINDER':
                return 'alarm';
            case 'LEADERBOARD':
                return 'podium';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (category) => {
        switch (category) {
            case 'VOUCHER_REDEEMED':
                return gradients.success;
            case 'VOUCHER_EXPIRING':
                return [colors.accent.main, colors.accent.light];
            case 'NEW_REWARD':
                return gradients.primary;
            case 'ACHIEVEMENT_UNLOCKED':
                return ['#8b5cf6', '#a855f7'];
            case 'LEVEL_UP':
                return [colors.secondary.main, colors.secondary.light];
            case 'BONUS_EVENT':
                return gradients.accent;
            case 'MILESTONE':
                return gradients.success;
            case 'REMINDER':
                return [colors.text.secondary, colors.text.light];
            case 'LEADERBOARD':
                return gradients.accent;
            default:
                return gradients.secondary;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color={colors.primary.main} />
                        <Text style={styles.loadingText}>Loading notifications...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={gradients.backgroundNeutral} style={styles.gradient}>
                {/* Header */}
                <LinearGradient colors={gradients.backgroundPrimary} style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <Text style={styles.headerSubtitle}>
                            {unreadCount} unread • {notifications.length} total
                        </Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="notifications" size={28} color="white" />
                        {unreadCount > 0 && <Badge style={styles.unreadBadge}>{unreadCount}</Badge>}
                    </View>
                </LinearGradient>

                {/* Filters */}
                <View style={styles.filterContainer}>
                    {[
                        { key: 'all', title: 'All', count: notifications.length },
                        { key: 'unread', title: 'Unread', count: unreadCount },
                        { key: 'read', title: 'Read', count: notifications.length - unreadCount },
                    ].map((filterOption) => (
                        <TouchableOpacity
                            key={filterOption.key}
                            style={[styles.filterTab, filter === filterOption.key && styles.activeFilterTab]}
                            onPress={() => setFilter(filterOption.key)}
                        >
                            <LinearGradient
                                colors={filter === filterOption.key ? gradients.primary : ['transparent', 'transparent']}
                                style={styles.filterTabGradient}
                            >
                                <Text style={[styles.filterTabText, filter === filterOption.key && styles.activeFilterTabText]}>
                                    {filterOption.title}
                                </Text>
                                {filterOption.count > 0 && (
                                    <Badge
                                        style={[
                                            styles.filterBadge,
                                            { backgroundColor: filter === filterOption.key ? 'rgba(255,255,255,0.3)' : colors.primary.main },
                                        ]}
                                    >
                                        {filterOption.count}
                                    </Badge>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
                >
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                            <TouchableOpacity
                                key={notification.id}
                                onPress={() => handleNotificationPress(notification)}
                                activeOpacity={0.8}
                            >
                                <Card style={[styles.notificationCard, !notification.read && styles.unreadCard]}>
                                    <View style={styles.notificationContent}>
                                        <View style={styles.notificationIcon}>
                                            <LinearGradient colors={getNotificationColor(notification.category)} style={styles.iconGradient}>
                                                <Ionicons name={getNotificationIcon(notification.category)} size={20} color="white" />
                                            </LinearGradient>
                                        </View>
                                        <View style={styles.notificationText}>
                                            <Text style={styles.notificationTitle}>{notification.title}</Text>
                                            <Text style={styles.notificationBody}>{notification.body}</Text>
                                            <Text style={styles.notificationTime}>
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View style={styles.notificationStatus}>
                                            {!notification.read && <View style={styles.unreadDot} />}
                                            <Ionicons name="chevron-forward" size={16} color={colors.text.light} />
                                        </View>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <LinearGradient colors={[colors.primary.light + '40', colors.primary.light + '20']} style={styles.emptyIconContainer}>
                                <Ionicons name="notifications-outline" size={60} color={colors.primary.main} />
                            </LinearGradient>
                            <Text style={styles.emptyTitle}>
                                {filter === 'unread' ? 'No Unread Notifications' : filter === 'read' ? 'No Read Notifications' : 'No Notifications Yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {filter === 'unread'
                                    ? 'All caught up! Check back later for updates.'
                                    : filter === 'read'
                                        ? 'Read notifications will appear here.'
                                        : 'You\'ll receive notifications about rewards, achievements, and more!'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Use same styles as described before or adjust as needed
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
    headerIcon: {
        position: 'relative',
        marginLeft: 16,
    },
    unreadBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.status.error,
        fontSize: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        elevation: 2,
    },
    filterTab: {
        flex: 1,
        marginRight: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    activeFilterTab: {
        elevation: 4,
    },
    filterTabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    filterTabText: {
        fontSize: 14,
        color: colors.text.secondary,
        fontWeight: '500',
        marginRight: 6,
    },
    activeFilterTabText: {
        color: 'white',
        fontWeight: '700',
    },
    filterBadge: {
        fontSize: 10,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    notificationCard: {
        borderRadius: 16,
        elevation: 2,
        backgroundColor: colors.surface.white,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: colors.primary.main,
        elevation: 4,
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
    },
    notificationIcon: {
        marginRight: 12,
    },
    iconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationText: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    notificationBody: {
        fontSize: 14,
        color: colors.text.secondary,
        lineHeight: 20,
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 12,
        color: colors.text.light,
    },
    notificationStatus: {
        alignItems: 'center',
        marginLeft: 8,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary.main,
        marginBottom: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
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
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});
