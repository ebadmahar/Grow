import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ApiResponse } from '../types/api';
import { Species } from '../types/models';

function stringToNumericHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function mapFirestoreSpecies(docId: string, data: any): Species {
  const numericId = data._legacyId || stringToNumericHash(docId);
  const category = (data.category && ['conifer', 'deciduous', 'mangrove', 'shrub', 'mixed'].includes(data.category)
    ? data.category
    : 'conifer') as Species['category'];

  return {
    id: numericId,
    common_name: data.commonName || 'Native Tree',
    scientific_name: data.scientificName || 'Pinus roxburghii',
    local_name: data.localName || data.commonName || 'Tree',
    suitable_zones: data.suitableZones || 'Islamabad, Margalla Hills',
    basic_description: data.basicDescription || data.description || 'Indigenous restoration tree for Islamabad.',
    basic_guidance: data.basicGuidance || 'Plant during monsoon or spring seasons with adequate protection.',
    category,
    is_native: data.isNative !== false,
    is_active: data.isActive !== false,
    cover_image_path: data.coverImageUrl || data.cover_image_path || undefined,
  };
}

export const speciesApi = {
  getSpeciesList: async (_params?: { category?: string; is_native?: boolean; search?: string }) => {
    try {
      const snap = await getDocs(collection(db, 'species'));
      const list: Species[] = snap.docs.map(d => mapFirestoreSpecies(d.id, d.data()));

      if (list.length > 0) {
        return {
          success: true,
          data: list,
        };
      }

      throw new Error('No species found in Firestore');
    } catch (e) {
      const fallbackSpecies: Species[] = [
        {
          id: 1,
          common_name: 'Chir Pine',
          scientific_name: 'Pinus roxburghii',
          local_name: 'Cheer',
          suitable_zones: 'Margalla Ridge, Zone 3',
          basic_description: 'Native evergreen conifer vital for slope stabilization and bird nesting.',
          category: 'conifer',
          is_native: true,
          is_active: true,
        },
        {
          id: 2,
          common_name: 'Wild Olive',
          scientific_name: 'Olea ferruginea',
          local_name: 'Kahu / Zaitoon',
          suitable_zones: 'Islamabad Foothills',
          basic_description: 'Extremely drought tolerant native broadleaf with high carbon absorption.',
          category: 'deciduous',
          is_native: true,
          is_active: true,
        },
      ];
      return {
        success: true,
        data: fallbackSpecies,
      };
    }
  },

  getSpeciesDetails: async (id: number) => {
    try {
      const q = query(collection(db, 'species'), where('_legacyId', '==', id), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        return {
          success: true,
          data: mapFirestoreSpecies(snap.docs[0].id, snap.docs[0].data()),
        };
      }

      const docSnap = await getDoc(doc(db, 'species', String(id)));
      if (docSnap.exists()) {
        return {
          success: true,
          data: mapFirestoreSpecies(docSnap.id, docSnap.data()),
        };
      }

      throw new Error('Species not found');
    } catch (err: any) {
      return {
        success: false,
        message: err.message,
        data: null as any,
      };
    }
  },
};
