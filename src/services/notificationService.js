import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ref, push, set, get, serverTimestamp, update } from 'firebase/database';
import { database } from '../config/firebase';

// Configure notifications with better handling for Expo Go limitations
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Enhanced notification categories with better organization
export const NOTIFICATION_CATEGORIES = {
    VOUCHER_REDEEMED: {
        id: 'voucher_redeemed',
        title: 'Voucher Redeemed! 🎉',
        sound: true,
        priority: 'high',
        color: '#22c55e',
        channel: 'voucher-updates'
    },
    VOUCHER_EXPIRING: {
        id: 'voucher_expiring',
        title: 'Voucher Expiring Soon! ⏰',
        sound: true,
        priority: 'normal',
        color: '#f59e0b',
        channel: 'voucher-updates'
    },
    NEW_REWARD: {
        id: 'new_reward',
        title: 'New Reward Available! 🎁',
        sound: true,
        priority: 'normal',
        color: '#059669',
        channel: 'achievements'
    },
    ACHIEVEMENT_UNLOCKED: {
        id: 'achievement_unlocked',
        title: 'Achievement Unlocked! 🏆',
        sound: true,
        priority: 'high',
        color: '#8b5cf6',
        channel: 'achievements'
    },
    LEVEL_UP: {
        id: 'level_up',
        title: 'Level Up! 🚀',
        sound: true,
        priority: 'high',
        color: '#3b82f6',
        channel: 'achievements'
    },
    BONUS_EVENT: {
        id: 'bonus_event',
        title: 'Bonus Points Event! ⚡',
        sound: true,
        priority: 'normal',
        color: '#f59e0b',
        channel: 'events'
    },
    MILESTONE: {
        id: 'milestone',
        title: 'Milestone Reached! 🎯',
        sound: true,
        priority: 'normal',
        color: '#10b981',
        channel: 'achievements'
    },
    REMINDER: {
        id: 'reminder',
        title: 'Recycling Reminder 📱',
        sound: false,
        priority: 'low',
        color: '#6b7280',
        channel: 'reminders'
    },
    LEADERBOARD: {
        id: 'leaderboard',
        title: 'Leaderboard Update! 🏅',
        sound: false,
        priority: 'low',
        color: '#f59e0b',
        channel: 'events'
    },
    SYSTEM: {
        id: 'system',
        title: 'System Notification 📢',
        sound: false,
        priority: 'normal',
        color: '#0ea5e9',
        channel: 'system'
    }
};

// Check if running in development environment (Expo Go)
const isDevelopment = () => {
    return __DEV__ && !Device.isDevice;
};

// Enhanced permission request with better error handling
export const requestNotificationPermissions = async () => {
    try {
        // Skip permission request in simulator/Expo Go for development
        if (isDevelopment()) {
            console.log('🔧 Development mode: Skipping notification permissions in simulator');
            return true;
        }

        if (!Device.isDevice) {
            console.log('⚠️ Notifications not available on simulator/emulator');
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            try {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            } catch (error) {
                console.log('⚠️ Notification permission request failed (Expo Go limitation):', error.message);
                // Return true to continue with local notifications only
                return true;
            }
        }

        if (finalStatus !== 'granted') {
            console.log('⚠️ Notification permission not granted - using local notifications only');
            return true; // Allow app to continue with limited functionality
        }

        // Only set up channels for real devices and production builds
        if (Platform.OS === 'android' && Device.isDevice) {
            await setupNotificationChannels();
        }

        console.log('✅ Notification permissions granted');
        return true;
    } catch (error) {
        console.error('❌ Error requesting notification permissions:', error);
        // Don't block the app - return true to continue with limited functionality
        return true;
    }
};

