import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ref, push, set, get, serverTimestamp, update } from 'firebase/database';
import { database } from '../config/firebase';

// Configure notifications
// With this updated version:
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,  // Shows system banner/toast
        shouldShowList: true,    // Shows in notification center
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Notification Categories
export const NOTIFICATION_CATEGORIES = {
    VOUCHER_REDEEMED: {
        id: 'voucher_redeemed',
        title: 'Voucher Redeemed! 🎉',
        sound: true,
        priority: 'high',
        color: '#22c55e'
    },
    VOUCHER_EXPIRING: {
        id: 'voucher_expiring',
        title: 'Voucher Expiring Soon! ⏰',
        sound: true,
        priority: 'normal',
        color: '#f59e0b'
    },
    NEW_REWARD: {
        id: 'new_reward',
        title: 'New Reward Available! 🎁',
        sound: true,
        priority: 'normal',
        color: '#059669'
    },
    ACHIEVEMENT_UNLOCKED: {
        id: 'achievement_unlocked',
        title: 'Achievement Unlocked! 🏆',
        sound: true,
        priority: 'high',
        color: '#8b5cf6'
    },
    LEVEL_UP: {
        id: 'level_up',
        title: 'Level Up! 🚀',
        sound: true,
        priority: 'high',
        color: '#3b82f6'
    },
    BONUS_EVENT: {
        id: 'bonus_event',
        title: 'Bonus Points Event! ⚡',
        sound: true,
        priority: 'normal',
        color: '#f59e0b'
    },
    MILESTONE: {
        id: 'milestone',
        title: 'Milestone Reached! 🎯',
        sound: true,
        priority: 'normal',
        color: '#10b981'
    },
    REMINDER: {
        id: 'reminder',
        title: 'Recycling Reminder 📱',
        sound: false,
        priority: 'low',
        color: '#6b7280'
    },
    LEADERBOARD: {
        id: 'leaderboard',
        title: 'Leaderboard Update! 🏅',
        sound: false,
        priority: 'low',
        color: '#f59e0b'
    },
    SYSTEM: {
        id: 'system',
        title: 'System Notification 📢',
        sound: false,
        priority: 'normal',
        color: '#0ea5e9'
    }
};

export const requestNotificationPermissions = async () => {
    try {
        if (!Device.isDevice) {
            console.log('Notifications not available on simulator');
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permission not granted');
            return false;
        }

        // Configure notification channels for Android
        if (Platform.OS === 'android') {
            await Promise.all([
                Notifications.setNotificationChannelAsync('voucher-updates', {
                    name: 'Voucher Updates',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#22c55e',
                    description: 'Notifications about voucher redemptions and expiry'
                }),
                Notifications.setNotificationChannelAsync('achievements', {
                    name: 'Achievements & Rewards',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 300, 200, 300],
                    lightColor: '#8b5cf6',
                    description: 'Achievement unlocks and new rewards'
                }),
                Notifications.setNotificationChannelAsync('events', {
                    name: 'Events & Bonuses',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    vibrationPattern: [0, 200, 100, 200],
                    lightColor: '#f59e0b',
                    description: 'Bonus events and special promotions'
                }),
                Notifications.setNotificationChannelAsync('reminders', {
                    name: 'Reminders',
                    importance: Notifications.AndroidImportance.LOW,
                    lightColor: '#6b7280',
                    description: 'Helpful reminders and tips'
                })
            ]);
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
};

// Store notification in database for in-app notifications
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
        console.error('Error storing notification:', error);
        return { success: false, error: error.message };
    }
};

// Core notification sender
export const sendNotification = async (userId, notificationData) => {
    try {
        const category = NOTIFICATION_CATEGORIES[notificationData.category] || NOTIFICATION_CATEGORIES.SYSTEM;

        // Store in database for in-app viewing
        const storeResult = await storeNotification(userId, {
            ...notificationData,
            category: notificationData.category,
            priority: category.priority,
            color: category.color
        });

        // Send push notification
        const notificationContent = {
            title: notificationData.title || category.title,
            body: notificationData.body,
            data: notificationData.data || {},
            sound: category.sound,
            priority: category.priority === 'high' ?
                Notifications.AndroidImportance.HIGH :
                Notifications.AndroidImportance.DEFAULT,
            color: category.color,
            categoryIdentifier: notificationData.category,
        };

        await Notifications.scheduleNotificationAsync({
            content: notificationContent,
            trigger: notificationData.scheduleTime ?
                { date: new Date(notificationData.scheduleTime) } :
                null, // Send immediately if no schedule time
        });

        console.log('✅ Notification sent successfully');
        return { success: true, notificationId: storeResult.id };
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return { success: false, error: error.message };
    }
};

// Specific notification functions
export const sendVoucherRedeemedNotification = async (userId, rewardName, staffName, pointsCost) => {
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
};

export const sendVoucherExpiringNotification = async (userId, rewardName, expiresIn) => {
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
};

export const sendAchievementNotification = async (userId, achievementName, pointsEarned) => {
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
};

export const sendLevelUpNotification = async (userId, newLevel, pointsToNext) => {
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
};

export const sendNewRewardNotification = async (userId, rewardName, pointsCost, category) => {
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
};

export const sendBonusEventNotification = async (userId, eventName, bonusMultiplier, endsAt) => {
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
};

export const sendMilestoneNotification = async (userId, milestone, reward) => {
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
};

export const sendRecyclingReminderNotification = async (userId, daysSinceLastScan) => {
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
};

export const sendLeaderboardUpdateNotification = async (userId, newRank, totalUsers) => {
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
};

export const sendWelcomeNotification = async (userId, displayName) => {
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
};

export const sendStreakNotification = async (userId, streakDays) => {
    const streakMessages = {
        3: { emoji: '🔥', message: 'You\'re on fire!' },
        7: { emoji: '⭐', message: 'One week strong!' },
        14: { emoji: '💪', message: 'Two weeks of dedication!' },
        30: { emoji: '🏆', message: 'One month champion!' },
        100: { emoji: '👑', message: 'You\'re a recycling legend!' }
    };

    const streak = streakMessages[streakDays];
    if (!streak) return;

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

// Initialize notifications for a user
export const initializeNotifications = async (userId) => {
    try {
        const hasPermission = await requestNotificationPermissions();

        if (hasPermission) {
            console.log('✅ Notifications initialized successfully for user:', userId);

            // Schedule welcome notification for new users
            setTimeout(() => {
                sendWelcomeNotification(userId, 'Eco Warrior');
            }, 2000);

            return true;
        } else {
            console.log('⚠️ Notification permissions not granted');
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing notifications:', error);
        return false;
    }
};
