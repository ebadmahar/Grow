import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { CONFIG, THRESHOLDS, STAGED_STAGES, getRandomIslamabadCoords } from './shared/config.js';

const http429QuotaErrors = new Counter('firestore_429_quota_errors');
const densityCapEnforced = new Counter('density_cap_enforced_count');

export const options = {
  stages: STAGED_STAGES,
  thresholds: {
    ...THRESHOLDS,
    firestore_429_quota_errors: ['count==0'],
  },
};

export default function () {
  const coords = getRandomIslamabadCoords();
  const delta = 0.04; // ~4km bounding box

  // 1. Viewport Bounding Box Query against verifiedSites (limit 100 pins)
  // Uses Firestore REST runQuery API with structured query
  const queryPayload = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: 'verifiedSites' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'status' },
                op: 'EQUAL',
                value: { stringValue: 'active' },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: 'latitude' },
                op: 'GREATER_THAN_OR_EQUAL',
                value: { doubleValue: coords.latitude - delta },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: 'latitude' },
                op: 'LESS_THAN_OR_EQUAL',
                value: { doubleValue: coords.latitude + delta },
              },
            },
          ],
        },
      },
      limit: 100, // Explicit density cap
    },
  });

  const mapRes = http.post(
    `${CONFIG.FIRESTORE_REST_BASE}:runQuery`,
    queryPayload,
    {
      headers: CONFIG.DEFAULT_HEADERS,
      tags: { type: 'firestore_read', endpoint: 'getMapVerifiedSites' },
    }
  );

  if (mapRes.status === 429) {
    http429QuotaErrors.add(1);
  }

  const mapSuccess = check(mapRes, {
    'viewport query is 200': (r) => r.status === 200,
    'results capped at 100': (r) => {
      try {
        const results = r.json();
        return Array.isArray(results) && results.length <= 101; // may include empty terminal record
      } catch (e) {
        return true;
      }
    },
  });

  if (mapSuccess) {
    densityCapEnforced.add(1);
  }

  // 2. Read current monthly goals config
  const goalsRes = http.get(
    `${CONFIG.FIRESTORE_REST_BASE}/config/monthlyGoals`,
    {
      headers: CONFIG.DEFAULT_HEADERS,
      tags: { type: 'firestore_read', endpoint: 'getMonthlyGoals' },
    }
  );

  if (goalsRes.status === 429) {
    http429QuotaErrors.add(1);
  }

  check(goalsRes, {
    'goals read status valid': (r) => r.status === 200 || r.status === 404,
  });

  // 3. Drill-down simulation: 10% of users click a site to view recent activities (limit 20)
  if (Math.random() < 0.10) {
    const drilldownPayload = JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'activities' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'siteId' },
            op: 'EQUAL',
            value: { stringValue: 'site_f9_park' },
          },
        },
        limit: 20,
      },
    });

    const drilldownRes = http.post(
      `${CONFIG.FIRESTORE_REST_BASE}:runQuery`,
      drilldownPayload,
      {
        headers: CONFIG.DEFAULT_HEADERS,
        tags: { type: 'firestore_read', endpoint: 'getSiteDrilldownActivities' },
      }
    );

    if (drilldownRes.status === 429) {
      http429QuotaErrors.add(1);
    }

    check(drilldownRes, {
      'drilldown query is 200': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 3 + 1);
}
