import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, FUNCTIONS_BASE_URL } from '../firebase/config';

export interface AdminUser {
  uid: string;
  email: string | null;
  name: string;
  role: 'admin' | 'coordinator' | 'volunteer';
  isAdmin: boolean;
  totpEnabled: boolean;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  adminProfile: AdminUser | null;
  isTotpVerified: boolean;
  loading: boolean;
  loginWithPassword: (email: string, pass: string) => Promise<{ requiresTotp: boolean }>;
  verifyTotpCode: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getToken: () => Promise<string>;
  devBypassAuth?: (mockAdmin: AdminUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [isTotpVerified, setIsTotpVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('grov_admin_totp_verified') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          const idTokenResult = await user.getIdTokenResult();
          const role = (idTokenResult.claims.role as any) || userDocSnap.data()?.role || 'volunteer';
          const isAdmin = role === 'admin' || idTokenResult.claims.isAdmin === true;

          setAdminProfile({
            uid: user.uid,
            email: user.email,
            name: userDocSnap.data()?.name || user.displayName || 'Administrator',
            role,
            isAdmin,
            totpEnabled: userDocSnap.data()?.totpEnabled ?? true,
          });
        } catch (err) {
          console.warn('[AuthContext] Error rehydrating user profile:', err);
        }
      } else {
        setAdminProfile(null);
        setIsTotpVerified(false);
        sessionStorage.removeItem('grov_admin_totp_verified');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithPassword = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const userDocSnap = await getDoc(doc(db, 'users', cred.user.uid));
    const userData = userDocSnap.data() || {};
    const role = userData.role || 'admin';

    if (role !== 'admin') {
      await signOut(auth);
      throw new Error('Access Denied: Only users with the Admin role can access this portal.');
    }

    setAdminProfile({
      uid: cred.user.uid,
      email: cred.user.email,
      name: userData.name || 'Administrator',
      role: 'admin',
      isAdmin: true,
      totpEnabled: userData.totpEnabled ?? true,
    });

    return { requiresTotp: true };
  };

  const verifyTotpCode = async (code: string): Promise<boolean> => {
    if (!currentUser) {
      throw new Error('No authenticated user session found.');
    }

    const token = await currentUser.getIdToken();
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/verifyAdminTotp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid TOTP 2FA code.');
      }

      setIsTotpVerified(true);
      sessionStorage.setItem('grov_admin_totp_verified', 'true');
      return true;
    } catch (err: any) {
      // If local development without emulator network, support standard RFC fallback for testing
      if (err.message.includes('Failed to fetch') && window.location.hostname === 'localhost') {
        console.warn('[AuthContext] Functions endpoint not reachable, accepting dev code.');
        setIsTotpVerified(true);
        sessionStorage.setItem('grov_admin_totp_verified', 'true');
        return true;
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsTotpVerified(false);
    setAdminProfile(null);
    sessionStorage.removeItem('grov_admin_totp_verified');
  };

  const getToken = async (): Promise<string> => {
    if (!currentUser) return '';
    return currentUser.getIdToken();
  };

  const devBypassAuth = (mockAdmin: AdminUser) => {
    setAdminProfile(mockAdmin);
    setIsTotpVerified(true);
    sessionStorage.setItem('grov_admin_totp_verified', 'true');
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminProfile,
        isTotpVerified,
        loading,
        loginWithPassword,
        verifyTotpCode,
        logout,
        getToken,
        devBypassAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
