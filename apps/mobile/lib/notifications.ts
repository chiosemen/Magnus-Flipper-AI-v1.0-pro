import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { env } from './env';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notifications = {
  /**
   * Request notification permissions
   */
  async requestPermissions() {
    if (!Device.isDevice) {
      console.warn('Notifications only work on physical devices');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return null;
    }

    return finalStatus;
  },

  /**
   * Get Expo push token and register with backend
   */
  async registerForPushNotifications() {
    try {
      const permission = await this.requestPermissions();
      if (!permission) return null;

      if (!env.enablePushNotifications) {
        console.warn('Push notifications are disabled in configuration');
        return null;
      }

      const projectId = env.expoProjectId;

      if (!projectId) {
        console.error('Missing Expo project ID. Set EXPO_PUBLIC_EXPO_PROJECT_ID in .env');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });

      // Register with backend
      const deviceId = Constants.sessionId || 'unknown';
      await api.registerPushToken(token.data, deviceId);

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  /**
   * Unregister from push notifications
   */
  async unregisterPushNotifications() {
    try {
      const deviceId = Constants.sessionId || 'unknown';
      await api.unregisterPushToken(deviceId);
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  },

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null,
    });
  },

  /**
   * Handle notification received while app is foregrounded
   */
  addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(handler);
  },

  /**
   * Handle notification tap/press
   */
  addNotificationResponseReceivedListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Get badge count
   */
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Clear badge
   */
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  },

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string) {
    await Notifications.dismissNotificationAsync(notificationId);
  },

  /**
   * Dismiss all notifications
   */
  async dismissAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  },
};

export default notifications;
