import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

// Enforce target deployment region (asia-south1: Mumbai, closest to Islamabad)
setGlobalOptions({ region: 'asia-south1', maxInstances: 100 });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Health check endpoint: /ping
 * Validates Cloud Functions runtime, region, and responsiveness.
 */
export const ping = onRequest((req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Grōv',
    service: 'Cloud Functions Backend',
    region: 'asia-south1',
    timestamp: new Date().toISOString(),
  });
});
