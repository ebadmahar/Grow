import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { MonitoringRecord } from '../types/models';

export const monitoringApi = {
  getHistory: async () => {
    const response = await apiClient.get<ApiResponse<MonitoringRecord[]>>('/monitoring/records');
    return response.data;
  },

  getForActivity: async (activityId: number) => {
    const response = await apiClient.get<ApiResponse<{ activity_id: number; monitoring_records: MonitoringRecord[] }>>(`/activities/${activityId}/monitoring`);
    return response.data;
  },

  submitRecord: async (payload: {
    activity_id: number;
    observation_date: string;
    observed_count: number;
    established_count: number;
    surviving_count: number;
    dead_count: number;
    condition: string;
    notes?: string;
    photos?: string[];
  }) => {
    const formData = new FormData();
    formData.append('activity_id', String(payload.activity_id));
    formData.append('observation_date', payload.observation_date);
    formData.append('observed_count', String(payload.observed_count));
    formData.append('established_count', String(payload.established_count));
    formData.append('surviving_count', String(payload.surviving_count));
    formData.append('dead_count', String(payload.dead_count));
    formData.append('condition', payload.condition);
    if (payload.notes) formData.append('notes', payload.notes);

    if (payload.photos && payload.photos.length > 0) {
      payload.photos.forEach((uri, idx) => {
        const filename = uri.split('/').pop() || `photo_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        formData.append('photos[]', { uri, name: filename, type });
      });
    }

    const response = await apiClient.post<ApiResponse<MonitoringRecord>>('/monitoring/records', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
