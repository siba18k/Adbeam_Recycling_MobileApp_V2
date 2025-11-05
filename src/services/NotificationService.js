import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import UserPreferences from './UserPreferences';
import AccessibilityService from './AccessibilityService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.pushToken = null;
    this.listeners = [];
    this.scheduledNotifications = new Map();
    this.mlModel = {
      optimalTimes: {},
      userPatterns: {},
      engagementScores: {}
    };
    
    this.init();
  }

  async init() {
    try {
      // Request permissions
      await this.requestPermissions();
      
      // Get push token
      await this.getPushToken();
      
      // Load ML model data
      await this.loadMLModelData();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Schedule initial notifications
      await this.scheduleInitialNotifications();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
    }
  }

  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return false;
    }

    // Configure notification categories for interactive notifications
    await this.setupNotificationCategories();

    return true;
  }

  async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('SCAN_REMINDER', [
      {
        identifier: 'SCAN_NOW',
        buttonTitle: 'Scan Now',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'REMIND_LATER',
        buttonTitle: 'Remind Later',
        options: { opensAppToForeground: false }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('GOAL_ACHIEVEMENT', [
      {
        identifier: 'VIEW_PROGRESS',
        buttonTitle: 'View Progress',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'SHARE_ACHIEVEMENT',
        buttonTitle: 'Share',
        options: { opensAppToForeground: false }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('WEEKLY_SUMMARY', [
      {
        identifier: 'VIEW_DETAILS',
        buttonTitle: 'View Details',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'SET_NEW_GOAL',
        buttonTitle: 'New Goal',
        options: { opensAppToForeground: true }
      }
    ]);
  }

  async getPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      this.pushToken = token.data;
      
      // Save token for server registration
      await AsyncStorage.setItem('pushToken', this.pushToken);
      
      return this.pushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  setupNotificationListeners() {
    // Handle notification received while app is in foreground
    this.notificationReceivedListener = Notifications.addNotificationReceivedListener(
      notification => {
        this.handleNotificationReceived(notification);
      }
    );

    // Handle notification tapped by user
    this.notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        this.handleNotificationResponse(response);
      }
    );
  }

  async handleNotificationReceived(notification) {
    const { request } = notification;
    
    // Update ML model with notification delivery data
    await this.updateMLModel('delivered', {
      notificationId: request.identifier,
      timestamp: Date.now(),
      type: request.content.categoryIdentifier
    });
    
    // Provide accessibility announcement
    if (AccessibilityService.isScreenReaderEnabled) {
      const title = request.content.title;
      const body = request.content.body;
      await AccessibilityService.announceForScreenReader(`Notification: ${title}. ${body}`);
    }
  }

  async handleNotificationResponse(response) {
    const { notification, actionIdentifier } = response;
    const notificationData = notification.request.content.data;
    
    // Update ML model with engagement data
    await this.updateMLModel('engaged', {
      notificationId: notification.request.identifier,
      action: actionIdentifier,
      timestamp: Date.now(),
      responseTime: Date.now() - notification.date
    });
    
    // Handle different actions
    switch (actionIdentifier) {
      case 'SCAN_NOW':
        this.notifyListeners('navigateToScan');
        break;
      case 'VIEW_PROGRESS':
        this.notifyListeners('navigateToProgress');
        break;
      case 'REMIND_LATER':
        await this.scheduleReminderLater(notificationData);
        break;
      case 'SHARE_ACHIEVEMENT':
        this.notifyListeners('shareAchievement', notificationData);
        break;
      case 'VIEW_DETAILS':
        this.notifyListeners('viewWeeklyDetails');
        break;
      case 'SET_NEW_GOAL':
        this.notifyListeners('setNewGoal');
        break;
      default:
        // Default tap action
        this.notifyListeners('openApp', notificationData);
        break;
    }
  }

  // Smart notification scheduling with ML
  async scheduleSmartNotification(type, content, options = {}) {
    const preferences = UserPreferences.get('notifications');
    if (!preferences[type]) return null;
    
    // Get optimal time using ML model
    const optimalTime = await this.getOptimalNotificationTime(type);
    
    // Check quiet hours
    if (this.isInQuietHours(optimalTime)) {
      optimalTime = this.adjustForQuietHours(optimalTime);
    }
    
    const notificationId = await this.scheduleNotification({
      title: content.title,
      body: content.body,
      data: content.data || {},
      categoryIdentifier: this.getCategoryForType(type),
      trigger: {
        date: optimalTime
      },
      ...options
    });
    
    // Store notification for tracking
    this.scheduledNotifications.set(notificationId, {
      type,
      scheduledTime: optimalTime,
      content
    });
    
    return notificationId;
  }

  async getOptimalNotificationTime(type) {
    const userPatterns = this.mlModel.userPatterns[type] || {};
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    
    // Default optimal times by type
    const defaultOptimalHours = {
      scanReminder: [9, 12, 15, 18], // Morning, lunch, afternoon, evening
      goalAchievement: [10, 16, 20], // Mid-morning, afternoon, evening
      weeklyProgress: [9, 19], // Morning or evening
      socialUpdate: [12, 17] // Lunch or after work
    };
    
    let optimalHours = defaultOptimalHours[type] || [12];
    
    // Adjust based on user patterns
    if (userPatterns.hourlyEngagement) {
      // Find hours with highest engagement
      const engagementHours = Object.entries(userPatterns.hourlyEngagement)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));
      
      if (engagementHours.length > 0) {
        optimalHours = engagementHours;
      }
    }
    
    // Find next optimal time
    const now = new Date();
    let nextOptimalTime = new Date(now);
    
    for (const hour of optimalHours) {
      const candidateTime = new Date(now);
      candidateTime.setHours(hour, 0, 0, 0);
      
      if (candidateTime > now) {
        nextOptimalTime = candidateTime;
        break;
      }
    }
    
    // If no time today, use first optimal time tomorrow
    if (nextOptimalTime <= now) {
      nextOptimalTime.setDate(nextOptimalTime.getDate() + 1);
      nextOptimalTime.setHours(optimalHours[0], 0, 0, 0);
    }
    
    return nextOptimalTime;
  }

  isInQuietHours(dateTime) {
    const preferences = UserPreferences.get('notifications');
    if (!preferences.quietHours?.enabled) return false;
    
    const hour = dateTime.getHours();
    const startHour = parseInt(preferences.quietHours.start.split(':')[0]);
    const endHour = parseInt(preferences.quietHours.end.split(':')[0]);
    
    if (startHour <= endHour) {
      return hour >= startHour && hour < endHour;
    } else {
      // Quiet hours span midnight
      return hour >= startHour || hour < endHour;
    }
  }

  adjustForQuietHours(dateTime) {
    const preferences = UserPreferences.get('notifications');
    const endHour = parseInt(preferences.quietHours.end.split(':')[0]);
    
    const adjustedTime = new Date(dateTime);
    adjustedTime.setHours(endHour, 0, 0, 0);
    
    return adjustedTime;
  }

  getCategoryForType(type) {
    const categoryMap = {
      scanReminder: 'SCAN_REMINDER',
      goalAchievement: 'GOAL_ACHIEVEMENT',
      weeklyProgress: 'WEEKLY_SUMMARY',
      socialUpdate: 'SOCIAL_UPDATE'
    };
    
    return categoryMap[type] || 'DEFAULT';
  }

  // Schedule specific notification types
  async scheduleScanReminder(context = {}) {
    const preferences = UserPreferences.get('notifications');
    if (!preferences.scanReminders) return;
    
    const content = {
      title: 'Time to Recycle! ♻️',
      body: this.generateScanReminderMessage(context),
      data: { type: 'scanReminder', context }
    };
    
    return await this.scheduleSmartNotification('scanReminder', content);
  }

  generateScanReminderMessage(context) {
    const messages = [
      "Don't forget to scan that recyclable item!",
      "Your daily goal is waiting - scan something today!",
      "Make a difference - recycle and earn points!",
      "Quick scan = easy points. What are you waiting for?",
      "Your campus is counting on you. Scan to recycle!"
    ];
    
    if (context.nearGoal) {
      messages.unshift(`You're ${context.remaining} scans away from your daily goal!`);
    }
    
    if (context.streak) {
      messages.unshift(`Keep your ${context.streak}-day streak alive!`);
    }
    
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  async scheduleGoalAchievement(achievement) {
    const content = {
      title: '🎉 Goal Achieved!',
      body: `Congratulations! You've ${achievement.description}`,
      data: { type: 'goalAchievement', achievement }
    };
    
    return await this.scheduleSmartNotification('goalAchievement', content);
  }

  async scheduleWeeklyProgress(stats) {
    const content = {
      title: '📊 Weekly Progress',
      body: `You recycled ${stats.itemsScanned} items this week! ${stats.comparison}`,
      data: { type: 'weeklyProgress', stats }
    };
    
    return await this.scheduleSmartNotification('weeklyProgress', content);
  }

  async scheduleSocialUpdate(update) {
    const preferences = UserPreferences.get('notifications');
    if (!preferences.socialUpdates) return;
    
    const content = {
      title: update.title,
      body: update.message,
      data: { type: 'socialUpdate', update }
    };
    
    return await this.scheduleSmartNotification('socialUpdate', content);
  }

  // Batch notification management
  async scheduleBatchNotifications(notifications) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        const id = await this.scheduleSmartNotification(
          notification.type,
          notification.content,
          notification.options
        );
        results.push({ success: true, id, notification });
      } catch (error) {
        results.push({ success: false, error, notification });
      }
    }
    
    return results;
  }

  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.scheduledNotifications.delete(notificationId);
      return true;
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      return false;
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      return true;
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
      return false;
    }
  }

  // ML Model for notification optimization
  async updateMLModel(action, data) {
    const { type, timestamp } = data;
    const hour = new Date(timestamp).getHours();
    const dayOfWeek = new Date(timestamp).getDay();
    
    if (!this.mlModel.userPatterns[type]) {
      this.mlModel.userPatterns[type] = {
        hourlyEngagement: {},
        weeklyEngagement: {},
        totalSent: 0,
        totalEngaged: 0
      };
    }
    
    const pattern = this.mlModel.userPatterns[type];
    
    if (action === 'delivered') {
      pattern.totalSent++;
    } else if (action === 'engaged') {
      pattern.totalEngaged++;
      
      // Track hourly engagement
      pattern.hourlyEngagement[hour] = (pattern.hourlyEngagement[hour] || 0) + 1;
      
      // Track weekly engagement
      pattern.weeklyEngagement[dayOfWeek] = (pattern.weeklyEngagement[dayOfWeek] || 0) + 1;
    }
    
    // Calculate engagement rate
    pattern.engagementRate = pattern.totalSent > 0 ? pattern.totalEngaged / pattern.totalSent : 0;
    
    // Save updated model
    await this.saveMLModelData();
  }

  async loadMLModelData() {
    try {
      const stored = await AsyncStorage.getItem('notificationMLModel');
      if (stored) {
        this.mlModel = { ...this.mlModel, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load ML model data:', error);
    }
  }

  async saveMLModelData() {
    try {
      await AsyncStorage.setItem('notificationMLModel', JSON.stringify(this.mlModel));
    } catch (error) {
      console.warn('Failed to save ML model data:', error);
    }
  }

  // Initial notification setup
  async scheduleInitialNotifications() {
    // Schedule daily scan reminder
    await this.scheduleScanReminder();
    
    // Schedule weekly progress notification for Sunday evening
    const weeklyTime = new Date();
    weeklyTime.setDate(weeklyTime.getDate() + (7 - weeklyTime.getDay())); // Next Sunday
    weeklyTime.setHours(19, 0, 0, 0); // 7 PM
    
    await this.scheduleNotification({
      title: '📊 Weekly Check-in',
      body: 'See how your recycling efforts added up this week!',
      trigger: { date: weeklyTime, repeats: true },
      categoryIdentifier: 'WEEKLY_SUMMARY'
    });
  }

  async scheduleNotification(content) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data || {},
          categoryIdentifier: content.categoryIdentifier,
          sound: 'default'
        },
        trigger: content.trigger
      });
      
      return id;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async scheduleReminderLater(originalData) {
    // Schedule reminder for 2 hours later
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + 2);
    
    return await this.scheduleNotification({
      title: 'Friendly Reminder ♻️',
      body: 'Still time to scan something today!',
      data: originalData,
      trigger: { date: reminderTime },
      categoryIdentifier: 'SCAN_REMINDER'
    });
  }

  // Analytics and insights
  getNotificationAnalytics() {
    const analytics = {
      totalScheduled: this.scheduledNotifications.size,
      typeBreakdown: {},
      engagementRates: {},
      optimalTimes: {}
    };
    
    // Process scheduled notifications
    for (const [id, notification] of this.scheduledNotifications) {
      const type = notification.type;
      analytics.typeBreakdown[type] = (analytics.typeBreakdown[type] || 0) + 1;
    }
    
    // Process ML model data
    for (const [type, pattern] of Object.entries(this.mlModel.userPatterns)) {
      analytics.engagementRates[type] = pattern.engagementRate || 0;
      
      if (pattern.hourlyEngagement) {
        const bestHour = Object.entries(pattern.hourlyEngagement)
          .sort(([,a], [,b]) => b - a)[0];
        analytics.optimalTimes[type] = bestHour ? parseInt(bestHour[0]) : null;
      }
    }
    
    return analytics;
  }

  // Event system
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.warn('Notification listener error:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    if (this.notificationReceivedListener) {
      this.notificationReceivedListener.remove();
    }
    if (this.notificationResponseListener) {
      this.notificationResponseListener.remove();
    }
    this.listeners = [];
  }
}

export default new NotificationService();