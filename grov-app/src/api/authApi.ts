import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { ApiResponse, AuthResponseData } from '../types/api';
import { User } from '../types/models';

function stringToNumericHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function mapFirestoreUser(uid: string, data: any): User {
  return {
    id: data._legacyId || stringToNumericHash(uid),
    name: data.name || auth.currentUser?.displayName || 'Volunteer',
    email: data.email || auth.currentUser?.email || '',
    role: data.role || 'volunteer',
    location: data.location || 'Islamabad, Pakistan',
    bio: data.bio || '',
    avatar_path: data.avatarUrl || data.avatar_path || undefined,
    settings_json: data.settings || data.settings_json || {},
    interests: data.interests || [],
  };
}

export const authApi = {
  register: async (payload: { name: string; email: string; password: string; location?: string }) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, payload.email.trim(), payload.password);
      const fbUser = userCred.user;

      await updateProfile(fbUser, { displayName: payload.name.trim() });

      const numericId = stringToNumericHash(fbUser.uid);
      const userDocRef = doc(db, 'users', fbUser.uid);

      const userRecord = {
        userId: fbUser.uid,
        _legacyId: numericId,
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        role: 'volunteer',
        location: payload.location?.trim() || 'Islamabad, Pakistan',
        bio: '',
        totalPlanted: 0,
        totalSeeded: 0,
        totalPoints: 0,
        monthlyPoints: 0,
        activitiesCount: 0,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userRecord, { merge: true });

      const token = await fbUser.getIdToken();
      const user = mapFirestoreUser(fbUser.uid, userRecord);

      const response: ApiResponse<AuthResponseData> = {
        success: true,
        message: 'Account registered successfully.',
        data: { token, user },
      };
      return response;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Registration failed.',
        data: null as any,
      };
    }
  },

  login: async (payload: { email: string; password: string; totp_code?: string }) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, payload.email.trim(), payload.password);
      const fbUser = userCred.user;

      const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
      const userData = userDocSnap.data() || {};

      // If user is an admin, require TOTP check
      if (userData.role === 'admin' && !payload.totp_code) {
        return {
          success: true,
          data: {
            requires_2fa: true,
            email: fbUser.email,
          } as any,
        };
      }

      const token = await fbUser.getIdToken();
      const user = mapFirestoreUser(fbUser.uid, userData);

      const response: ApiResponse<AuthResponseData> = {
        success: true,
        message: 'Login successful.',
        data: { token, user },
      };
      return response;
    } catch (err: any) {
      let friendlyMsg = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMsg = 'Invalid password or email';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMsg = 'Too many failed login attempts. Please try again later.';
      }
      return {
        success: false,
        message: friendlyMsg,
        data: null as any,
      };
    }
  },

  forgotPassword: async (payload: { email: string }) => {
    try {
      await sendPasswordResetEmail(auth, payload.email.trim());
      return {
        success: true,
        message: 'Password reset email sent to ' + payload.email,
        data: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to send password reset email.',
        data: null,
      };
    }
  },

  resetPassword: async (_payload: { token: string; email: string; password: string; password_confirmation: string }) => {
    return {
      success: true,
      message: 'Please use the password reset link sent to your email address.',
      data: null,
    };
  },

  logout: async () => {
    try {
      await signOut(auth);
      return {
        success: true,
        message: 'Logged out successfully.',
        data: null,
      };
    } catch (err: any) {
      return {
        success: true,
        data: null,
      };
    }
  },
};
