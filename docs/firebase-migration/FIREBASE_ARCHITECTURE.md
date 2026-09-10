# Grōv — Firebase Architecture (Revised)

## Core Principles & Constraints
1. **Zero UI Changes**: The React Native application UI remains 100% unchanged (no changes to buttons, screens, navigation, layouts, styles, fonts, or animations). Only the backend integration layer (`src/api/`, `src/context/AuthContext.tsx`) is adapted.
2. **Permanent Rollback Baseline**: The Laravel backend (`grov-backend/`) and SQLite database (`database.sqlite`) are preserved intact and never deleted during or after migration.
3. **Hybrid Architecture**: Direct Firestore SDK operations are used where Firestore Security Rules can safely and strictly enforce security/validation; Cloud Functions are reserved for privileged, transactional, sensitive, or server-orchestrated operations.
4. **Zero Secrets in Firestore**: Passwords, API keys, TOTP encryption keys, and private service credentials are stored exclusively in Google Secret Manager. Firestore holds non-secret configuration only.
5. **Architected for 25K+ Concurrent Users**: No component is assumed to be "automatically safe" or crash-free without explicit capacity design and load-test validation.

---

## Architecture Overview

```
React Native Client (Expo SDK 54 / RN 0.81.5 — Zero UI Changes)
  │
  ├── Firebase Auth SDK ──────────────────────────────▶ Firebase Authentication
  │   (ID Tokens — auto-refreshed, replaces Sanctum Bearer tokens)
  │
  ├── Direct Firestore SDK ───────────────────────────▶ Cloud Firestore
  │   (Public & user-scoped reads/writes enforced by      (Primary Database)
  │    strict Firestore Security Rules)
  │
  ├── Firebase Storage SDK ───────────────────────────▶ Cloud Storage for Firebase
  │   (Direct avatar uploads enforced by Storage Rules)    (Images & evidence)
  │
  ├── HTTPS API Layer (axios adapter) ───────────────▶ Cloud Functions (Node.js 20, asia-south1)
  │   (Privileged mutations, transactional logic,          (Enforces server auth & idempotency)
  │    and GPS validation)
  │
  └── FCM SDK ────────────────────────────────────────▶ Firebase Cloud Messaging
      (Push notifications & topic fan-out;                 (Users register devices in
       device tokens in users/{uid}/devices/{deviceId})    users/{uid}/devices/{deviceId})


Admin Dashboard (React.js SPA — grov-admin/)
  │
  ├── Firebase Auth SDK + 2FA ────────────────────────▶ Firebase Authentication
  │   (Mandatory per-admin TOTP via Secret Manager)        + Custom Claims (isAdmin)
  │
  ├── Direct Firestore SDK ───────────────────────────▶ Cloud Firestore
  │   (Read-only queries scoped to isAdmin claims)
  │
  └── HTTPS Callable / REST ──────────────────────────▶ Cloud Functions
      (All administrative mutations & audits)
```

---

## Hybrid Architecture Matrix: Direct SDK vs Cloud Functions

To avoid bottlenecking ordinary reads/writes through Cloud Functions while preventing client compromise, operations are cleanly partitioned:

