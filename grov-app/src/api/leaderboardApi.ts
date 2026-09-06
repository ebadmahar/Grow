import { apiClient } from './client';
import { ApiResponse, LeaderboardData, MyRankingData } from '../types/api';

export const leaderboardApi = {
  getLeaderboard: async (tab = 'plantation', period = 'monthly') => {
    const response = await apiClient.get<ApiResponse<LeaderboardData>>('/leaderboard', {
      params: { tab, period },
    });
    return response.data;
  },

  getMyRanking: async () => {
    const response = await apiClient.get<ApiResponse<MyRankingData>>('/leaderboard/my-ranking');
    return response.data;
  },
};
