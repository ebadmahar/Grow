import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { CommunityTask } from '../types/models';

export const communityApi = {
  getTasks: async () => {
    const response = await apiClient.get<ApiResponse<CommunityTask[]>>('/community/tasks');
    return response.data;
  },

  getTaskDetails: async (id: number) => {
    const response = await apiClient.get<ApiResponse<CommunityTask>>(`/community/tasks/${id}`);
    return response.data;
  },

  createTask: async (payload: {
    title: string;
    activity_type: string;
    site_name: string;
    latitude: number;
    longitude: number;
    date: string;
    start_time: string;
    max_volunteers?: number;
    description: string;
    cover_image?: string;
  }) => {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('activity_type', payload.activity_type);
    formData.append('site_name', payload.site_name);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));
    formData.append('date', payload.date);
    formData.append('start_time', payload.start_time);
    if (payload.max_volunteers) formData.append('max_volunteers', String(payload.max_volunteers));
    formData.append('description', payload.description);

    if (payload.cover_image) {
      const filename = payload.cover_image.split('/').pop() || 'cover.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      // @ts-ignore
      formData.append('cover_image', { uri: payload.cover_image, name: filename, type });
    }

    const response = await apiClient.post<ApiResponse<CommunityTask>>('/community/tasks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  joinTask: async (id: number) => {
    const response = await apiClient.post<ApiResponse<{ task_id: number; status: string; current_participants: number }>>(`/community/tasks/${id}/join`);
    return response.data;
  },

  leaveTask: async (id: number) => {
    const response = await apiClient.post<ApiResponse<{ task_id: number; status: string }>>(`/community/tasks/${id}/leave`);
    return response.data;
  },

  updateTask: async (id: number, payload: Partial<{
    title: string;
    activity_type: string;
    date: string;
    start_time: string;
    max_volunteers: number;
    description: string;
    status: string;
  }>) => {
    const response = await apiClient.put<ApiResponse<CommunityTask>>(`/community/tasks/${id}`, payload);
    return response.data;
  },

  deleteTask: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/community/tasks/${id}`);
    return response.data;
  },
};
