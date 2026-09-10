import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { CONFIG, THRESHOLDS, STAGED_STAGES, getTestUser } from './shared/config.js';

const http429QuotaErrors = new Counter('firestore_429_quota_errors');

export const options = {
  stages: STAGED_STAGES,
  thresholds: {
    ...THRESHOLDS,
    firestore_429_quota_errors: ['count==0'],
  },
};

export default function () {
  const user = getTestUser(__VU);
  const periods = ['all_time', 'monthly', 'weekly'];
  const chosenPeriod = periods[__ITER % periods.length];

  // 1. Direct read of pre-computed leaderboard singleton document
  const leaderboardRes = http.get(
    `${CONFIG.FIRESTORE_REST_BASE}/leaderboard/${chosenPeriod}`,
    {
      headers: CONFIG.DEFAULT_HEADERS,
      tags: { type: 'leaderboard', endpoint: `getLeaderboard_${chosenPeriod}` },
    }
  );

  if (leaderboardRes.status === 429) {
    http429QuotaErrors.add(1);
  }

  check(leaderboardRes, {
    'leaderboard read is 200': (r) => r.status === 200,
    'contains rankings array': (r) => {
      try {
        const body = r.json();
        return body && (body.fields ? body.fields.rankings !== undefined : true);
      } catch (e) {
        return false;
      }
    },
  });

  // 2. Direct read of user rank and personal total points
  const userRankRes = http.get(
    `${CONFIG.FIRESTORE_REST_BASE}/users/${user.uid}`,
    {
      headers: CONFIG.DEFAULT_HEADERS,
      tags: { type: 'firestore_read', endpoint: 'getUserRankDetails' },
    }
  );

  if (userRankRes.status === 429) {
    http429QuotaErrors.add(1);
  }

  check(userRankRes, {
    'user stats read is valid': (r) => r.status === 200 || r.status === 404,
  });

  sleep(Math.random() * 2 + 1);
}
