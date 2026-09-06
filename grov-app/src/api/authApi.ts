import { apiClient } from './client';
import { ApiResponse, AuthResponseData } from '../types/api';

export const authApi = {
  register: async (payload: { name: string; email: string; password: string; location?: string }) => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', payload);
    return response.data;
  },

  login: async (payload: { email: string; password: string; totp_code?: string }) => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', payload);
    return response.data;
  },

  forgotPassword: async (payload: { email: string }) => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', payload);
    return response.data;
  },

  resetPassword: async (payload: { token: string; email: string; password: string; password_confirmation: string }) => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/reset-password', payload);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },
};
