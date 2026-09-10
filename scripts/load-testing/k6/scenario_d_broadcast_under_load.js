import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { CONFIG, THRESHOLDS, STAGED_STAGES } from './shared/config.js';

const functionErrors = new Rate('cloud_function_errors');
const broadcastDelivered = new Counter('broadcast_delivered_count');

export const options = {
  stages: STAGED_STAGES,
  thresholds: {
    ...THRESHOLDS,
    cloud_function_errors: ['rate<0.0005'],
  },
};

export default function () {
  // Only designated Admin VUs (e.g. VU 1) trigger broadcasts periodically
  if (__VU === 1 && __ITER % 10 === 0) {
    const broadcastPayload = JSON.stringify({
      data: {
        title: `🚨 Urgent: Air Quality Alert (Islamabad)`,
        body: `Margalla Hills AQI has exceeded 150. Wear a mask during plantation activities.`,
        topic: 'all_users',
        type: 'aqi_alert',
        adminUid: 'admin_master_001',
      },
    });

    const headers = {
      ...CONFIG.DEFAULT_HEADERS,
      'Authorization': 'Bearer mock-admin-jwt-token',
    };

    const res = http.post(
      `${CONFIG.FUNCTIONS_HOST}/broadcastNotification`,
      broadcastPayload,
      {
        headers: headers,
        tags: { type: 'cloud_function', endpoint: 'broadcastNotification' },
      }
    );

    const success = check(res, {
      'broadcast status is 200': (r) => r.status === 200,
      'broadcast returns messageId or status': (r) => {
        try {
          const b = r.json();
          return b && b.result && (b.result.messageId || b.result.status === 'sent');
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      functionErrors.add(1);
    } else {
      functionErrors.add(0);
      broadcastDelivered.add(1);
    }
  } else {
    // Normal connected user receives notifications / checks unread notifications
    const userRes = http.get(
      `${CONFIG.FIRESTORE_REST_BASE}/notifications?pageSize=5`,
      {
        headers: CONFIG.DEFAULT_HEADERS,
        tags: { type: 'firestore_read', endpoint: 'getUserNotifications' },
      }
    );

    check(userRes, {
      'notifications fetch is 200': (r) => r.status === 200 || r.status === 404,
    });
  }

  sleep(Math.random() * 3 + 2);
}
