import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { DEFAULT_FUNCTIONS_BASE_URL } from '../firebase/config';

const getApiBaseUrl = () => {
  // If explicitly overridden via environment variable
  if (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL) {
    return process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL;
  }

  // If running in local web development
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://127.0.0.1:5001/grov-staging/asia-south1';
    }
    return DEFAULT_FUNCTIONS_BASE_URL;
  }

  // If running in local native development with Metro bundler
  if (Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5001/grov-staging/asia-south1`;
    }
  }

  return DEFAULT_FUNCTIONS_BASE_URL;
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
    await AsyncStorage.setItem('custom_backend_url', cleanUrl);
    apiClient.defaults.baseURL = cleanUrl;
  } catch (e) {
    console.warn('Failed to save custom backend URL', e);
  }
};

export let API_BASE_URL = DEFAULT_API_BASE_URL;

export const resolveImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  // Firebase Storage / Cloud Storage direct download URLs
  if (
    url.startsWith('https://firebasestorage.googleapis.com') ||
    url.startsWith('https://storage.googleapis.com') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }
  const currentBase = apiClient.defaults.baseURL || API_BASE_URL;
  const backendBase = currentBase.replace(/\/api\/v1\/?$/, '');
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
  timeout: 15000,
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
      let msg = data.message || data.error || 'Something went wrong';
      if (data.errors) {
        const firstError = Object.values(data.errors as Record<string, string[]>)
          .flat()
          .shift();
        if (firstError) msg = firstError;
      }
      return Promise.reject(new Error(msg));
    }

    // Handle Network Error
    if (!error.response && (error.message === 'Network Error' || error.code === 'ECONNABORTED')) {
      const currentUrl = apiClient.defaults.baseURL || DEFAULT_API_BASE_URL;
      return Promise.reject(
        new Error(
          `Cannot connect to Grōv Cloud backend at ${currentUrl}.\n\nEnsure your device has an active internet connection.`
        )
      );
    }

    return Promise.reject(error);
  }
);
