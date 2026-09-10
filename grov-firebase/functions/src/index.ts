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
 */
export const ping = onRequest({ cors: true }, (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Grōv',
    service: 'Cloud Functions Backend (Node.js 20)',
    region: 'asia-south1',
    timestamp: new Date().toISOString(),
  });
});

// Activity Logging Endpoints (GPS validation, evidence attachment, idempotency)
export { logPlantation, logSeeding } from './activities/logActivity';

// Activity Verification (Atomic points calculation, milestone check, coordinator self-verify block)
export { verifyActivity } from './activities/verifyActivity';

// Community Tasks & Drives (Atomic capacity lock, volunteer join/leave)
export {
  createCommunityTask,
  joinCommunityTask,
  leaveCommunityTask,
} from './community/communityTasks';

// Administrative Multicast Broadcast (O(1) fan-out to FCM topic "all_users")
export { broadcastNotification } from './notifications/notifications';

// Administrative 2FA & Role Claims (Google Secret Manager TOTP, custom claims)
export {
  setupAdminTotp,
  verifyAdminTotp,
  updateUserRole,
} from './auth/auth2fa';

// Scheduled & Aggregation Jobs (Leaderboard pre-computation, AQI caching, explore stats)
export {
  scheduledFetchAqi,
  scheduledComputeLeaderboard,
  scheduledComputeExploreStats,
  refreshAqiManual,
  refreshLeaderboardManual,
  refreshStatsManual,
} from './scheduled/scheduledJobs';

// Transactional Email Service (Nodemailer + Google Secret Manager credentials)
export { sendTestEmail } from './email/emailService';
