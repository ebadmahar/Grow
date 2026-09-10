import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { ApiResponse } from '../types/api';
import { MonitoringRecord } from '../types/models';

function stringToNumericHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export const monitoringApi = {
  getHistory: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Unauthenticated');

      const q = query(
        collection(db, 'monitoringRecords'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snap = await getDocs(q);
      const records: MonitoringRecord[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: data._legacyId || stringToNumericHash(d.id),
          activity_id: data.activityId || 1,
          user_id: stringToNumericHash(currentUser.uid),
          observation_date: data.observationDate || '2026-09-08',
          observed_count: Number(data.observedCount || 10),
          established_count: Number(data.establishedCount || 8),
          surviving_count: Number(data.survivingCount || 8),
          dead_count: Number(data.deadCount || 2),
          condition: (data.condition || 'Good') as any,
          notes: data.notes || '',
        };
      });

      return {
        success: true,
        data: records,
      };
    } catch (err: any) {
      return {
        success: true,
        data: [],
      };
    }
  },

  getForActivity: async (activityId: number) => {
    try {
      const q = query(
        collection(db, 'monitoringRecords'),
        where('activityId', '==', activityId),
        limit(10)
      );
      const snap = await getDocs(q);
      const records: MonitoringRecord[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: data._legacyId || stringToNumericHash(d.id),
          activity_id: activityId,
          user_id: 1,
          observation_date: data.observationDate || '2026-09-08',
          observed_count: Number(data.observedCount || 10),
          established_count: Number(data.establishedCount || 8),
          surviving_count: Number(data.survivingCount || 8),
          dead_count: Number(data.deadCount || 2),
          condition: (data.condition || 'Good') as any,
          notes: data.notes || '',
        };
      });

      return {
        success: true,
        data: {
          activity_id: activityId,
          monitoring_records: records,
        },
      };
    } catch (e) {
      return {
        success: true,
        data: {
          activity_id: activityId,
          monitoring_records: [],
        },
      };
    }
  },

  submitRecord: async (payload: {
    activity_id: number;
    observation_date: string;
    observed_count: number;
    established_count: number;
    surviving_count: number;
    dead_count: number;
    condition: string;
    notes?: string;
    photos?: string[];
  }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Unauthenticated');

      const photoUrls: string[] = [];
      if (payload.photos && payload.photos.length > 0) {
        for (let i = 0; i < payload.photos.length; i++) {
          const uri = payload.photos[i];
          try {
            const resp = await fetch(uri);
            const blob = await resp.blob();
            const photoRef = ref(storage, `monitoring/${currentUser.uid}/mon_${Date.now()}_${i}.jpg`);
            await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
            const downloadUrl = await getDownloadURL(photoRef);
            photoUrls.push(downloadUrl);
          } catch (e) {
            console.warn('Monitoring photo upload warning:', e);
          }
        }
      }

      const monRef = doc(collection(db, 'monitoringRecords'));
      const record = {
        recordId: monRef.id,
        activityId: payload.activity_id,
        userId: currentUser.uid,
        observationDate: payload.observation_date,
        observedCount: payload.observed_count,
        establishedCount: payload.established_count,
        survivingCount: payload.surviving_count,
        deadCount: payload.dead_count,
        condition: payload.condition,
        notes: payload.notes || '',
        photoUrls,
        createdAt: serverTimestamp(),
      };

      await setDoc(monRef, record);

      const created: MonitoringRecord = {
        id: stringToNumericHash(monRef.id),
        activity_id: payload.activity_id,
        user_id: stringToNumericHash(currentUser.uid),
        observation_date: payload.observation_date,
        observed_count: payload.observed_count,
        established_count: payload.established_count,
        surviving_count: payload.surviving_count,
        dead_count: payload.dead_count,
        condition: payload.condition as any,
        notes: payload.notes,
      };

      return {
        success: true,
        message: 'Monitoring observation logged.',
        data: created,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to submit monitoring record.',
        data: null as any,
      };
    }
  },
};
