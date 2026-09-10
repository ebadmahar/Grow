import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { authenticateRequest, requireCoordinatorOrAdmin } from '../utils/auth';

/**
 * HTTP Endpoint: verifyActivity
 * Privileged verification of volunteer activities with:
 * - Coordinator self-verification prevention
 * - Atomic Firestore transaction for points allocation
 * - Idempotency protection (prevents duplicate points/notifications)
 * - Automatic update to verifiedSites aggregation
 * - 500-tree milestone evaluation
 * - Multicast FCM notification dispatch to user devices
 */
export const verifyActivity = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'PATCH' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    requireCoordinatorOrAdmin(auth);

    const { activityId, status, rejectionReason } = req.body;

    if (!activityId || !['verified', 'rejected'].includes(status)) {
      res.status(422).json({ error: 'Invalid verification parameters. Must provide activityId and status ("verified" | "rejected").' });
      return;
    }

    const db = admin.firestore();
    const activityRef = db.collection('activities').doc(activityId);

    // Perform atomic verification transaction
    const result = await db.runTransaction(async transaction => {
      const activitySnap = await transaction.get(activityRef);
      if (!activitySnap.exists) {
        throw new Error('ACTIVITY_NOT_FOUND');
      }

      const activity = activitySnap.data()!;

      // 1. Self-verification prevention: Coordinators cannot verify their own submissions
      if (activity.userId === auth.uid && !auth.isAdmin) {
        throw new Error('SELF_VERIFICATION_PROHIBITED');
      }

      // 2. Idempotency: If already verified with points processed, return existing
      if (activity.status === 'verified' && activity.pointsProcessed === true && status === 'verified') {
        return {
          idempotent: true,
          status: 'verified',
          pointsAwarded: activity.pointsAwarded,
          message: 'Activity already verified (idempotent result).',
        };
      }

      const previousStatus = activity.status;
      const userRef = db.collection('users').doc(activity.userId);
      const userSnap = await transaction.get(userRef);
      const userData = userSnap.data() || {};

      let totalPoints = 0;
      let isMilestoneReached = false;

      if (status === 'verified' && previousStatus !== 'verified') {
        const photoCount = activity.photoCount || 0;
        const evidenceBonus = Math.min(photoCount, 5) * 50;

        if (activity.activityType === 'plantation') {
          const qty = Number(activity.quantityPlanted || 0);
          totalPoints = qty * 10 + evidenceBonus;
        } else if (activity.activityType === 'seeding') {
          const seeds = Number(activity.seedsDispersed || 0);
          totalPoints = seeds * 1 + evidenceBonus;
        }

        // Deterministic points document ID prevents duplicate awards on retries
        const pointRef = db.collection('userPoints').doc(`points_${activityId}`);
        transaction.set(pointRef, {
          pointId: `points_${activityId}`,
          userId: activity.userId,
          activityId,
          points: totalPoints,
          reason: `${activity.activityType === 'plantation' ? 'Tree Plantation' : 'Seed Bombing'} Activity Verified`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Check 500-tree milestone
        const prevPlanted = Number(userData.totalPlanted || 0);
        const newPlanted = prevPlanted + Number(activity.quantityPlanted || 0);
        if (prevPlanted < 500 && newPlanted >= 500) {
          isMilestoneReached = true;
        }

        // Update user stats
        transaction.update(userRef, {
          totalPoints: admin.firestore.FieldValue.increment(totalPoints),
          totalPlanted: admin.firestore.FieldValue.increment(Number(activity.quantityPlanted || 0)),
          totalSeeded: admin.firestore.FieldValue.increment(Number(activity.seedsDispersed || 0)),
          monthlyPoints: admin.firestore.FieldValue.increment(totalPoints),
        });

        // Update verifiedSites pre-aggregated counters if siteId exists
        if (activity.siteId) {
          const siteRef = db.collection('verifiedSites').doc(activity.siteId);
          transaction.update(siteRef, {
            activityCount: admin.firestore.FieldValue.increment(1),
            totalTreesPlanted: admin.firestore.FieldValue.increment(Number(activity.quantityPlanted || 0)),
            totalSeedsDispersed: admin.firestore.FieldValue.increment(Number(activity.seedsDispersed || 0)),
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // Update activity status
      transaction.update(activityRef, {
        status,
        pointsAwarded: totalPoints,
        pointsProcessed: status === 'verified',
        verifiedBy: auth.uid,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectionReason: status === 'rejected' ? (rejectionReason || 'Activity rejected during verification') : null,
      });

      return {
        idempotent: false,
        status,
        pointsAwarded: totalPoints,
        userId: activity.userId,
        userName: userData.name || 'Volunteer',
        isMilestoneReached,
        activityType: activity.activityType,
      };
    });

    // Post-transaction notifications (non-blocking)
    if (!result.idempotent && result.status === 'verified') {
      // 1. Create in-app notification doc
      const notificationRef = db.collection('notifications').doc();
      await notificationRef.set({
        notificationId: notificationRef.id,
        userId: result.userId,
        type: 'verification',
        title: 'Activity Verified & Points Awarded',
        message: `Your restoration activity has been verified by ${auth.name || 'Field Lead'}! You earned ${result.pointsAwarded} points.`,
        isRead: false,
        data: { activityId, points: result.pointsAwarded },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Dispatch FCM Push Notification to all active user devices
      try {
        const devicesSnap = await db.collection('users').doc(result.userId).collection('devices').get();
        const tokens = devicesSnap.docs.map(d => d.data().token).filter(Boolean);

        if (tokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
              title: 'Activity Verified! 🌿',
              body: `Your activity was approved by ${auth.name || 'a coordinator'}. +${result.pointsAwarded} points credited!`,
            },
            data: { activityId, type: 'verification' },
          });
        }
      } catch (fcmErr: any) {
        console.warn('[verifyActivity] Non-fatal FCM dispatch failure:', fcmErr.message);
      }

      // 3. Milestone 500 notification to all admins
      if (result.isMilestoneReached) {
        try {
          const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
          const batch = db.batch();
          adminsSnap.docs.forEach(adminDoc => {
            const adminNotifyRef = db.collection('notifications').doc();
            batch.set(adminNotifyRef, {
              notificationId: adminNotifyRef.id,
              userId: adminDoc.id,
              type: 'milestone',
              title: '500-Tree Milestone Reached 🏆',
              message: `Volunteer ${result.userName} has crossed 500 planted trees! Consider promoting them to Coordinator.`,
              isRead: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        } catch (mErr: any) {
          console.warn('[verifyActivity] Milestone notification error:', mErr.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Activity marked as ${status} successfully.`,
      data: result,
    });
  } catch (error: any) {
    console.error('[verifyActivity] Error:', error);
    if (error.message === 'SELF_VERIFICATION_PROHIBITED') {
      res.status(403).json({ error: 'Coordinators cannot self-verify their own activities.' });
      return;
    }
    if (error.message === 'ACTIVITY_NOT_FOUND') {
      res.status(404).json({ error: 'Activity not found.' });
      return;
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
