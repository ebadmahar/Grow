# Grōv — Firestore Schema

## Design Principles
1. Denormalized for reads: user name/avatar stored inside activity documents (no joins)
2. Pre-computed aggregates: leaderboard, stats, monthly goals stored as summary docs
3. No hot documents: all aggregate counters updated by Cloud Functions, not per-write
4. Subcollections for 1:many: activity photos, monitoring records, task participants
5. Security-first: sensitive fields only writable via Cloud Functions (admin SDK)

## Collections

### users/{uid}
Fields:
  name: string
  email: string
  role: "volunteer" | "coordinator" | "admin"
  location: string                    // "Islamabad, Pakistan"
  bio: string | null
  avatarUrl: string | null            // Firebase Storage download URL
  settings: map                       // notification preferences
  interestIds: string[]               // array of interest doc IDs
  totalPlanted: number                // denormalized, updated by CF on verify
  totalSeeded: number                 // denormalized, updated by CF on verify
  totalPoints: number                 // denormalized, updated by CF on verify
  monthlyPoints: number               // reset by scheduled function monthly
  activitiesCount: number             // denormalized counter
  totpEnabled: boolean                // whether per-admin 2FA has been enrolled (secret is in Secret Manager)
  mfaEnrolled: boolean                // Firebase MFA status flag
  isDeleted: boolean                  // soft delete flag
  createdAt: timestamp
  // Legacy Data Traceability (for migrated records)
  _legacyId: number | null            // original SQLite primary key (id)
  _legacyTable: string | null         // source table name ("users")
  _migratedAt: timestamp | null

Subcollections:
  users/{uid}/devices/{deviceId}      // Bounded per-device structure (replaces unbounded fcmTokens array)
    token: string                     // FCM registration token
    platform: "android" | "ios" | "web"
    appVersion: string
    deviceId: string                  // hardware UUID or installation ID
    createdAt: timestamp
    lastSeenAt: timestamp

### verifiedSites/{siteId}
// Dedicated, lightweight collection for map rendering (avoids scanning activities collection)
Fields:
  siteId: string                      // generated ID or slug
  name: string                        // site / location name
  latitude: number                    // geo coordinate for viewport querying
  longitude: number                   // geo coordinate for viewport querying
  geohash: string                     // geohash for geospatial range queries
  region: string                      // e.g. "Islamabad"
  activityCount: number               // aggregated number of verified activities
  totalTreesPlanted: number           // aggregated verified trees
  totalSeedsDispersed: number         // aggregated verified seeds
  primarySpecies: string[]            // top species planted at this site
  lastActivityAt: timestamp           // most recent activity timestamp
  status: "active" | "completed"      // site status
  createdAt: timestamp
  updatedAt: timestamp
  _legacyId: number | null            // original locations.id if applicable
  _legacyTable: string | null

### activities/{activityId}
Fields:
  userId: string                      // Firebase Auth UID
  userName: string                    // denormalized
  userAvatarUrl: string | null        // denormalized
  activityType: "plantation" | "seeding"
  status: "reported" | "verified" | "rejected"
  date: timestamp
  fieldNotes: string | null
  pointsAwarded: number
  pointsProcessed: boolean            // idempotency flag for points allocation
  clientSubmissionId: string | null   // client-generated idempotency key to prevent duplicate submissions
  verifiedBy: string | null           // UID of verifier
  verifiedAt: timestamp | null
  siteName: string
  siteId: string | null               // reference to verifiedSites/{siteId}
  latitude: number
  longitude: number
  geohash: string                     // geohash for proximity/bounding box queries
  region: string
  speciesId: string
  speciesName: string                 // denormalized
  // Plantation-specific (null when activityType == "seeding")
  quantityPlanted: number | null
  plantingMethod: string | null       // "Pit Planting" | "Trench Planting" | "Mound Planting" | "Aerial Planting"
  // Seeding-specific (null when activityType == "plantation")
  seedsDispersed: number | null
  dispersalMethod: string | null      // "Hand Broadcasting" | "Seed Bombing (aerial)" | "Seed Drill" | "Hydroseeding"
  coverageAreaSqm: number | null
  createdAt: timestamp
  // Legacy Data Traceability (for migrated records)
  _legacyId: number | null            // original activities.id
  _legacyTable: string | null         // "activities"
  _migratedAt: timestamp | null

Subcollections:
  activities/{activityId}/photos/{photoId}
    storageUrl: string                // Firebase Storage download URL
    storagePath: string               // for deletion
    mimeType: string
    fileSizeBytes: number
    uploadedAt: timestamp

  activities/{activityId}/monitoringRecords/{recordId}
    userId: string
    userName: string                  // denormalized
    observationDate: timestamp
    observedCount: number
    establishedCount: number
    survivingCount: number
    deadCount: number
    condition: string
    notes: string | null
    createdAt: timestamp

### species/{speciesId}
Fields:
  commonName: string
  scientificName: string
  type: "Tree" | "Shrub" | "Seed"
  nativeRegion: string
  description: string
  order: number                       // for display ordering

### communityTasks/{taskId}
Fields:
  creatorId: string
  creatorName: string                 // denormalized
  siteName: string
  latitude: number
  longitude: number
  region: string
  title: string
  activityType: string                // "Tree Plantation" | "Seed Bombing" | etc.
  date: timestamp
  startTime: string
  maxVolunteers: number | null
  currentParticipantCount: number     // updated atomically by CF joinCommunityTask
  description: string
  coverImageUrl: string | null
  status: "open" | "completed" | "cancelled"
  createdAt: timestamp

