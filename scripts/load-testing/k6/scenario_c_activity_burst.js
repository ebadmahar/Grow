import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { CONFIG, THRESHOLDS, STAGED_STAGES, getRandomIslamabadCoords, getTestUser } from './shared/config.js';

const functionErrors = new Rate('cloud_function_errors');
const storageErrors = new Rate('storage_5xx_errors');
const idempotencyDeduplicated = new Counter('idempotency_deduplicated_count');

export const options = {
  stages: STAGED_STAGES,
  thresholds: {
    ...THRESHOLDS,
    cloud_function_errors: ['rate<0.0005'],
    storage_5xx_errors: ['rate==0'],
  },
};

export default function () {
  const user = getTestUser(__VU);
  const coords = getRandomIslamabadCoords();
  const submissionId = `sub_${user.uid}_${Date.now()}_${__ITER}`;

  // 1. Simulated 5MB photo upload to Cloud Storage
  // Simulates uploading an evidence image to activities/{userId}/...
  const simulatedPhotoSize = 1024 * 512; // 512KB for test suite efficiency, representing compressed image
  const photoPayload = 'X'.repeat(simulatedPhotoSize);
  const storageUrl = `${CONFIG.STORAGE_HOST}/v0/b/${CONFIG.PROJECT_ID}.appspot.com/o?uploadType=media&name=activities%2F${user.uid}%2F${submissionId}.jpg`;

  const storageRes = http.post(storageUrl, photoPayload, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Authorization': `Bearer mock-token-${user.uid}`,
    },
    tags: { type: 'storage_upload', endpoint: 'uploadActivityPhoto' },
  });

  if (storageRes.status >= 500) {
    storageErrors.add(1);
  } else {
    storageErrors.add(0);
  }

  // 2. Submit Plantation / Seeding to Cloud Function logPlantation
  const isPlantation = __ITER % 2 === 0;
  const endpoint = isPlantation ? 'logPlantation' : 'logSeeding';
  const photoUrl = `https://firebasestorage.googleapis.com/v0/b/${CONFIG.PROJECT_ID}.appspot.com/o/activities%2F${user.uid}%2F${submissionId}.jpg?alt=media`;

  const activityPayload = JSON.stringify({
    data: {
      userId: user.uid,
      speciesId: 'chir_pine',
      quantity: isPlantation ? 5 : 25,
      latitude: coords.latitude,
      longitude: coords.longitude,
      siteId: 'site_margalla_hills',
      photoUrl: photoUrl,
      notes: 'Load test submission verification',
      clientSubmissionId: submissionId,
    },
  });

  const headers = {
    ...CONFIG.DEFAULT_HEADERS,
    'Authorization': `Bearer mock-token-${user.uid}`,
  };

  const functionRes = http.post(
    `${CONFIG.FUNCTIONS_HOST}/${endpoint}`,
    activityPayload,
    {
      headers: headers,
      tags: { type: 'cloud_function', endpoint: endpoint },
    }
  );

  const functionSuccess = check(functionRes, {
    'function status is 200': (r) => r.status === 200,
    'result contains activityId or duplicate status': (r) => {
      try {
        const body = r.json();
        return (body && body.result && (body.result.activityId || body.result.status === 'duplicate'));
      } catch (e) {
        return false;
      }
    },
  });

  if (!functionSuccess) {
    functionErrors.add(1);
  } else {
    functionErrors.add(0);
  }

  // 3. Simulate Idempotency Retry: 5% of submissions replay with identical clientSubmissionId
  if (Math.random() < 0.05) {
    const retryRes = http.post(
      `${CONFIG.FUNCTIONS_HOST}/${endpoint}`,
      activityPayload,
      {
        headers: headers,
        tags: { type: 'cloud_function', endpoint: `${endpoint}_retry` },
      }
    );

    check(retryRes, {
      'retry returns 200 without creating duplicate': (r) => r.status === 200,
    });

    idempotencyDeduplicated.add(1);
  }

  sleep(Math.random() * 4 + 2);
}
