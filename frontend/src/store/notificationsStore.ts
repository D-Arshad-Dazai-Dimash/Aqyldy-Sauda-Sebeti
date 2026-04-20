import { create } from 'zustand';
import * as NotificationsApi from '../api/notifications';
import type { NotificationResponse } from '../types/api';

type NotificationsState = {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: (limit?: number, offset?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  clearError: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (limit = 20, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const data = await NotificationsApi.getNotifications(limit, offset);
      set({ notifications: data.content, isLoading: false });
    } catch (error) {
      console.warn('Failed to fetch notifications:', error);
      set({ error: 'Не удалось загрузить уведомления', isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await NotificationsApi.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.warn('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await NotificationsApi.markNotificationAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
      set({ error: 'Не удалось обновить уведомление' });
    }
  },

  markAllAsRead: async () => {
    try {
      await NotificationsApi.markAllNotificationsAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.warn('Failed to mark all as read:', error);
      set({ error: 'Не удалось обновить уведомления' });
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await NotificationsApi.deleteNotification(notificationId);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: state.notifications.find((n) => n.id === notificationId && !n.read)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }));
    } catch (error) {
      console.warn('Failed to delete notification:', error);
      set({ error: 'Не удалось удалить уведомление' });
    }
  },

  deleteAllNotifications: async () => {
    try {
      await NotificationsApi.deleteAllNotifications();
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.warn('Failed to delete all notifications:', error);
      set({ error: 'Не удалось удалить уведомления' });
    }
  },

  clearError: () => set({ error: null }),
}));
