import { apiClient } from './client';
import { ApiResponse, ExploreStatsData } from '../types/api';
import { Activity, MapPin } from '../types/models';

export const activityApi = {
  getMyActivities: async (filter?: string) => {
    const params = filter ? { filter } : {};
    const response = await apiClient.get<ApiResponse<Activity[]>>('/activities/my-activities', { params });
    return response.data;
  },

  getActivityDetails: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Activity>>(`/activities/${id}`);
    return response.data;
  },

  logPlantation: async (payload: {
    species_id: number;
    quantity_planted: number;
    date: string;
    site_name: string;
    latitude: number;
    longitude: number;
    planting_method: string;
    field_notes?: string;
    photos?: string[];
  }) => {
    const formData = new FormData();
    formData.append('species_id', String(payload.species_id));
    formData.append('quantity_planted', String(payload.quantity_planted));
    formData.append('date', payload.date);
    formData.append('site_name', payload.site_name);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));
    formData.append('planting_method', payload.planting_method);
    if (payload.field_notes) formData.append('field_notes', payload.field_notes);

    if (payload.photos && payload.photos.length > 0) {
      payload.photos.forEach((uri, idx) => {
        const filename = uri.split('/').pop() || `photo_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        formData.append('photos[]', { uri, name: filename, type });
      });
    }

    const response = await apiClient.post<ApiResponse<Activity>>('/activities/plantation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  logSeeding: async (payload: {
    species_id: number;
    seeds_dispersed: number;
    date: string;
    site_name: string;
    latitude: number;
    longitude: number;
    dispersal_method: string;
    coverage_area_sqm?: number;
    field_notes?: string;
    photos?: string[];
  }) => {
    const formData = new FormData();
    formData.append('species_id', String(payload.species_id));
    formData.append('seeds_dispersed', String(payload.seeds_dispersed));
    formData.append('date', payload.date);
    formData.append('site_name', payload.site_name);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));
    formData.append('dispersal_method', payload.dispersal_method);
    if (payload.coverage_area_sqm) formData.append('coverage_area_sqm', String(payload.coverage_area_sqm));
    if (payload.field_notes) formData.append('field_notes', payload.field_notes);

    if (payload.photos && payload.photos.length > 0) {
      payload.photos.forEach((uri, idx) => {
        const filename = uri.split('/').pop() || `photo_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        formData.append('photos[]', { uri, name: filename, type });
      });
    }

    const response = await apiClient.post<ApiResponse<Activity>>('/activities/seeding', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMapPins: async (filters?: { verified?: boolean; plantation?: boolean; seeding?: boolean; monitored?: boolean; bbox?: string }) => {
    const response = await apiClient.get<ApiResponse<MapPin[]>>('/activities/map', { params: filters });
    return response.data;
  },

  getExploreStats: async () => {
    const response = await apiClient.get<ApiResponse<ExploreStatsData>>('/locations/explore');
    return response.data;
  },
};
