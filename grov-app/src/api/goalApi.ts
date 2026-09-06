import { apiClient } from './client';
import { ApiResponse, MonthlyGoalData } from '../types/api';

export const goalApi = {
  getMonthlyGoal: async () => {
    const response = await apiClient.get<ApiResponse<MonthlyGoalData>>('/goals/monthly');
    return response.data;
  },
};