| Operation | Channel | Security & Validation Mechanism |
|---|---|---|
| **Public Reads** (Species, Interests, Goals, Global Stats, AQI) | Direct Firestore SDK | Firestore Rules: `allow read: if true;` |
| **Map Rendering** (Sites in Viewport) | Direct Firestore SDK | Firestore Rules: `allow read: if true;` on `verifiedSites` collection with bbox/geohash range query and `limit(100)` |
| **Site Drilldown History** | Direct Firestore SDK | Firestore Rules: `allow read: if isAuthenticated();` on `activities` filtered by `siteId` (`limit(20)`) |
| **Profile Read** | Direct Firestore SDK | Firestore Rules: `allow read: if isOwner(uid) \|\| isAdmin();` |
| **Profile Update** (Bio, Location, Settings, Interests) | Direct Firestore SDK | Firestore Rules: `allow update: if isOwner(uid)` and no privileged fields modified (`role`, `totalPlanted`, `totalPoints`, etc.) |
| **Device Token Registration** | Direct Firestore SDK | Firestore Rules: `allow write: if isOwner(uid)` on `users/{uid}/devices/{deviceId}` |
| **Notification Read & Mark Read** | Direct Firestore SDK | Firestore Rules: `allow read, update: if isOwner(uid)` (only `isRead` can be modified) |
| **User Reports Creation** | Direct Firestore SDK | Firestore Rules: `allow create: if isAuthenticated() && request.resource.data.reporterId == request.auth.uid;` |
| **Avatar Photo Upload** | Direct Storage SDK | Storage Rules: `allow write: if isOwner(userId) && size < 5MB && contentType.matches('image/.*');` |
| **Plantation / Seeding Submission** | Cloud Function (`logPlantation` / `logSeeding`) | Server-side Islamabad GPS boundary validation, photo verification, atomic activity doc creation, idempotency check |
| **Activity Verification** | Cloud Function (`verifyActivity`) | Server-side role check (`isAdmin \|\| isCoordinator`), coordinator self-verification prevention, atomic points ledger insertion, milestone check (500 trees), FCM push, `verifiedSites` aggregation |
| **Community Task Join / Leave** | Cloud Function (`joinCommunityTask`) | Firestore transaction: atomic capacity check (`currentParticipantCount < maxVolunteers`), race condition prevention, participant subdoc write |
| **Broadcast Notification** | Cloud Function (`broadcastNotification`) | Server-side `isAdmin` check, single FCM topic message (`all_users`), template doc write, idempotency check |
| **Admin User Role Modification** | Cloud Function (`updateUserRole`) | Server-side `isAdmin` check, `admin.auth().setCustomUserClaims()`, Firestore update |
| **Admin 2FA Setup & Verification** | Cloud Function (`setupAdminTotp` / `verifyAdminTotp`) | Cryptographic secret generation, stored exclusively in Google Secret Manager, RFC 6238 time-step validation |
| **SMTP Mail Sending** | Cloud Function (`sendTestEmail` / notification mailer) | Reads credentials from Google Secret Manager at runtime, sends via Nodemailer |

---

## Reworked Map Architecture

### Problem in Initial Design
Querying the raw, growing `activities` collection for map pins causes high latency, excessive read costs, and unscalable data transfer when thousands of volunteer submissions exist across overlapping locations.

### New Solution: Dedicated `verifiedSites` Collection + Viewport Geospatial Querying
1. **Dedicated Collection (`verifiedSites/{siteId}`)**:
   - Lightweight, pre-aggregated documents representing verified physical plantation/seeding sites.
   - Contains: `name`, `latitude`, `longitude`, `geohash`, `region`, `activityCount`, `totalTreesPlanted`, `totalSeedsDispersed`, `primarySpecies`, `lastActivityAt`, `status`.
   - Updated atomically by the `verifyActivity` Cloud Function whenever an activity is approved.
2. **Viewport / Bounding-Box Querying**:
   - The mobile client passes its current map viewport coordinates: `minLat`, `maxLat`, `minLng`, `maxLng`.
   - Firestore query executes against `verifiedSites` using composite indexing on `(latitude, longitude, status)` or geohash range slices:
     ```javascript
     verifiedSitesRef
       .where('latitude', '>=', minLat)
       .where('latitude', '<=', maxLat)
       .where('status', '==', 'active')
       .limit(100)
     ```
   - Client filters longitude in memory for bounds crossing, or uses standard Geohash bounding-box queries (`geohashQueryBounds`).
3. **Strict Density Capping & Pagination**:
   - Hard cap of 100 pins returned per viewport request.
   - Prevents client rendering degradation and memory spikes on React Native MapView.
