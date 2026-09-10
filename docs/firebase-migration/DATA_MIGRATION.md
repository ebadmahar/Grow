# Grōv — Data Migration Plan (Revised)

## Source: SQLite database at `grov-backend/database/database.sqlite`
## Destination: Firebase (Auth + Firestore + Storage)
## Absolute Constraints:
1. **Zero Data Loss & Permanent Traceability**: Every migrated record MUST have an unambiguous mapping between its legacy SQL integer ID and its new Firebase document ID.
2. **Laravel Backend & DB Preservation**: `grov-backend/` and `grov-backend/database/database.sqlite` remain 100% untouched and are NEVER deleted during or after the migration.
3. **No Shortened Validation**: The migration verification and validation phase is protected and cannot be compressed.

---

## Migration Pipeline

### Stage 1: SQLite Extraction
- **Script**: `scripts/migration/01_export_sqlite.py`
- **Source**: `grov-backend/database/database.sqlite` (read-only SQLite connection)
- **Output**: `scripts/migration/export/` (individual JSON exports for all 16 tables)

### Stage 2: Transformation & Bidirectional ID Mapping
- **Script**: `scripts/migration/02_transform.js`
- **Outputs**:
  - `migration-data/id_mapping.json` (Master map: `{ [tableName]: { [oldSqlId]: newFirestoreDocId } }`)
  - `migration-data/firebase_to_old_id.json` (Reverse map: `{ [newFirestoreDocId]: { table: tableName, oldId: oldSqlId } }`)
  - Transformed collection payloads for Firestore import

**Key Transformation Rules**:
1. **Document-Level Traceability Metadata**:
   Every transformed record explicitly includes:
   ```json
   {
     "_legacyId": 142,
     "_legacyTable": "activities",
     "_migratedAt": "2026-09-10T12:00:00Z"
   }
   ```
2. **Foreign Key Resolution**:
   All relational integer foreign keys (e.g., `user_id`, `species_id`, `location_id`, `activity_id`) are mapped to their corresponding Firestore document IDs via `id_mapping.json`.
3. **Table Consolidation**:
   - `plantation_activities` and `seeding_activities` are merged directly into their parent `activities` documents.
   - `user_interests` pivot table is collapsed into `users/{uid}.interestIds: string[]`.
4. **Pre-aggregating `verifiedSites`**:
   - Synthesizes `verifiedSites` documents from unique `locations` and aggregates verified `activities` at each location.
   - Calculates `activityCount`, `totalTreesPlanted`, `totalSeedsDispersed`, and assigns geohashes for viewport querying.
5. **FCM Tokens**:
   - Legacy tokens (if present) are mapped into individual documents under `users/{uid}/devices/{deviceId}` rather than an unbounded array.

### Stage 3: Firebase Auth Import (Bcrypt Preservation)
- **Script**: `scripts/migration/03_import_auth.js`
- **Method**: Firebase Admin SDK `admin.auth().importUsers()`
- **Parameters**: `hash: user.password`, `algorithm: 'BCRYPT'`, `rounds: 12`.
- Laravel's `$2y$` bcrypt hashes are 100% compatible with Firebase Auth's bcrypt engine.
- Users preserve their existing passwords with zero friction.

### Stage 4: Firestore Chunked Batch Import
- **Script**: `scripts/migration/04_import_firestore.js`
- **Method**: Atomic batches of 400 documents (well below Firestore's 500 limit).
- **Import Sequence** (respects foreign key references):
  1. `species`
  2. `interests`
  3. `users` (UID matches Firebase Auth UIDs)
  4. `verifiedSites`
  5. `activities` (merged with plantation/seeding details)
  6. Subcollections: `activities/{id}/photos` & `activities/{id}/monitoringRecords`
  7. `communityTasks` & `communityTasks/{id}/participants`
  8. `notifications`
  9. `reports`
  10. `userPoints`
  11. `config/monthlyGoals/{year-month}` (non-secret goals)
  12. `stats/global`, `stats/aqi`, `leaderboard/all_time`, `leaderboard/monthly`

### Stage 5: Media Migration (Firebase Storage)
- **Script**: `scripts/migration/05_migrate_media.js`
- **Source**: `grov-backend/storage/app/public/`
- Uploads images to Firebase Storage:
  - `avatars/{uid}/avatar.[ext]`
  - `activities/{activityId}/photos/{photoId}.[ext]`
  - `community-tasks/{taskId}/cover.[ext]`
- Updates Firestore document URLs with permanent Firebase Storage download URLs.

### Stage 6: Rigorous Migration Verification
- **Script**: `scripts/migration/06_verify.js`
- **Automated Verification Gates**:
  1. **Record Count Equality**:
     - `count(Auth users) == count(active SQLite users)`
     - `count(Firestore users) == count(SQLite users)`
     - `count(Firestore activities) == count(SQLite activities)`
     - `count(Firestore species) == count(SQLite species)`
     - `count(Firestore communityTasks) == count(SQLite community_tasks)`
     - `count(Firestore userPoints) == count(SQLite user_points)`
  2. **100% ID Mapping Integrity**:
     - Every entry in `id_mapping.json` must successfully resolve to an existing Firestore document containing the matching `_legacyId`.
  3. **Data Integrity Spot-Checks**:
     - Automated comparison of 50 randomly sampled users, activities, and tasks checking field-by-field equality between SQLite and Firestore.
  4. **Aggregated Metric Match**:
     - `sum(totalPlanted)` and `sum(totalPoints)` in Firestore must precisely match SQL sums `SUM(quantity_planted)` and `SUM(points)`.

---

## Permanent ID Mapping Storage & Version Control
The master mapping files:
- `migration-data/id_mapping.json`
- `migration-data/firebase_to_old_id.json`
will be committed directly to Git on the `firebase-migration` branch. They serve as a permanent, immutable ledger linking every modern record to its historical SQL counterpart.