// Setup Android notification channels
const setupNotificationChannels = async () => {
    try {
        await Promise.all([
            Notifications.setNotificationChannelAsync('voucher-updates', {
                name: 'Voucher Updates',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#22c55e',
                description: 'Notifications about voucher redemptions and expiry',
                sound: 'default'
            }),
            Notifications.setNotificationChannelAsync('achievements', {
                name: 'Achievements & Rewards',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 300, 200, 300],
                lightColor: '#8b5cf6',
                description: 'Achievement unlocks and new rewards',
                sound: 'default'
            }),
            Notifications.setNotificationChannelAsync('events', {
                name: 'Events & Bonuses',
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 200, 100, 200],
                lightColor: '#f59e0b',
                description: 'Bonus events and special promotions',
                sound: 'default'
            }),
            Notifications.setNotificationChannelAsync('reminders', {
                name: 'Reminders',
                importance: Notifications.AndroidImportance.LOW,
                lightColor: '#6b7280',
                description: 'Helpful reminders and tips',
                sound: null
            }),
            Notifications.setNotificationChannelAsync('system', {
                name: 'System Messages',
                importance: Notifications.AndroidImportance.DEFAULT,
                lightColor: '#0ea5e9',
                description: 'System announcements and updates',
                sound: 'default'
            })
        ]);
        console.log('✅ Notification channels configured');
    } catch (error) {
        console.error('⚠️ Error setting up notification channels:', error);
    }
};

// Store notification in database for in-app notifications (always works)
const storeNotification = async (userId, notificationData) => {
    try {
        const notificationsRef = ref(database, `notifications/${userId}`);
        const newNotificationRef = push(notificationsRef);

        await set(newNotificationRef, {
            ...notificationData,
            id: newNotificationRef.key,
            read: false,
            createdAt: serverTimestamp()
        });

        return { success: true, id: newNotificationRef.key };
    } catch (error) {
        console.error('❌ Error storing notification:', error);
        return { success: false, error: error.message };
    }
};

// Enhanced core notification sender with better error handling
export const sendNotification = async (userId, notificationData) => {
    try {
        const category = NOTIFICATION_CATEGORIES[notificationData.category] || NOTIFICATION_CATEGORIES.SYSTEM;

        // Always store in database for in-app viewing (this always works)
        const storeResult = await storeNotification(userId, {
            ...notificationData,
            category: notificationData.category,
            priority: category.priority,
            color: category.color
        });

        if (!storeResult.success) {
            console.error('Failed to store notification in database');
        }

        // Try to send push notification (may fail in Expo Go)
        try {
            if (Device.isDevice || isDevelopment()) {
                const notificationContent = {
                    title: notificationData.title || category.title,
                    body: notificationData.body,
                    data: notificationData.data || {},
                    sound: category.sound ? 'default' : null,
                    priority: category.priority === 'high' ?
                        Notifications.AndroidImportance.HIGH :
                        Notifications.AndroidImportance.DEFAULT,
                    color: category.color,
                    categoryIdentifier: notificationData.category,
                    channelId: category.channel
                };

                await Notifications.scheduleNotificationAsync({
                    content: notificationContent,
                    trigger: notificationData.scheduleTime ?
                        { date: new Date(notificationData.scheduleTime) } :
                        null, // Send immediately
                });

                console.log('✅ Push notification sent successfully');
            } else {
                console.log('📱 Push notification skipped (simulator/Expo Go)');
            }
        } catch (pushError) {
            console.log('⚠️ Push notification failed (continuing with in-app only):', pushError.message);
            // Don't throw error - in-app notification was stored successfully
        }

        return { success: true, notificationId: storeResult.id };
    } catch (error) {
        console.error('❌ Error in sendNotification:', error);
        return { success: false, error: error.message };
    }
};

