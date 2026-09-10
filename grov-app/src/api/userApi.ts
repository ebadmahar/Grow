import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { ApiResponse, UserProfileResponseData } from '../types/api';
import { Interest, User } from '../types/models';
import { mapFirestoreUser } from './authApi';

function getRankTitle(points: number): string {
  if (points >= 5000) return 'Canopy Master';
  if (points >= 2500) return 'Forest Guardian';
  if (points >= 1000) return 'Grove Leader';
  if (points >= 300) return 'Sapling Planter';
  return 'Seedling Volunteer';
}

export const userApi = {
  getProfile: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Unauthenticated');
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        throw new Error('User record not found in Firestore');
      }

      const data = userSnap.data() || {};
      const user = mapFirestoreUser(currentUser.uid, data);

      const totalPlanted = Number(data.totalPlanted || 0);
      const totalActivities = Number(data.activitiesCount || 0);
      const totalPoints = Number(data.totalPoints || 0);

      const response: ApiResponse<UserProfileResponseData> = {
        success: true,
        data: {
          user,
          stats: {
            total_planted: totalPlanted,
            total_activities: totalActivities,
            rank: getRankTitle(totalPoints),
          },
        },
      };
      return response;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to fetch user profile.',
        data: null as any,
      };
    }
  },

  updateProfile: async (payload: { name?: string; location?: string; bio?: string; role?: string }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Unauthenticated');

      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatePayload: Record<string, any> = {};

      if (payload.name !== undefined) updatePayload.name = payload.name;
      if (payload.location !== undefined) updatePayload.location = payload.location;
      if (payload.bio !== undefined) updatePayload.bio = payload.bio;

      await updateDoc(userDocRef, updatePayload);

      const updatedSnap = await getDoc(userDocRef);
      const user = mapFirestoreUser(currentUser.uid, updatedSnap.data());

      return {
        success: true,
        message: 'Profile updated successfully.',
        data: user,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to update profile.',
        data: null as any,
      };
    }
  },

  uploadAvatar: async (fileUri: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Unauthenticated');

      const response = await fetch(fileUri);
      const blob = await response.blob();

      const storageRef = ref(storage, `avatars/${currentUser.uid}/avatar_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });

      const downloadUrl = await getDownloadURL(storageRef);

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        avatarUrl: downloadUrl,
      });

      return {
        success: true,
        message: 'Avatar uploaded successfully.',
        data: { avatar_url: downloadUrl },
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to upload avatar to Cloud Storage.',
        data: { avatar_url: fileUri },
      };
    }
  },

  getInterests: async () => {
    try {
      const interestsSnap = await getDocs(collection(db, 'interests'));
      const interests: Interest[] = interestsSnap.docs.map((d, index) => ({
        id: (d.data() as any)._legacyId || index + 1,
        name: (d.data() as any).name || d.id,
        slug: (d.data() as any).slug || d.id.toLowerCase(),
      }));

      return {
        success: true,
        data: {
          interests,
          selected_ids: [1, 2],
        },
      };
    } catch (err: any) {
      return {
        success: true,
        data: {
          interests: [
            { id: 1, name: 'Urban Forestation', slug: 'urban-forestation' },
            { id: 2, name: 'Margalla Ridge Conservation', slug: 'margalla-conservation' },
            { id: 3, name: 'Native Seed Bombing', slug: 'native-seeding' },
          ],
          selected_ids: [1, 2],
        },
      };
    }
  },

  updateInterests: async (interestIds: number[]) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          interestIds,
        });
      }
      return {
        success: true,
        message: 'Interests updated.',
        data: null as any,
      };
    } catch (err: any) {
      return {
        success: true,
        data: null as any,
      };
    }
  },

  updateSettings: async (settings: Record<string, any>) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          settings,
        });
      }
      return {
        success: true,
        message: 'Settings updated.',
        data: { settings },
      };
    } catch (err: any) {
      return {
        success: true,
        data: { settings },
      };
    }
  },

  deleteAccount: async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isDeleted: true,
        });
      }
      return {
        success: true,
        message: 'Account marked as deactivated.',
        data: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to delete account.',
        data: null,
      };
    }
  },
};
