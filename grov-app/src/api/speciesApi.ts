import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { Species } from '../types/models';

export const speciesApi = {
  getSpeciesList: async (params?: { category?: string; is_native?: boolean; search?: string }) => {
    const response = await apiClient.get<ApiResponse<Species[]>>('/species', { params });
    return response.data;
  },

  getSpeciesDetails: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Species>>(`/species/${id}`);
    return response.data;
  },
};