4. **On-Demand Drilldown**:
   - Detailed activity photos and volunteer history are NOT loaded on the map.
   - When a user taps a specific site pin, the app queries `activities` where `siteId == tappedSiteId` with `limit(20)`.

---

## Device Token Structure: Subcollection Architecture

To prevent document contention, avoid the 1MB Firestore document limit, and support multiple devices per user without race conditions:
- **Deprecated**: Unbounded `fcmTokens: string[]` inside `users/{uid}`.
- **Implemented**: `users/{uid}/devices/{deviceId}` subcollection.
  - Fields: `token: string`, `platform: "android"|"ios"|"web"`, `appVersion: string`, `deviceId: string`, `createdAt: timestamp`, `lastSeenAt: timestamp`.
  - Client writes to its own `deviceId` document on app launch and token refresh.
  - Server-side notification dispatch queries active devices (`lastSeenAt > now - 90 days`) or uses topic subscriptions.

---

## Cloud Functions Idempotency Design

Because Cloud Functions background triggers and network HTTP retries follow *at least once* delivery, every critical mutation is designed to be idempotent:

1. **`verifyActivity`**:
   - Uses a Firestore transaction that checks `activity.status === 'verified'`. If already verified, returns existing confirmation immediately.
   - Points record written with deterministic document ID: `userPoints/points_${activityId}`. If the doc exists, write is a no-op.
   - Milestone trigger checks `activity.milestoneProcessed == true`.
2. **`logPlantation` / `logSeeding`**:
   - Accepts a `clientSubmissionId` (UUID generated on mobile before upload).
   - Queries `activities` where `clientSubmissionId == input.clientSubmissionId`. If exists, returns the existing record without re-saving.
3. **`joinCommunityTask`**:
   - Participant document key is deterministic: `communityTasks/{taskId}/participants/{userId}`.
   - Transaction checks if participant document already exists with `status == 'joined'`. If so, aborts counter increment.
4. **`broadcastNotification`**:
   - Client passes `idempotencyKey` (hash of adminUid + title + content + minute bucket).
   - Cloud Function checks `idempotencyKeys/{key}`. If key is present and locked within 10 minutes, ignores repeat request.
5. **Scheduled Jobs (`fetchAqi`, `computeLeaderboard`, `computeExploreStats`)**:
   - Overwrites deterministic singletons (`stats/aqi`, `stats/global`, `leaderboard/all_time`). Re-running produces identical state.

---

## Secrets Management: Google Secret Manager

No credentials, passwords, or cryptographic keys are stored in source code or Firestore documents:
- **Secret Manager Secrets**:
  - `grov-smtp-noreply-password`
  - `grov-smtp-security-password`
  - `grov-totp-master-key` (AES-256 key for admin 2FA encryption)
  - `grov-google-aqi-api-key`
- **Firestore `config/` Collections**:
  - Store non-sensitive configuration only: hostnames, ports, encryption protocols, sender addresses, display names.
- **Runtime Access**:
  - Cloud Functions access secrets via the GCP Secret Manager SDK or Cloud Functions secret binding (`runWith({ secrets: [...] })`).
  - IAM restricts access solely to the Cloud Functions runtime service account.

---

## Scalability Design (Target: 25,000+ Concurrent Users)

Scalability is not assumed; it is engineered through architecture:
- **Zero Full-Table Scans**: All aggregation (leaderboard, explore metrics, monthly goals) is pre-computed and stored in cached singleton documents.
- **Fan-Out via FCM Topics**: System announcements are delivered via FCM topic `all_users` (O(1) server execution), eliminating 25,000 document writes in a loop.
- **Geospatial Density Capping**: Viewport-limited queries on `verifiedSites` prevent unbounded document reads.
- **Isolated User Documents**: User stats counters are updated per user doc on verification, avoiding central counter hot-spots.
- **Proof via Load Testing**: Scalability must be validated on `grov-staging` against strict pass/fail criteria up to 25,000 virtual users.
