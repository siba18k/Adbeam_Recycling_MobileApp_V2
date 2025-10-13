import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const registerForPushNotifications = async () => {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return { success: false, error: 'Permission not granted' };
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return { success: true, token };
};

export const scheduleStreakReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Don't break your streak! 🔥",
            body: 'Recycle today to keep your streak going!',
            data: { type: 'streak_reminder' },
        },
        trigger: {
            hour: 18, // 6 PM
            minute: 0,
            repeats: true,
        },
    });
};

export const sendLocalNotification = async (title, body, data = {}) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
        },
        trigger: null, // Send immediately
    });
};

export const notifyPointsEarned = async (points, materialType) => {
    await sendLocalNotification(
        `+${points} Points! 🎉`,
        `You earned ${points} points for recycling ${materialType}!`,
        { type: 'points_earned', points }
    );
};

export const notifyAchievement = async (achievementName) => {
    await sendLocalNotification(
        'Achievement Unlocked! 🏆',
        `You've earned the "${achievementName}" achievement!`,
        { type: 'achievement', name: achievementName }
    );
};

export const notifyLevelUp = async (newLevel) => {
    await sendLocalNotification(
        'Level Up! 🚀',
        `Congratulations! You've reached Level ${newLevel}!`,
        { type: 'level_up', level: newLevel }
    );
};
