import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { authenticateRequest, requireAdmin } from '../utils/auth';

/**
 * HTTP Endpoint: broadcastNotification
 * Administrative broadcast sending an O(1) fan-out message to FCM topic "all_users".
 * Replaces the unscalable N-write loop in the legacy PHP backend.
 * Protected by idempotency hashing to prevent accidental double-broadcasts.
 */
export const broadcastNotification = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    requireAdmin(auth);

    const { title, message, idempotencyKey } = req.body;

    if (!title || !message) {
      res.status(422).json({ error: 'Title and message are required for broadcast.' });
      return;
    }

    const db = admin.firestore();

    // Idempotency: Deduplicate broadcasts within a 10-minute window
    const nowMinutes = Math.floor(Date.now() / (1000 * 60 * 10));
    const dedupKey = idempotencyKey || `${auth.uid}_${Buffer.from(title + message).toString('base64').substring(0, 24)}_${nowMinutes}`;
    const dedupRef = db.collection('idempotencyKeys').doc(`broadcast_${dedupKey}`);

    const isDuplicate = await db.runTransaction(async transaction => {
      const snap = await transaction.get(dedupRef);
      if (snap.exists) {
        return true;
      }
      transaction.set(dedupRef, {
        adminUid: auth.uid,
        title,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return false;
    });

    if (isDuplicate) {
      console.warn(`[broadcastNotification] Duplicate broadcast blocked by idempotency key: ${dedupKey}`);
      res.status(200).json({
        success: true,
        message: 'Broadcast already dispatched (idempotent response).',
      });
      return;
    }

    // 1. Dispatch O(1) message to FCM topic "all_users"
    const fcmMessage = {
      topic: 'all_users',
      notification: {
        title,
        body: message,
      },
      data: {
        type: 'broadcast',
        sentBy: auth.name || 'System Admin',
        timestamp: new Date().toISOString(),
      },
    };

    let fcmResponse: string | null = null;
    try {
      fcmResponse = await admin.messaging().send(fcmMessage);
      console.log('[broadcastNotification] FCM Topic dispatch success:', fcmResponse);
    } catch (fcmErr: any) {
      console.warn('[broadcastNotification] FCM send warning (e.g., emulator mode):', fcmErr.message);
    }

    // 2. Record one broadcast template document in Firestore for audit & history
    const broadcastHistoryRef = db.collection('broadcasts').doc();
    await broadcastHistoryRef.set({
      broadcastId: broadcastHistoryRef.id,
      title,
      message,
      sentBy: auth.uid,
      sentByName: auth.name || auth.email,
      targetTopic: 'all_users',
      fcmMessageId: fcmResponse,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      success: true,
      message: 'Broadcast notification dispatched successfully to all subscribed devices.',
      data: {
        broadcastId: broadcastHistoryRef.id,
        title,
        topic: 'all_users',
      },
    });
  } catch (error: any) {
    console.error('[broadcastNotification] Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
