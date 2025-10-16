import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const requestNotificationPermissions = async () => {
    try {
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

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('voucher-redemptions', {
                name: 'Voucher Redemptions',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#059669',
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
};

export const sendNotification = async (userId, notificationData) => {
    try {
        // For local development, show immediate notification
        // In production, you'd send this through Firebase Functions or a push service

        await Notifications.scheduleNotificationAsync({
            content: {
                title: notificationData.title,
                body: notificationData.body,
                data: notificationData.data || {},
                sound: true,
                priority: Notifications.AndroidImportance.HIGH,
            },
            trigger: null, // Show immediately
        });

        console.log('✅ Notification sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return { success: false, error: error.message };
    }
};

export const sendVoucherRedeemedNotification = async (userId, rewardName, voucherCode) => {
    return await sendNotification(userId, {
        title: 'Voucher Redeemed! 🎉',
        body: `Your "${rewardName}" voucher has been successfully redeemed at campus.`,
        data: {
            type: 'voucher_redeemed',
            rewardName: rewardName,
            voucherCode: voucherCode,
            timestamp: new Date().toISOString()
        }
    });
};

export const initializeNotifications = async () => {
    try {
        const hasPermission = await requestNotificationPermissions();

        if (hasPermission) {
            console.log('✅ Notifications initialized successfully');
        } else {
            console.log('⚠️ Notification permissions not granted');
        }

        return hasPermission;
    } catch (error) {
        console.error('❌ Error initializing notifications:', error);
        return false;
    }
};
