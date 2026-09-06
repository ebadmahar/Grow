import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { ReportModel } from '../types/models';

export const reportApi = {
  getMyReports: async () => {
    const response = await apiClient.get<ApiResponse<ReportModel[]>>('/reports/my-reports');
    return response.data;
  },

  submitReport: async (payload: {
    activity_id?: number;
    site_name: string;
    category: string;
    severity: string;
    description: string;
    photos?: string[];
  }) => {
    const formData = new FormData();
    if (payload.activity_id) formData.append('activity_id', String(payload.activity_id));
    formData.append('site_name', payload.site_name);
    formData.append('category', payload.category);
    formData.append('severity', payload.severity);
    formData.append('description', payload.description);

    if (payload.photos && payload.photos.length > 0) {
      payload.photos.forEach((uri, idx) => {
        const filename = uri.split('/').pop() || `photo_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        formData.append('photos[]', { uri, name: filename, type });
      });
    }

    const response = await apiClient.post<ApiResponse<ReportModel>>('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
