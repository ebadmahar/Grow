import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { CONFIG, THRESHOLDS, STAGED_STAGES, getTestUser } from './shared/config.js';

// Custom metric trackers for explicit 25K PASS/FAIL quality gates
const authErrors = new Rate('auth_non_user_failures');
const http429QuotaErrors = new Counter('firestore_429_quota_errors');

export const options = {
  stages: STAGED_STAGES,
  thresholds: {
    ...THRESHOLDS,
    auth_non_user_failures: ['rate<0.0005'], // < 0.05%
    firestore_429_quota_errors: ['count==0'], // Exactly 0 quota errors
  },
};

export default function () {
  const user = getTestUser(__VU);

  // 1. Firebase Auth Sign-In / Token Verification
  const authPayload = JSON.stringify({
    email: user.email,
    password: user.password,
    returnSecureToken: true,
  });

  const authRes = http.post(
    `${CONFIG.AUTH_REST_BASE}/accounts:signInWithPassword?key=AIzaSyFakeKeyForStaging`,
    authPayload,
    {
      headers: CONFIG.DEFAULT_HEADERS,
      tags: { type: 'auth', endpoint: 'signInWithPassword' },
    }
  );

  const authSuccess = check(authRes, {
    'auth status is 200': (r) => r.status === 200,
    'idToken present': (r) => r.json('idToken') !== undefined,
  });

  if (!authSuccess) {
    // Check if error is a 5xx server failure vs invalid credentials
    if (authRes.status >= 500) {
      authErrors.add(1);
    }
  } else {
    authErrors.add(0);
  }

  const idToken = authRes.json('idToken') || 'mock-id-token-for-testing';
  const authenticatedHeaders = {
    ...CONFIG.DEFAULT_HEADERS,
    Authorization: `Bearer ${idToken}`,
  };

  // 2. Profile Rehydration: Read users/{uid}
  const userDocRes = http.get(
    `${CONFIG.FIRESTORE_REST_BASE}/users/${user.uid}`,
    {
      headers: authenticatedHeaders,
      tags: { type: 'firestore_read', endpoint: 'getUserProfile' },
    }
  );

  if (userDocRes.status === 429) {
    http429QuotaErrors.add(1);
  }

  check(userDocRes, {
    'user profile read is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  // 3. Home Screen Global Stats Read (Pre-computed singleton)
  const statsRes = http.get(
    `${CONFIG.FIRESTORE_REST_BASE}/stats/global`,
    {
      headers: authenticatedHeaders,
      tags: { type: 'firestore_read', endpoint: 'getGlobalStats' },
    }
  );

  if (statsRes.status === 429) {
    http429QuotaErrors.add(1);
  }

  check(statsRes, {
    'global stats read is 200': (r) => r.status === 200,
  });

  // 4. Cached AQI Telemetry Read
  const aqiRes = http.get(
    `${CONFIG.FIRESTORE_REST_BASE}/stats/aqi`,
    {
      headers: authenticatedHeaders,
      tags: { type: 'firestore_read', endpoint: 'getAqiStats' },
    }
  );

  if (aqiRes.status === 429) {
    http429QuotaErrors.add(1);
  }

  check(aqiRes, {
    'aqi stats read is 200': (r) => r.status === 200,
  });

  // 5. Monthly Leaderboard Preview Read
  const leaderboardRes = http.get(
    `${CONFIG.FIRESTORE_REST_BASE}/leaderboard/monthly`,
    {
      headers: authenticatedHeaders,
      tags: { type: 'leaderboard', endpoint: 'getMonthlyLeaderboard' },
    }
  );

  if (leaderboardRes.status === 429) {
    http429QuotaErrors.add(1);
  }

  check(leaderboardRes, {
    'monthly leaderboard read is 200': (r) => r.status === 200,
  });

  // Simulate realistic user dwell time on home dashboard before next action
  sleep(Math.random() * 2 + 1);
}
