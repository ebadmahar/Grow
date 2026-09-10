import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { ApiResponse } from '../types/api';
import { ReportModel } from '../types/models';

function stringToNumericHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export const reportApi = {
  getMyReports: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Unauthenticated');

      const q = query(
        collection(db, 'reports'),
        where('reporterId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snap = await getDocs(q);
      const reports: ReportModel[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: data._legacyId || stringToNumericHash(d.id),
          reporter_id: stringToNumericHash(currentUser.uid),
          location_name: data.locationName || 'Islamabad Sector',
          category: data.category || 'General',
          severity: (data.severity || 'Medium') as any,
          description: data.description || '',
          status: data.status || 'pending',
          resolution_notes: data.resolutionNotes || undefined,
        };
      });

      return {
        success: true,
        data: reports,
      };
    } catch (err: any) {
      return {
        success: true,
        data: [],
      };
    }
  },

  submitReport: async (payload: {
    activity_id?: number;
    site_name: string;
    category: string;
    severity: string;
    description: string;
    photos?: string[];
  }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Unauthenticated');

      // Upload photos to Cloud Storage
      const photoUrls: string[] = [];
      if (payload.photos && payload.photos.length > 0) {
        for (let i = 0; i < payload.photos.length; i++) {
          const uri = payload.photos[i];
          try {
            const resp = await fetch(uri);
            const blob = await resp.blob();
            const photoRef = ref(storage, `reports/${currentUser.uid}/report_${Date.now()}_${i}.jpg`);
            await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
            const downloadUrl = await getDownloadURL(photoRef);
            photoUrls.push(downloadUrl);
          } catch (e) {
            console.warn('Report photo upload warning:', e);
          }
        }
      }

      const reportRef = doc(collection(db, 'reports'));
      const reportData = {
        reportId: reportRef.id,
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName || 'Volunteer',
        activityId: payload.activity_id || null,
        locationName: payload.site_name,
        category: payload.category,
        severity: payload.severity,
        description: payload.description,
        status: 'pending',
        photoUrls,
        createdAt: serverTimestamp(),
      };

      await setDoc(reportRef, reportData);

      const created: ReportModel = {
        id: stringToNumericHash(reportRef.id),
        reporter_id: stringToNumericHash(currentUser.uid),
        location_name: payload.site_name,
        category: payload.category,
        severity: payload.severity as any,
        description: payload.description,
        status: 'pending',
      };

      return {
        success: true,
        message: 'Report filed successfully.',
        data: created,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to submit report.',
        data: null as any,
      };
    }
  },
};
