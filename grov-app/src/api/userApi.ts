import { apiClient } from './client';
import { ApiResponse, UserProfileResponseData } from '../types/api';
import { Interest, User } from '../types/models';

export const userApi = {
  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<UserProfileResponseData>>('/user/profile');
    return response.data;
  },

  updateProfile: async (payload: { name?: string; location?: string; bio?: string; role?: string }) => {
    const response = await apiClient.put<ApiResponse<User>>('/user/profile', payload);
    return response.data;
  },

  uploadAvatar: async (fileUri: string) => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // @ts-ignore
    formData.append('avatar', {
      uri: fileUri,
      name: filename,
      type,
    });

    const response = await apiClient.post<ApiResponse<{ avatar_url: string }>>('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getInterests: async () => {
    const response = await apiClient.get<ApiResponse<{ interests: Interest[]; selected_ids: number[] }>>('/user/interests');
    return response.data;
  },

  updateInterests: async (interestIds: number[]) => {
    const response = await apiClient.put<ApiResponse<User>>('/user/interests', { interest_ids: interestIds });
    return response.data;
  },

  updateSettings: async (settings: Record<string, any>) => {
    const response = await apiClient.put<ApiResponse<{ settings: Record<string, any> }>>('/user/settings', { settings });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await apiClient.delete<ApiResponse<null>>('/user/account');
    return response.data;
  },
};
