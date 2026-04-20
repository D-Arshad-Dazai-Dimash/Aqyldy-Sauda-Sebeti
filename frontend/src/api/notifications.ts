import { api } from './client';
import type { NotificationResponse, Page } from '../types/api';

/**
 * Получить список уведомлений пользователя
 */
export async function getNotifications(limit = 20, offset = 0): Promise<Page<NotificationResponse>> {
  const response = await api.get<Page<NotificationResponse>>('/api/notifications', {
    params: { limit, offset },
  });
  return response.data;
}

/**
 * Получить непрочитанные уведомления
 */
export async function getUnreadNotifications(): Promise<{ count: number; notifications: NotificationResponse[] }> {
  const response = await api.get<{ count: number; notifications: NotificationResponse[] }>(
    '/api/notifications/unread'
  );
  return response.data;
}

/**
 * Отметить уведомление как прочитанное
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await api.put(`/api/notifications/${notificationId}/read`);
}

/**
 * Отметить все уведомления как прочитанные
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await api.put('/api/notifications/read-all');
}

/**
 * Удалить уведомление
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/api/notifications/${notificationId}`);
}

/**
 * Удалить все уведомления
 */
export async function deleteAllNotifications(): Promise<void> {
  await api.delete('/api/notifications');
}

/**
 * Получить количество непрочитанных уведомлений
 */
export async function getUnreadCount(): Promise<number> {
  const response = await api.get<{ count: number }>('/api/notifications/unread/count');
  return response.data.count;
}
