import { apiClient } from './client';
import { AdminDashboardData, ApiResponse } from '../types/api';
import { Activity, ReportModel } from '../types/models';

export const adminApi = {
  getDashboard: async () => {
    const response = await apiClient.get<ApiResponse<AdminDashboardData>>('/admin/dashboard');
    return response.data;
  },

  getActivitiesQueue: async (status = 'reported') => {
    const response = await apiClient.get<ApiResponse<Activity[]>>('/admin/activities', {
      params: { status },
    });
    return response.data;
  },

  verifyActivity: async (id: number, status: 'verified' | 'rejected') => {
    const response = await apiClient.patch<ApiResponse<Activity>>(`/admin/activities/${id}/verify`, { status });
    return response.data;
  },

  getReportsQueue: async () => {
    const response = await apiClient.get<ApiResponse<ReportModel[]>>('/admin/reports');
    return response.data;
  },

  resolveReport: async (id: number, payload: { status: 'investigating' | 'resolved' | 'dismissed'; resolution_notes?: string }) => {
    const response = await apiClient.patch<ApiResponse<ReportModel>>(`/admin/reports/${id}/resolve`, payload);
    return response.data;
  },

  updateMonthlyGoal: async (payload: { target_trees: number; target_seeds?: number; target_participants?: number }) => {
    const response = await apiClient.put<ApiResponse<any>>('/admin/goals/monthly', payload);
    return response.data;
  },

  broadcastNotification: async (payload: { title: string; message: string }) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/notifications/broadcast', payload);
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/users');
    return response.data;
  },

  updateUserRole: async (id: number, role: 'volunteer' | 'coordinator' | 'admin') => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  updateUser: async (id: number, payload: { name?: string; email?: string; role?: string; location?: string; bio?: string }) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/users/${id}`, payload);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/admin/users/${id}`);
    return response.data;
  },
};