// Specific notification functions (unchanged but with better error handling)
export const sendVoucherRedeemedNotification = async (userId, rewardName, staffName, pointsCost) => {
    try {
        return await sendNotification(userId, {
            category: 'VOUCHER_REDEEMED',
            title: 'Voucher Redeemed! 🎉',
            body: `Your "${rewardName}" voucher (${pointsCost} pts) has been successfully redeemed by ${staffName}. Enjoy your reward!`,
            data: {
                type: 'voucher_redeemed',
                rewardName,
                staffName,
                pointsCost,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending voucher redeemed notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendVoucherExpiringNotification = async (userId, rewardName, expiresIn) => {
    try {
        return await sendNotification(userId, {
            category: 'VOUCHER_EXPIRING',
            title: 'Voucher Expiring Soon! ⏰',
            body: `Your "${rewardName}" voucher expires in ${expiresIn}. Visit the campus office to redeem it before it expires!`,
            data: {
                type: 'voucher_expiring',
                rewardName,
                expiresIn,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending voucher expiring notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendAchievementNotification = async (userId, achievementName, pointsEarned) => {
    try {
        return await sendNotification(userId, {
            category: 'ACHIEVEMENT_UNLOCKED',
            title: 'Achievement Unlocked! 🏆',
            body: `Congratulations! You've unlocked "${achievementName}" and earned ${pointsEarned} bonus points. Keep up the great work!`,
            data: {
                type: 'achievement_unlocked',
                achievementName,
                pointsEarned,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending achievement notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendLevelUpNotification = async (userId, newLevel, pointsToNext) => {
    try {
        return await sendNotification(userId, {
            category: 'LEVEL_UP',
            title: 'Level Up! 🚀',
            body: `Amazing! You've reached Level ${newLevel}! You're ${pointsToNext} points away from Level ${newLevel + 1}. Keep recycling to level up!`,
            data: {
                type: 'level_up',
                newLevel,
                pointsToNext,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending level up notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendNewRewardNotification = async (userId, rewardName, pointsCost, category) => {
    try {
        return await sendNotification(userId, {
            category: 'NEW_REWARD',
            title: 'New Reward Available! 🎁',
            body: `Check out the new "${rewardName}" reward in the ${category} category! Only ${pointsCost} points needed.`,
            data: {
                type: 'new_reward',
                rewardName,
                pointsCost,
                category,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending new reward notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendBonusEventNotification = async (userId, eventName, bonusMultiplier, endsAt) => {
    try {
        return await sendNotification(userId, {
            category: 'BONUS_EVENT',
            title: 'Bonus Points Event! ⚡',
            body: `${eventName} is active! Earn ${bonusMultiplier}x points until ${new Date(endsAt).toLocaleDateString()}. Start recycling now!`,
            data: {
                type: 'bonus_event',
                eventName,
                bonusMultiplier,
                endsAt,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending bonus event notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendMilestoneNotification = async (userId, milestone, reward) => {
    try {
        return await sendNotification(userId, {
            category: 'MILESTONE',
            title: 'Milestone Reached! 🎯',
            body: `Incredible! You've reached ${milestone}! ${reward ? `You've earned: ${reward}` : 'Keep up the amazing work!'}`,
            data: {
                type: 'milestone',
                milestone,
                reward,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending milestone notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendRecyclingReminderNotification = async (userId, daysSinceLastScan) => {
    try {
        const messages = [
            `It's been ${daysSinceLastScan} days since your last scan. The planet misses you! 🌍`,
            `Time to make a difference! You haven't recycled in ${daysSinceLastScan} days. Ready to earn some points? 💚`,
            `Your recycling streak is waiting! ${daysSinceLastScan} days without scanning - let's get back to saving the planet! 🌱`,
            `The environment needs heroes like you! Start a new recycling streak today. 🦸‍♂️`
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        return await sendNotification(userId, {
            category: 'REMINDER',
            title: 'Time to Recycle! 📱',
            body: randomMessage,
            data: {
                type: 'recycling_reminder',
                daysSinceLastScan,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending recycling reminder notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendLeaderboardUpdateNotification = async (userId, newRank, totalUsers) => {
    try {
        if (newRank <= 10) { // Only notify top 10
            return await sendNotification(userId, {
                category: 'LEADERBOARD',
                title: 'Leaderboard Update! 🏅',
                body: `You're now ranked #${newRank} out of ${totalUsers} recyclers! ${
                    newRank === 1 ? 'You are the top recycler! 👑' :
                        newRank <= 3 ? 'You\'re in the top 3! 🥉' :
                            'Great job climbing the leaderboard! 📈'
                }`,
                data: {
                    type: 'leaderboard_update',
                    newRank,
                    totalUsers,
                    timestamp: new Date().toISOString()
                }
            });
        }
        return { success: true, message: 'User not in top 10, notification skipped' };
    } catch (error) {
        console.error('Error sending leaderboard update notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendWelcomeNotification = async (userId, displayName) => {
    try {
        return await sendNotification(userId, {
            category: 'SYSTEM',
            title: 'Welcome to Adbeam! 🌱',
            body: `Hi ${displayName}! Ready to make a difference? Start by scanning your first recyclable item and earn points while saving the planet!`,
            data: {
                type: 'welcome',
                displayName,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending welcome notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendStreakNotification = async (userId, streakDays) => {
    try {
        const streakMessages = {
            3: { emoji: '🔥', message: 'You\'re on fire!' },
            7: { emoji: '⭐', message: 'One week strong!' },
            14: { emoji: '💪', message: 'Two weeks of dedication!' },
            30: { emoji: '🏆', message: 'One month champion!' },
            100: { emoji: '👑', message: 'You\'re a recycling legend!' }
        };

        const streak = streakMessages[streakDays];
        if (!streak) return { success: false, message: 'No streak milestone for this day count' };

        return await sendNotification(userId, {
            category: 'MILESTONE',
            title: `${streakDays} Day Streak! ${streak.emoji}`,
            body: `${streak.message} You've recycled for ${streakDays} consecutive days. The planet thanks you!`,
            data: {
                type: 'streak_milestone',
                streakDays,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending streak notification:', error);
        return { success: false, error: error.message };
    }
};

// Get user's notifications
export const getUserNotifications = async (userId, limit = 50) => {
    try {
        const notificationsRef = ref(database, `notifications/${userId}`);
        const snapshot = await get(notificationsRef);

        if (snapshot.exists()) {
            const notifications = [];
            snapshot.forEach((childSnapshot) => {
                notifications.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });

            // Sort by creation date (newest first)
            notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return { success: true, data: notifications.slice(0, limit) };
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error('Error getting user notifications:', error);
        return { success: false, error: error.message };
    }
};

// Mark notification as read
export const markNotificationAsRead = async (userId, notificationId) => {
    try {
        const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
        await update(notificationRef, {
            read: true,
            readAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }
};

// Enhanced initialization with better error handling
export const initializeNotifications = async (userId) => {
    try {
        console.log('🔄 Initializing notifications for user:', userId);
        
        const hasPermission = await requestNotificationPermissions();

        if (hasPermission) {
            console.log('✅ Notifications initialized successfully for user:', userId);
            
            // Schedule welcome notification for new users (delay to avoid spam)
            setTimeout(() => {
                sendWelcomeNotification(userId, 'Eco Warrior').catch(err => {
                    console.log('⚠️ Welcome notification failed (non-critical):', err.message);
                });
            }, 3000);

            return true;
        } else {
            console.log('⚠️ Notification permissions not fully granted - continuing with limited functionality');
            return true; // Don't block the app
        }
    } catch (error) {
        console.error('❌ Error initializing notifications:', error);
        // Don't throw error - allow app to continue
        return false;
    }
};

// Development helper to test notifications
export const testNotification = async (userId) => {
    if (__DEV__) {
        try {
            console.log('🧪 Testing notification system...');
            const result = await sendNotification(userId, {
                category: 'SYSTEM',
                title: '🧪 Test Notification',
                body: 'This is a test notification to verify the system is working.',
                data: {
                    type: 'test',
                    timestamp: new Date().toISOString()
                }
            });
            console.log('🧪 Test notification result:', result);
            return result;
        } catch (error) {
            console.error('🧪 Test notification failed:', error);
            return { success: false, error: error.message };
        }
    }
    return { success: false, error: 'Test notifications only available in development' };
};

// Export enhanced notification status
export const getNotificationStatus = () => {
    return {
        isDevice: Device.isDevice,
        isDevelopment: isDevelopment(),
        platform: Platform.OS,
        supportsFullNotifications: Device.isDevice && !isDevelopment()
    };
};