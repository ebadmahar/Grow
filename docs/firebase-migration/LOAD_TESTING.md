# Grōv — Load Testing Strategy (Revised)

## Core Mandate
1. **Design & Prove, Never Assume**: Firebase architecture is NOT assumed to be automatically safe, zero-crash, or immune to concurrency bottlenecks at 25,000+ concurrent users. Scalability must be deliberately architected and rigorously proven across all critical workflows under realistic load.
2. **Strict Testing Phase Protection**: Under no circumstances will the load testing, security verification, migration validation, or regression testing periods be reduced or compressed to satisfy an estimated 27-day timeline. If issues arise, the implementation schedule extends until all test gates pass with 100% compliance.

---

## Tools & Infrastructure
- **k6** (open source HTTP/WebSocket load testing) orchestrated across distributed test runners
- **Google Cloud Monitoring / Cloud Trace**: Cloud Function latency, concurrency, memory, cold starts, error distribution
- **Firebase Console Metrics**: Real-time Firestore operations, connection saturation, rate limit encounters
- **Firebase Performance Monitoring & Crashlytics**: Client-side metric collection

## Test Environment: `grov-staging`
- Load tests execute strictly against the isolated staging project (`grov-staging`), NEVER production.
- Database must be pre-seeded with realistic production-scale volume:
  - 25,000+ user records with active profiles
  - 10,000+ activity records and photos
  - 500+ verified sites across diverse geographic coordinates
  - Pre-computed leaderboard, global stats, and AQI documents

---

## Test Scenarios

### Scenario A — Authentication & Session Rehydration Burst
Simulates N users opening the app simultaneously:
1. Firebase Auth token acquisition / verification (`signInWithEmailAndPassword` or token refresh)
2. Direct Firestore SDK read of `users/{uid}` (profile)
3. Direct Firestore SDK read of `stats/global` (pre-computed home stats)
4. Direct Firestore SDK read of `stats/aqi` (cached AQI widget)
5. Direct Firestore SDK read of `leaderboard/monthly` (home preview)

### Scenario B — Viewport Map Exploration (Reworked)
Simulates N users navigating the interactive map:
1. Direct Firestore SDK viewport bounding-box query against `verifiedSites`:
   - Query: `status == 'active'` within lat/lng bounding box, `limit(100)`
2. Direct Firestore SDK read of `config/monthlyGoals/current`
3. Optional site drill-down (10% of users tap a pin):
   - Query `activities` where `siteId == tappedSiteId`, `limit(20)`

### Scenario C — Activity Submission Burst (High Concurrency Mutation)
Simulates concurrent volunteer field submissions:
1. Multipart upload of evidence photo (5MB simulated JPEG) to Firebase Storage
2. POST to Cloud Function `logPlantation` / `logSeeding` (including GPS coordinates, species ID, quantity, idempotency key)
3. Cloud Function validates Islamabad GPS bounds, commits atomic activity document, and responds with new ID

### Scenario D — System Broadcast Notification under 25K Concurrency
Admin sends a critical alert while 25K users are actively connected:
1. Admin POST to Cloud Function `broadcastNotification`
2. Measure: Server processing duration, FCM topic `all_users` fan-out throughput, and client delivery timing

### Scenario E — Leaderboard Contention Burst
Simulates peak traffic checking competitive rankings:
1. Concurrent reads of `leaderboard/all_time`, `leaderboard/monthly`, `leaderboard/weekly`
2. User ranking query: direct read of user document stats

---

## Staged Concurrency Progression

| Stage | Virtual Users (VUs) | Duration | Scenarios | Target Focus |
|---|---|---|---|---|
| **Smoke** | 25 | 3 min | A, B | Protocol & auth validation |
| **Baseline** | 250 | 5 min | A, B | Normal operating profile |
| **Load 1** | 1,000 | 10 min | A, B, C | Mid-scale volunteer drive |
| **Load 2** | 2,500 | 15 min | A, B, C, E | Regional plantation campaign |
| **Load 3** | 5,000 | 20 min | A, B, C, D, E | Large community task event |
| **Load 4** | 10,000 | 20 min | A, B, C, E | City-wide climate drive peak |
| **Peak Load** | 25,000 | 15 min | A, B, C, D, E | Maximum targeted concurrent concurrency |
| **Spike** | 1,000 ➔ 25,000 ➔ 1,000 | 10 min | A, B | Immediate burst stress response |
| **Soak / Endurance** | 2,500 | 120 min | A, B, C | Memory leaks, connection degradation, resource exhaustion |

---

## Strict PASS/FAIL Thresholds (25K Concurrent Users)

Every threshold below is a non-negotiable quality gate. A single failed threshold blocks production rollout:

| Category | Metric | PASS Threshold | FAIL Threshold |
|---|---|---|---|
| **Firestore Direct Reads** | P50 Latency | < 100 ms | >= 100 ms |
| | P95 Latency | < 300 ms | >= 300 ms |
| | P99 Latency | < 600 ms | >= 600 ms |
| **Cloud Functions HTTPS** | P50 Latency | < 350 ms | >= 350 ms |
| | P95 Latency | < 1,500 ms | >= 1,500 ms |
| | P99 Latency | < 3,000 ms | >= 3,000 ms |
| **Firebase Auth Operations** | P50 Latency | < 400 ms | >= 400 ms |
| | P95 Latency | < 800 ms | >= 800 ms |
| | P99 Latency | < 1,500 ms | >= 1,500 ms |
| **Storage Performance** | P95 Upload (5MB image) | < 3,500 ms | >= 3,500 ms |
| | P99 Upload (5MB image) | < 6,000 ms | >= 6,000 ms |
| | Upload Error Rate (5xx) | 0.00% | > 0.00% |
| **System Error Rates** | Total HTTP / API Error Rate | < 0.10% | >= 0.10% |
| | Firebase Auth Failures (non-user error) | < 0.05% | >= 0.05% |
| | Cloud Function Errors (5xx / crashes) | < 0.05% | >= 0.05% |
| | Cloud Function Timeout Rate | < 0.01% | >= 0.01% |
| **Firestore Utilization** | Quota / Rate-Limit Errors (HTTP 429 / RESOURCE_EXHAUSTED) | Exactly 0 | >= 1 |
| | Unhandled Document Contention / Retry Failures | Exactly 0 | >= 1 |
| **Crash & Client Health** | Client Crash-Free Sessions (Crashlytics) | >= 99.9% | < 99.9% |
| | React Native UI Frame Rate during data fetch | >= 55 FPS | < 55 FPS |
| | Client Memory Leak / Growth per session | < 25 MB overhead | >= 25 MB |

---

## Artifacts & Reporting
1. Automated k6 HTML and JSON summaries generated after each test run
2. Cloud Monitoring dashboard snapshot capturing:
   - Peak CPU and memory utilization across Cloud Function instances
   - Active Firestore connections and read/write QPS
   - FCM queue drain rate
3. Final Load Test Certification Document signed off before Phase 9 production rollout.
