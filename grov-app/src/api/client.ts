import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:8000/api/v1`;
    }
    return 'http://192.168.1.10:8000/api/v1';
  }

  if (Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    if (host) {
      return `http://${host}:8000/api/v1`;
    }
  }

  return 'http://192.168.1.10:8000/api/v1';
};

export const DEFAULT_API_BASE_URL = getApiBaseUrl();

export const getCustomBackendUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem('custom_backend_url');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return DEFAULT_API_BASE_URL;
};

export const setCustomBackendUrl = async (url: string): Promise<void> => {
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    if (!cleanUrl.endsWith('/api/v1')) {
      cleanUrl = cleanUrl.replace(/\/+$/, '') + '/api/v1';
    }
    await AsyncStorage.setItem('custom_backend_url', cleanUrl);
    apiClient.defaults.baseURL = cleanUrl;
  } catch (e) {
    console.warn('Failed to save custom backend URL', e);
  }
};

export let API_BASE_URL = DEFAULT_API_BASE_URL;

export const resolveImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  const currentBase = apiClient.defaults.baseURL || API_BASE_URL;
  const backendBase = currentBase.replace(/\/api\/v1\/?$/, '');
  if (url.startsWith('http://localhost:8000') || url.startsWith('http://127.0.0.1:8000')) {
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, backendBase);
  }
  if (url.startsWith('/storage')) {
    return `${backendBase}${url}`;
  }
  return url;
};

export const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 12000,
});

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (e) {
    console.warn('Failed to store auth token', e);
  }
};

export const clearStoredToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (e) {
    console.warn('Failed to clear auth token', e);
  }
};

apiClient.interceptors.request.use(
  async (config) => {
    const customUrl = await getCustomBackendUrl();
    config.baseURL = customUrl;
    API_BASE_URL = customUrl;

    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearStoredToken();
    }
    // Extract a useful message from the response body
    const data = error.response?.data;
    if (data) {
      let msg = data.message || 'Something went wrong';
      if (data.errors) {
        const firstError = Object.values(data.errors as Record<string, string[]>)
          .flat()
          .shift();
        if (firstError) msg = firstError;
      }
      return Promise.reject(new Error(msg));
    }
    
    // Handle Network Error (connection timeout, host unreachable, Wi-Fi mismatch)
    if (!error.response && (error.message === 'Network Error' || error.code === 'ECONNABORTED')) {
      const currentUrl = apiClient.defaults.baseURL || DEFAULT_API_BASE_URL;
      return Promise.reject(
        new Error(
          `Cannot connect to backend server at ${currentUrl}.\n\nEnsure your device is connected to the same Wi-Fi network as the server, or tap the Server Settings icon to change the Server IP.`
        )
      );
    }

    return Promise.reject(error);
  }
);