Subcollections:
  communityTasks/{taskId}/participants/{userId}
    userId: string
    userName: string
    role: "organizer" | "participant"
    status: "joined" | "cancelled"
    joinedAt: timestamp

### interests/{interestId}
Fields:
  name: string
  order: number

### notifications/{notificationId}
Fields:
  userId: string
  type: "system" | "verification"
  title: string
  message: string
  isRead: boolean
  data: map | null
  createdAt: timestamp

### reports/{reportId}
Fields:
  reporterId: string
  reporterName: string                // denormalized
  type: string
  title: string
  description: string
  location: string | null
  status: "open" | "investigating" | "resolved" | "dismissed"
  resolvedBy: string | null
  resolvedAt: timestamp | null
  resolutionNotes: string | null
  createdAt: timestamp

### userPoints/{pointId}
Fields:
  userId: string
  activityId: string
  points: number
  reason: string
  createdAt: timestamp

### config/smtp (single doc — NON-SECRET metadata only)
// Passwords, API keys, and private credentials are NEVER stored here.
// Stored in Google Secret Manager: 'grov-smtp-noreply-password', 'grov-smtp-security-password'
Fields:
  noreply:
    host: string                      // e.g. "mail.growgrov.org"
    port: number                      // 465 or 587
    encryption: string                // "tls" or "ssl"
    username: string                  // "noreply@growgrov.org"
    fromAddress: string
    fromName: string
  security:
    host: string
    port: number
    encryption: string
    username: string                  // "security@growgrov.org"
    fromAddress: string
    fromName: string

### config/aqiSettings (single doc — NON-SECRET config only)
// Google Air Quality API key is stored in Google Secret Manager: 'grov-google-aqi-api-key'
Fields:
  manualOverride: map | null
  refreshIntervalHours: number

### config/monthlyGoals/{year-month} (e.g., "2026-09")
Fields:
  title: string
  targetTrees: number
  targetSeeds: number
  targetMonitoring: number
  targetParticipants: number
  status: string
  createdAt: timestamp

### stats/global (single pre-computed doc)
Fields:
  totalPlanted: number
  totalSeeded: number
  activeSitesCount: number
  dailyRecorded: number
  co2WeeklyKg: number
  co2TotalKg: number
  regionalSurvivalRate: string
  lastUpdated: timestamp

### stats/aqi (single pre-computed doc)
Fields:
  location: string
  aqi: number
  status: string
  aqiColor: string
  aqiEmoji: string
  pm10: number
  pm2_5: number
  source: string
  lastUpdatedAt: timestamp

### leaderboard/{period} (period: "all_time" | "monthly" | "weekly")
Fields:
  updatedAt: timestamp
  rankings: array[{
    rank: number,
    userId: string,
    name: string,
    avatarUrl: string | null,
    role: string,
    treesPlanted: number,
    seedsDispersed: number,
    activitiesCount: number,
    points: number,
    score: number
  }]  // max 100 entries

## Required Composite Indexes

1. verifiedSites: (status ASC, geohash ASC)
   -> Used by: map viewport geohash bounding box queries (active sites)
2. verifiedSites: (latitude ASC, longitude ASC, status ASC)
   -> Used by: map viewport bounding-box queries (minLat/maxLat/minLng/maxLng)
3. activities: (userId ASC, status ASC, date DESC)
   -> Used by: getMyActivities with filter
4. activities: (siteId ASC, status ASC, date DESC)
   -> Used by: site drilldown activity history (paginated limit 20)
5. activities: (status ASC, activityType ASC, date DESC)
   -> Used by: admin queue
6. activities: (status ASC, date DESC)
   -> Used by: admin recent activities
7. activities: (userId ASC, activityType ASC, date DESC)
   -> Used by: my-activities with type filter
8. notifications: (userId ASC, createdAt DESC)
   -> Used by: notification feed
9. userPoints: (userId ASC, createdAt DESC)
   -> Used by: points history
10. communityTasks: (status ASC, date DESC)
    -> Used by: community hub listing
11. reports: (reporterId ASC, createdAt DESC)
    -> Used by: my reports
12. reports: (status ASC, createdAt DESC)
    -> Used by: admin reports queue

## Business Logic — Points Calculation

Plantation:
  basePoints = quantityPlanted * 10
  evidenceBonus = min(photoCount, 5) * 50
  totalPoints = basePoints + evidenceBonus

Seeding:
  basePoints = seedsDispersed * 1
  evidenceBonus = min(photoCount, 5) * 50
  totalPoints = basePoints + evidenceBonus

## Business Logic — CO2 Calculation

weeklyOffset = (trees * 21.8 * 0.85 * 1.2) / 52  [kg/week]
totalOffset = trees * 21.8 * 0.85 * 1.2           [kg total]

## Business Logic — 500-Tree Milestone

When a plantation activity is submitted and the user's cumulative
totalPlanted crosses 500, Cloud Function sends a notification to
all admin users: "User X crossed 500-tree milestone. Consider promoting to Coordinator."

## Business Logic — Role Promotion

volunteer -> coordinator: Admin manually promotes via dashboard
coordinator -> admin: Admin manually promotes via dashboard
Role changes call Firebase Admin SDK setCustomUserClaims() to update:
  { role, isAdmin, isCoordinator }
Custom claims take effect on next ID token refresh (max 1 hour).
