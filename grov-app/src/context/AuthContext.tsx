import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { User } from '../types/models';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { clearStoredToken, getStoredToken, setStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string, totpCode?: string) => Promise<any>;
  register: (name: string, email: string, pass: string, location?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          await setStoredToken(idToken);
          setToken(idToken);

          const res = await userApi.getProfile();
          if (res.success && res.data?.user) {
            const userWithAvatar = await processUserWithCache(res.data.user);
            setUser(userWithAvatar);
          }
        } catch (e) {
          console.log('[AuthContext] Error rehydrating Firebase session', e);
        }
      } else {
        // If no active Firebase user, check AsyncStorage token fallback
        const storedToken = await getStoredToken();
        if (!storedToken) {
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const processUserWithCache = async (u: User | null): Promise<User | null> => {
    if (!u) return null;
    const cacheKey = `cached_avatar_${u.id}`;
    if (u.avatar_path) {
      try {
        await AsyncStorage.setItem(cacheKey, u.avatar_path);
      } catch (e) {
        console.warn('Failed to cache avatar', e);
      }
      return u;
    } else {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return { ...u, avatar_path: cached };
        }
      } catch (e) {
        console.warn('Failed to get cached avatar', e);
      }
      return u;
    }
  };

  const login = async (email: string, pass: string, totpCode?: string) => {
    const res = await authApi.login({ email, password: pass, totp_code: totpCode });
    if (res.success && res.data) {
      if ((res.data as any).requires_2fa) {
        return res.data;
      }
      await setStoredToken(res.data.token);
      setToken(res.data.token);
      const userWithAvatar = await processUserWithCache(res.data.user);
      setUser(userWithAvatar);
      return res.data;
    } else {
      throw new Error(res.message || 'Invalid password or email');
    }
  };

  const register = async (name: string, email: string, pass: string, location?: string) => {
    const res = await authApi.register({ name, email, password: pass, location });
    if (res.success && res.data) {
      await setStoredToken(res.data.token);
      setToken(res.data.token);
      const userWithAvatar = await processUserWithCache(res.data.user);
      setUser(userWithAvatar);
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.log('Logout API call exception', e);
    } finally {
      await clearStoredToken();
      setToken(null);
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await userApi.getProfile();
      if (res.success && res.data?.user) {
        const userWithAvatar = await processUserWithCache(res.data.user);
        setUser(userWithAvatar);
      }
    } catch (e) {
      console.log('Error refreshing profile', e);
    }
  };

  const updateUser = async (updatedUser: User) => {
    const userWithAvatar = await processUserWithCache(updatedUser);
    setUser(userWithAvatar);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
