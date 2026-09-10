/**
 * Grōv 25,000 Concurrent User Load Testing Configuration & Thresholds
 * Target Environment: grov-staging (asia-south1)
 *
 * Implements strict PASS/FAIL thresholds mandated in the implementation plan:
 * 1. Direct Firestore Reads: P50 < 100ms, P95 < 300ms, P99 < 600ms
 * 2. Cloud Functions HTTPS: P50 < 350ms, P95 < 1500ms, P99 < 3000ms
 * 3. Firebase Auth Operations: P50 < 400ms, P95 < 800ms, P99 < 1500ms
 * 4. Storage Uploads (5MB): P95 < 3500ms, P99 < 6000ms, 0% 5xx errors
 * 5. System Error Rate: < 0.10% total error rate
 * 6. Auth Failures (non-user): < 0.05%
 * 7. Cloud Function Errors: < 0.05% error rate, < 0.01% timeout rate
 * 8. Firestore Utilization: Exactly 0 HTTP 429 / ResourceExhausted errors
 */

export const CONFIG = {
  PROJECT_ID: 'grov-staging',
  REGION: 'asia-south1',
  AUTH_EMULATOR_HOST: __ENV.AUTH_EMULATOR_HOST || 'http://127.0.0.1:9099',
  FIRESTORE_EMULATOR_HOST: __ENV.FIRESTORE_EMULATOR_HOST || 'http://127.0.0.1:8080',
  FUNCTIONS_HOST: __ENV.FUNCTIONS_HOST || 'http://127.0.0.1:5001/grov-staging/asia-south1',
  STORAGE_HOST: __ENV.STORAGE_HOST || 'http://127.0.0.1:9199',
  
  // Production / Remote Staging Fallbacks
  STAGING_API_BASE: 'https://asia-south1-grov-staging.cloudfunctions.net',
  FIRESTORE_REST_BASE: 'https://firestore.googleapis.com/v1/projects/grov-staging/databases/(default)/documents',
  AUTH_REST_BASE: 'https://identitytoolkit.googleapis.com/v1',

  // Viewport bounds for Islamabad, Pakistan
  ISLAMABAD_VIEWPORT: {
    minLat: 33.6000,
    maxLat: 33.7800,
    minLng: 72.9000,
    maxLng: 73.2000,
    centerLat: 33.6844,
    centerLng: 73.0479,
  },

  // Test Pools
  TEST_USERS_COUNT: 25000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Standard SLA Threshold definitions for k6 runs
 */
export const THRESHOLDS = {
  // Global error rate must be under 0.10%
  http_req_failed: ['rate<0.001'],
  
  // Direct Firestore reads SLA
  'http_req_duration{type:firestore_read}': [
    'p(50)<100',
    'p(95)<300',
    'p(99)<600',
  ],

  // Cloud Functions HTTPS SLA
  'http_req_duration{type:cloud_function}': [
    'p(50)<350',
    'p(95)<1500',
    'p(99)<3000',
  ],

  // Auth operations SLA
  'http_req_duration{type:auth}': [
    'p(50)<400',
    'p(95)<800',
    'p(99)<1500',
  ],

  // Storage uploads SLA (5MB payload)
  'http_req_duration{type:storage_upload}': [
    'p(95)<3500',
    'p(99)<6000',
  ],

  // Pre-computed Leaderboard queries SLA
  'http_req_duration{type:leaderboard}': [
    'p(50)<100',
    'p(95)<300',
    'p(99)<600',
  ],
};

/**
 * Staged progression stages up to 25,000 VUs
 */
export const STAGED_STAGES = [
  { duration: '30s', target: 25 },     // Smoke
  { duration: '1m',  target: 250 },    // Baseline
  { duration: '2m',  target: 1000 },   // Load 1
  { duration: '3m',  target: 2500 },   // Load 2
  { duration: '3m',  target: 5000 },   // Load 3
  { duration: '3m',  target: 10000 },  // Load 4
  { duration: '5m',  target: 25000 },  // Peak Load (25,000 VUs)
  { duration: '1m',  target: 25000 },  // Sustained Peak
  { duration: '2m',  target: 0 },      // Ramp-down
];

/**
 * Helper to generate random coordinates within Islamabad bounds
 */
export function getRandomIslamabadCoords() {
  const { minLat, maxLat, minLng, maxLng } = CONFIG.ISLAMABAD_VIEWPORT;
  const lat = minLat + Math.random() * (maxLat - minLat);
  const lng = minLng + Math.random() * (maxLng - minLng);
  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
  };
}

/**
 * Helper to format test user credentials
 */
export function getTestUser(vuId) {
  const padded = String((vuId % CONFIG.TEST_USERS_COUNT) + 1).padStart(5, '0');
  return {
    email: `loadtest.user${padded}@grov.pk`,
    password: `GrovTestPass2026!#${padded}`,
    uid: `load_user_${padded}`,
  };
}
