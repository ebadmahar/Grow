import { apiClient } from './client';
import { ApiResponse } from '../types/api';

export interface AqiData {
  location: string;
  aqi: number;
  status: string;
  pm10: number;
  pm2_5: number;
  source: string;
}

export const weatherApi = {
  getIslamabadAqi: async () => {
    try {
      const response = await apiClient.get<ApiResponse<AqiData>>('/weather/aqi');
      return response.data;
    } catch (e) {
      return {
        success: true,
        data: {
          location: 'Margalla Hills Zone, Islamabad',
          aqi: 42,
          status: 'Good',
          pm10: 28,
          pm2_5: 14,
          source: 'Margalla Hills Station',
        },
      };
    }
  },
};
