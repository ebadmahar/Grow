# Grōv — Load Testing Strategy

## Goal: Validate the Firebase architecture handles 25,000 concurrent users

## Tools
- k6 (https://k6.io) — open source HTTP load testing
- Firebase Console metrics — real-time Firestore reads/writes, CF executions
- Google Cloud Monitoring — Cloud Function latency, error rates

## Test Environment
- All load tests run against grov-staging (NOT production)
- Mobile app simulator: k6 scripts simulate the full user session flow
- Staging must have realistic data: at minimum 1,000 seeded users and 5,000 activities

## Test Scenarios

### Scenario A — Authentication Burst
Simulates N users opening the app and logging in simultaneously.
Steps per virtual user:
  1. POST Firebase Auth signInWithEmailAndPassword (via REST)
  2. GET Firestore users/{uid} (profile read)
  3. GET Firestore stats/global (home stats)
  4. GET Firestore stats/aqi (AQI widget)
  5. GET Firestore leaderboard/monthly (home leaderboard preview)

### Scenario B — Home + Map Load
Simulates N users loading the home screen and explore map.
Steps per virtual user:
  1. (Already authenticated — use pre-generated ID tokens)
  2. GET Firestore stats/global
  3. GET Firestore stats/aqi
  4. GET Firestore leaderboard/monthly
  5. GET Firestore activities (map pins — with bbox filter)
  6. GET Firestore config/monthlyGoals/current

### Scenario C — Activity Submission Burst
Simulates N users submitting plantation activities simultaneously.
Steps per virtual user:
  1. POST Cloud Function logPlantation (with image upload to Storage)
  2. GET Firestore activities/{newId} (verify created)

### Scenario D — Broadcast Notification
Admin triggers broadcast while 25K users are connected.
Steps:
  1. POST Cloud Function broadcastNotification (admin token)
  2. Measure: FCM delivery time, Firestore notification doc creation time
  3. Verify: 100 random users' Firestore notification docs created

### Scenario E — Leaderboard Burst
Simulates 25K users loading the leaderboard simultaneously.
Steps per virtual user:
  1. GET Firestore leaderboard/all_time
  2. GET Firestore leaderboard/monthly
  3. GET Firestore leaderboard/weekly

## Test Stages

| Stage | VUs | Duration | Scenarios |
|---|---|---|---|
| Smoke | 10 | 2 min | A |
| Baseline | 100 | 5 min | A, B |
| Load 1 | 500 | 10 min | A, B, C |
| Load 2 | 1,000 | 10 min | A, B, C, E |
| Load 3 | 2,500 | 10 min | A, B, D, E |
| Load 4 | 5,000 | 10 min | A, B, C, E |
| Load 5 | 10,000 | 15 min | A, B, E |
| Spike | 25,000 | 5 min | A, B, E |
| Endurance | 1,000 | 60 min | A, B, C |

## Pass/Fail Criteria

| Metric | Threshold |
|---|---|
| HTTP error rate | < 1% |
| P95 latency — Firestore reads | < 500ms |
| P95 latency — Cloud Function HTTPS | < 2000ms |
| P95 latency — Firebase Auth | < 1000ms |
| Firebase Auth failures | < 0.1% |
| Cloud Function timeout rate | < 0.1% |
| Firestore quota errors | 0 |

## Measurements to Record per Stage

- P50, P95, P99 latency (Firestore reads, Cloud Functions, Auth)
- Error rate (HTTP 4xx, 5xx)
- Firebase Console: reads/writes per second peak
- Cloud Function: execution count, average duration, error count
- Firebase Storage: upload throughput
- FCM delivery rate (Scenario D)

## Expected Results (Based on Architecture Analysis)

| Scenario | Expected P95 Latency | Confidence |
|---|---|---|
| Auth (25K burst) | < 800ms | High — Firebase Auth auto-scales |
| Profile read (25K) | < 300ms | High — individual doc reads |
| Leaderboard (25K) | < 200ms | High — single pre-computed doc |
| Home stats (25K) | < 200ms | High — single pre-computed doc |
| Map pins (25K) | < 500ms | Medium — indexed query |
| Activity submission (25K) | < 3000ms | Medium — CF + Storage |
| Broadcast (25K) | < 5000ms (total delivery) | High — FCM topic |

## Load Test Scripts Location

scripts/load-testing/
  k6/
    scenario_a_auth_burst.js
    scenario_b_home_map.js
    scenario_c_activity_submission.js
    scenario_d_broadcast.js
    scenario_e_leaderboard.js
    shared/
      auth_helper.js        <- pre-generate ID tokens for load tests
      config.js             <- staging endpoints, test user pool
  results/
    (load test results stored here after each run)
