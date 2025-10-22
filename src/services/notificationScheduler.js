import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { checkExpiringVouchers, sendDailyReminders } from './notificationService';
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKGROUND_FETCH_TASK = 'background-notification-task';

// Register background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
        console.log('🔄 Running background notification tasks...');

        // Check for expiring vouchers
        await checkExpiringVouchers();

        // Send daily reminders (only runs once per day)
        const lastReminderDate = await AsyncStorage.getItem('lastReminderDate');
        const today = new Date().toDateString();

        if (lastReminderDate !== today) {
            await sendDailyReminders();
            await AsyncStorage.setItem('lastReminderDate', today);
        }

        console.log('✅ Background notification tasks completed');
        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('❌ Background task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

// Register background fetch
export const registerBackgroundFetch = async () => {
    try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 60 * 60 * 6, // Check every 6 hours
            stopOnTerminate: false,
            startOnBoot: true,
        });
        console.log('✅ Background fetch registered');
    } catch (error) {
        console.error('❌ Background fetch registration failed:', error);
    }
};
