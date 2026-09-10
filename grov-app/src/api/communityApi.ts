import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { CommunityTask } from '../types/models';

function stringToNumericHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function mapFirestoreTask(docId: string, data: any): CommunityTask {
  const numericId = data._legacyId || stringToNumericHash(docId);
  const taskDate = data.date?.toDate ? data.date.toDate().toISOString().split('T')[0] : (data.date || '2026-09-20');

  return {
    id: numericId,
    creator_id: typeof data.creatorId === 'number' ? data.creatorId : stringToNumericHash(data.creatorId || 'admin'),
    location_id: 1,
    title: data.title || 'Community Restoration Drive',
    activity_type: data.activityType || 'plantation',
    date: taskDate,
    start_time: data.startTime || '08:00 AM',
    max_volunteers: data.maxVolunteers || undefined,
    description: data.description || '',
    cover_image_path: data.coverImageUrl || undefined,
    status: data.status || 'open',
    participants_count: Number(data.currentParticipantCount || 1),
    creator: {
      id: 1,
      name: data.creatorName || 'Lead Coordinator',
      email: '',
      role: 'coordinator',
    },
    location: {
      id: 1,
      name: data.siteName || 'Islamabad Drive Site',
      latitude: Number(data.latitude || 33.7485),
      longitude: Number(data.longitude || 73.0645),
      region: data.region || 'Islamabad, Pakistan',
    },
  };
}

export const communityApi = {
  getTasks: async () => {
    try {
      const tasksRef = collection(db, 'communityTasks');
      const q = query(tasksRef, where('status', '==', 'open'), limit(20));
      const snap = await getDocs(q);

      const tasks: CommunityTask[] = snap.docs.map(docSnap =>
        mapFirestoreTask(docSnap.id, docSnap.data())
      );

      return {
        success: true,
        data: tasks,
      };
    } catch (err: any) {
      return {
        success: true,
        data: [
          {
            id: 1,
            creator_id: 1,
            location_id: 1,
            title: 'Margalla Ridge Trail 3 Reforestation',
            activity_type: 'plantation',
            date: '2026-09-20',
            start_time: '08:00 AM',
            max_volunteers: 50,
            participants_count: 34,
            description: 'Mass plantation of native Chir Pine and Olive saplings.',
            status: 'open',
            location: {
              id: 1,
              name: 'Margalla Hills Trail 3 Top',
              latitude: 33.7485,
              longitude: 73.0645,
            },
          },
        ],
      };
    }
  },

  getTaskDetails: async (id: number) => {
    try {
      const q = query(collection(db, 'communityTasks'), where('_legacyId', '==', id), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        return {
          success: true,
          data: mapFirestoreTask(snap.docs[0].id, snap.docs[0].data()),
        };
      }

      const docSnap = await getDoc(doc(db, 'communityTasks', String(id)));
      if (docSnap.exists()) {
        return {
          success: true,
          data: mapFirestoreTask(docSnap.id, docSnap.data()),
        };
      }

      throw new Error('Task not found');
    } catch (err: any) {
      return {
        success: false,
        message: err.message,
        data: null as any,
      };
    }
  },

  createTask: async (payload: {
    title: string;
    activity_type: string;
    site_name: string;
    latitude: number;
    longitude: number;
    date: string;
    start_time: string;
    max_volunteers?: number;
    description: string;
    cover_image?: string;
  }) => {
    const body = {
      title: payload.title,
      activityType: payload.activity_type,
      siteName: payload.site_name,
      latitude: payload.latitude,
      longitude: payload.longitude,
      date: payload.date,
      startTime: payload.start_time,
      maxVolunteers: payload.max_volunteers,
      description: payload.description,
      coverImageUrl: payload.cover_image,
    };

    const response = await apiClient.post<ApiResponse<CommunityTask>>('/createCommunityTask', body);
    return response.data;
  },

  joinTask: async (id: number) => {
    const response = await apiClient.post<ApiResponse<{ task_id: number; status: string; current_participants: number }>>(
      '/joinCommunityTask',
      { taskId: String(id) }
    );
    return response.data;
  },

  leaveTask: async (id: number) => {
    const response = await apiClient.post<ApiResponse<{ task_id: number; status: string }>>(
      '/leaveCommunityTask',
      { taskId: String(id) }
    );
    return response.data;
  },

  updateTask: async (id: number, payload: any) => {
    const response = await apiClient.put<ApiResponse<CommunityTask>>(`/community/tasks/${id}`, payload);
    return response.data;
  },

  deleteTask: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/community/tasks/${id}`);
    return response.data;
  },
};
