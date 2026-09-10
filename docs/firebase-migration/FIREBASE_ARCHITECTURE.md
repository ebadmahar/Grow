# Grōv — Firebase Architecture

## Current Architecture

React Native (Expo SDK 54)
  -> axios + Sanctum Bearer Token
  -> Laravel 12 PHP API
    -> SQLite/MySQL (16 tables)
    -> Local disk storage (avatars, evidence photos)
    -> Dual SMTP (noreply@growgrov.org + security@growgrov.org)
    -> Open-Meteo AQI API (cached in DB)
    -> PHP session Admin Dashboard (Blade templates + 2FA)

## Target Firebase Architecture

React Native (Expo SDK 54)
  -> Firebase Auth SDK (ID tokens — replaces Sanctum Bearer tokens)
  -> Firestore SDK (direct reads for public/user data)
  -> Firebase Storage SDK (photo uploads)
  -> axios -> Cloud Functions HTTPS (privileged operations only)
  -> FCM SDK (push notifications)

Admin Dashboard (React.js SPA)
  -> Firebase Auth SDK (admin custom claim + TOTP required)
  -> Firestore SDK (admin reads)
  -> axios -> Cloud Functions HTTPS (all write operations)
  -> Firebase Hosting (deployment)

Cloud Functions (Node.js 20, asia-south1)
  Auth Triggers:
    - onUserCreate: initialize user Firestore doc, set default claims
  Scheduled:
    - fetchAqi: hourly Open-Meteo + Google AQI fetch -> stats/aqi
    - computeLeaderboard: hourly pre-aggregate -> leaderboard/{period}
    - computeExploreStats: 15-min pre-aggregate -> stats/global
  Firestore Triggers:
    - onActivityVerified: award points, update user totals, send FCM push
  HTTPS Callable:
    - logPlantation, logSeeding (GPS validate, multi-photo upload)
    - submitMonitoringRecord
    - verifyActivity (admin/coord claim required)
    - joinCommunityTask (atomic capacity check via transaction)
    - leaveCommunityTask
    - createCommunityTask, updateCommunityTask, deleteCommunityTask
    - broadcastNotification (admin -> FCM topic send)
    - updateUserRole (admin -> setCustomUserClaims + Firestore)
    - createUser, deleteUser (admin only)
    - sendTestEmail (reads Firestore SMTP config, sends via Nodemailer)
    - verifyAdminTotp, setupAdminTotp

## Key Architecture Decisions

### Why Cloud Functions for writes?
Firestore Security Rules cannot enforce complex business logic (e.g., capacity limits,
500-tree milestone notifications, points calculation). Cloud Functions run in a trusted
server environment and use the Firebase Admin SDK, bypassing Security Rules safely.

### Why pre-computed aggregates?
The leaderboard previously scanned the entire users table on every request (N+1 risk).
At 25K concurrent users this would cause catastrophic DB load. Pre-computed documents
updated by scheduled Cloud Functions mean 25K users all read from ONE document.

### Why FCM topics for broadcast?
The old broadcast loop created N Firestore writes for N users. At 25K users this:
(a) takes minutes, (b) costs ~$4.50 per broadcast, (c) risks rate limit errors.
FCM topic messaging is O(1) — one API call regardless of subscriber count.

### Two Firebase Projects (Staging + Production)
- grov-staging: for development, testing, load tests
- grov-production: for real users
- Separate Firestore databases, Auth user pools, Storage buckets
- Cloud Functions deployed to both, with environment-specific config
- Admin dashboard deployed to both (staging.admin.growgrov.org + admin.growgrov.org)

## Scalability Analysis (25K Concurrent Users)

| Scenario | Architecture | Bottleneck Risk |
|---|---|---|
| 25K app opens / auth | Firebase Auth (auto-scaling) | None |
| 25K profile reads | Firestore doc read per user | None — separate docs |
| 25K leaderboard loads | Single pre-computed doc read | None |
| 25K home stats loads | Single pre-computed doc read | None |
| 25K map pin loads | Firestore indexed query | Needs bbox pagination (100 pins max per viewport) |
| Activity submissions (burst) | Cloud Function (1K concurrent) | Acceptable — unique doc per activity |
| Broadcast to 25K | FCM topic (1 API call) | None |
| 25K image uploads | Firebase Storage (auto-scaling) | None |

## Firebase Cost Estimate (25K DAU)

| Service | Estimate | Cost |
|---|---|---|
| Auth sign-ins | 25K/day | Free |
| Firestore reads | 500K/day | ~$0.60/day |
| Firestore writes | 50K/day | ~$0.18/day |
| Cloud Functions | 500K invocations/month | Free tier |
| Firebase Storage | 10GB storage + 5GB transfer | ~$3/month |
| FCM | Unlimited | Free |
| **Total** | | **~$25-40/month** |
