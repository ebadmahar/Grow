import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { authenticateRequest } from '../utils/auth';

const ISLAMABAD_BOUNDS = {
  latMin: 33.50,
  latMax: 33.85,
  lonMin: 72.80,
  lonMax: 73.35,
};

function validateCoordinates(latitude: number, longitude: number): void {
  if (
    latitude < ISLAMABAD_BOUNDS.latMin ||
    latitude > ISLAMABAD_BOUNDS.latMax ||
    longitude < ISLAMABAD_BOUNDS.lonMin ||
    longitude > ISLAMABAD_BOUNDS.lonMax
  ) {
    throw new HttpsError(
      'invalid-argument',
      "This location is currently not supported. We're working on it 👀 — only Islamabad is available right now."
    );
  }
}

function encodeGeohash(latitude: number, longitude: number, precision = 6): string {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latMin = -90.0, latMax = 90.0;
  let lonMin = -180.0, lonMax = 180.0;
  let geohash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    let mid;
    if (isEven) {
      mid = (lonMin + lonMax) / 2;
      if (longitude >= mid) {
        ch |= (1 << (4 - bit));
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        ch |= (1 << (4 - bit));
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return geohash;
}

/**
 * HTTP Endpoint: logPlantation
 * Submits a tree plantation activity with Islamabad GPS validation and idempotency protection.
 */
export const logPlantation = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    const {
      speciesId,
      quantityPlanted,
      date,
      siteName,
      latitude,
      longitude,
      plantingMethod,
      fieldNotes,
      clientSubmissionId,
      photos, // Array of { storageUrl, storagePath, mimeType, fileSizeBytes }
    } = req.body;

    // 1. Validate required fields
    if (!speciesId || !quantityPlanted || latitude == null || longitude == null) {
      res.status(422).json({ error: 'Missing required plantation fields.' });
      return;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const quantity = parseInt(quantityPlanted, 10);

    if (isNaN(lat) || isNaN(lon) || isNaN(quantity) || quantity <= 0) {
      res.status(422).json({ error: 'Invalid numeric parameters provided.' });
      return;
    }

    // 2. Validate GPS coordinates within Islamabad bounds
    validateCoordinates(lat, lon);

    const db = admin.firestore();

    // 3. Idempotency Check: if clientSubmissionId was sent and already processed
    if (clientSubmissionId) {
      const existingQuery = await db
        .collection('activities')
        .where('clientSubmissionId', '==', clientSubmissionId)
        .where('userId', '==', auth.uid)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        const existingDoc = existingQuery.docs[0];
        console.log(`[logPlantation] Idempotent return for existing submission: ${existingDoc.id}`);
        res.status(200).json({
          success: true,
          id: existingDoc.id,
          message: 'Activity already submitted (idempotent response).',
          data: { id: existingDoc.id, ...existingDoc.data() },
        });
        return;
      }
    }

    // 4. Fetch user details and species details
    const [userDoc, speciesDoc] = await Promise.all([
      db.collection('users').doc(auth.uid).get(),
      db.collection('species').doc(speciesId).get(),
    ]);

    const userData = userDoc.data() || {};
    const speciesData = speciesDoc.data() || {};

    const activityRef = db.collection('activities').doc();
    const geohash = encodeGeohash(lat, lon);
    const submissionDate = date ? new Date(date) : new Date();

    const activityPayload = {
      activityId: activityRef.id,
      userId: auth.uid,
      userName: userData.name || auth.email,
      userAvatarUrl: userData.avatarUrl || null,
      activityType: 'plantation',
      status: 'reported',
      date: admin.firestore.Timestamp.fromDate(submissionDate),
      fieldNotes: fieldNotes || null,
      pointsAwarded: 0,
      pointsProcessed: false,
      clientSubmissionId: clientSubmissionId || `submission_${activityRef.id}`,
      verifiedBy: null,
      verifiedAt: null,
      siteName: siteName || 'Islamabad Plantation Site',
      siteId: null,
      latitude: lat,
      longitude: lon,
      geohash,
      region: 'Islamabad, Pakistan',
      speciesId,
      speciesName: speciesData.commonName || 'Indigenous Sapling',
      quantityPlanted: quantity,
      plantingMethod: plantingMethod || 'Pit Planting',
      seedsDispersed: null,
      dispersalMethod: null,
      coverageAreaSqm: null,
      photoCount: Array.isArray(photos) ? photos.length : 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    batch.set(activityRef, activityPayload);

    // If photos were uploaded to Storage, attach subcollection documents
    if (Array.isArray(photos) && photos.length > 0) {
      photos.forEach(photo => {
        const photoRef = activityRef.collection('photos').doc();
        batch.set(photoRef, {
          photoId: photoRef.id,
          storageUrl: photo.storageUrl || '',
          storagePath: photo.storagePath || '',
          mimeType: photo.mimeType || 'image/jpeg',
          fileSizeBytes: photo.fileSizeBytes || 0,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    }

    // Increment user's activitiesCount
    batch.update(db.collection('users').doc(auth.uid), {
      activitiesCount: admin.firestore.FieldValue.increment(1),
    });

    await batch.commit();

    res.status(201).json({
      success: true,
      message: 'Plantation activity logged successfully.',
      data: {
        id: activityRef.id,
        ...activityPayload,
      },
    });
  } catch (error: any) {
    console.error('[logPlantation] Error:', error);
    const statusCode = error instanceof HttpsError && error.code === 'invalid-argument' ? 422 : 500;
    res.status(statusCode).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * HTTP Endpoint: logSeeding
 * Submits a seed bombing/dispersal activity with Islamabad GPS validation and idempotency protection.
 */
export const logSeeding = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    const {
      speciesId,
      seedsDispersed,
      date,
      siteName,
      latitude,
      longitude,
      dispersalMethod,
      coverageAreaSqm,
      fieldNotes,
      clientSubmissionId,
      photos,
    } = req.body;

    if (!speciesId || !seedsDispersed || latitude == null || longitude == null) {
      res.status(422).json({ error: 'Missing required seeding fields.' });
      return;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const seeds = parseInt(seedsDispersed, 10);

    if (isNaN(lat) || isNaN(lon) || isNaN(seeds) || seeds <= 0) {
      res.status(422).json({ error: 'Invalid numeric parameters provided.' });
      return;
    }

    validateCoordinates(lat, lon);

    const db = admin.firestore();

    if (clientSubmissionId) {
      const existingQuery = await db
        .collection('activities')
        .where('clientSubmissionId', '==', clientSubmissionId)
        .where('userId', '==', auth.uid)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        const existingDoc = existingQuery.docs[0];
        console.log(`[logSeeding] Idempotent return for existing submission: ${existingDoc.id}`);
        res.status(200).json({
          success: true,
          id: existingDoc.id,
          message: 'Activity already submitted (idempotent response).',
          data: { id: existingDoc.id, ...existingDoc.data() },
        });
        return;
      }
    }

    const [userDoc, speciesDoc] = await Promise.all([
      db.collection('users').doc(auth.uid).get(),
      db.collection('species').doc(speciesId).get(),
    ]);

    const userData = userDoc.data() || {};
    const speciesData = speciesDoc.data() || {};

    const activityRef = db.collection('activities').doc();
    const geohash = encodeGeohash(lat, lon);
    const submissionDate = date ? new Date(date) : new Date();

    const activityPayload = {
      activityId: activityRef.id,
      userId: auth.uid,
      userName: userData.name || auth.email,
      userAvatarUrl: userData.avatarUrl || null,
      activityType: 'seeding',
      status: 'reported',
      date: admin.firestore.Timestamp.fromDate(submissionDate),
      fieldNotes: fieldNotes || null,
      pointsAwarded: 0,
      pointsProcessed: false,
      clientSubmissionId: clientSubmissionId || `submission_${activityRef.id}`,
      verifiedBy: null,
      verifiedAt: null,
      siteName: siteName || 'Islamabad Seeding Zone',
      siteId: null,
      latitude: lat,
      longitude: lon,
      geohash,
      region: 'Islamabad, Pakistan',
      speciesId,
      speciesName: speciesData.commonName || 'Native Seeds',
      quantityPlanted: null,
      plantingMethod: null,
      seedsDispersed: seeds,
      dispersalMethod: dispersalMethod || 'Hand Broadcasting',
      coverageAreaSqm: coverageAreaSqm ? Number(coverageAreaSqm) : null,
      photoCount: Array.isArray(photos) ? photos.length : 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    batch.set(activityRef, activityPayload);

    if (Array.isArray(photos) && photos.length > 0) {
      photos.forEach(photo => {
        const photoRef = activityRef.collection('photos').doc();
        batch.set(photoRef, {
          photoId: photoRef.id,
          storageUrl: photo.storageUrl || '',
          storagePath: photo.storagePath || '',
          mimeType: photo.mimeType || 'image/jpeg',
          fileSizeBytes: photo.fileSizeBytes || 0,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    }

    batch.update(db.collection('users').doc(auth.uid), {
      activitiesCount: admin.firestore.FieldValue.increment(1),
    });

    await batch.commit();

    res.status(201).json({
      success: true,
      message: 'Seeding activity logged successfully.',
      data: {
        id: activityRef.id,
        ...activityPayload,
      },
    });
  } catch (error: any) {
    console.error('[logSeeding] Error:', error);
    const statusCode = error instanceof HttpsError && error.code === 'invalid-argument' ? 422 : 500;
    res.status(statusCode).json({ error: error.message || 'Internal Server Error' });
  }
});
