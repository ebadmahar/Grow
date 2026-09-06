import { apiClient } from './client';
import { ApiResponse, NotificationTimelineData } from '../types/api';
import { NotificationModel } from '../types/models';

export const notificationApi = {
  getNotifications: async () => {
    const response = await apiClient.get<ApiResponse<NotificationTimelineData>>('/notifications');
    return response.data;
  },

  markRead: async (id: number) => {
    const response = await apiClient.patch<ApiResponse<NotificationModel>>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await apiClient.patch<ApiResponse<null>>('/notifications/mark-all-read');
    return response.data;
  },
};
