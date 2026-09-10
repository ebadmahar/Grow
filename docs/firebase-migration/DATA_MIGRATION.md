# Grōv — Data Migration Plan

## Source: SQLite database at grov-backend/database/database.sqlite
## Destination: Firebase (Auth + Firestore + Storage)
## Constraint: Original database must NOT be deleted until migration is fully validated

## Migration Pipeline

Stage 1: Export
  Script: scripts/migration/01_export_sqlite.py
  Input:  grov-backend/database/database.sqlite
  Output: scripts/migration/export/
    users.json
    interests.json
    user_interests.json
    species.json
    locations.json
    activities.json
    plantation_activities.json
    seeding_activities.json
    activity_photos.json
    monitoring_records.json
    community_tasks.json
    community_task_participants.json
    community_goals.json
    reports.json
    notifications.json
    user_points.json

Stage 2: Transform
  Script: scripts/migration/02_transform.js
  Input:  scripts/migration/export/*.json
  Output: scripts/migration/transformed/
    id_mapping.json              <- maps old SQL integer IDs to new Firestore doc IDs
    users_firestore.json
    activities_firestore.json    <- plantation + seeding merged into activity doc
    species_firestore.json
    community_tasks_firestore.json
    notifications_firestore.json
    reports_firestore.json
    user_points_firestore.json
    monitoring_records_firestore.json

  Transformations performed:
  - Generate Firestore document IDs (UUID v4) for all records
  - Build id_mapping.json (old_integer_id -> new_doc_id) for FK resolution
  - Merge plantation_activities and seeding_activities INTO activities doc
  - Resolve all FK integers to new Firestore doc IDs using id_mapping.json
  - Convert SQL timestamps (YYYY-MM-DD HH:MM:SS) to ISO 8601 strings
  - Convert SQL boolean integers (0/1) to JS booleans
  - Convert NULL to null
  - Denormalize: copy userName, userAvatarUrl, speciesName into activity docs
  - Denormalize: copy creatorName into communityTasks docs
  - Denormalize: copy reporterName into reports docs
  - Convert avatar_path (Laravel local URL) to placeholder (real URL after Stage 5)

Stage 3: Firebase Auth User Import
  Script: scripts/migration/03_import_auth.js
  Method: admin.auth().importUsers() with bcryptRound: 12
  Note:   Laravel bcrypt hashes ARE compatible with Firebase Auth bcrypt import.
          Users will be able to log in with their existing passwords.
  Input:  users_firestore.json
  Output: auth_import_results.json (success/failure per user)

Stage 4: Firestore Import
  Script: scripts/migration/04_import_firestore.js
  Method: Batch writes (max 500 per batch, chunked)
  Order:
    1. species (referenced by activities)
    2. interests (referenced by users)
    3. users (after Auth import so UIDs match)
    4. activities (with plantation/seeding data merged)
    5. activities/{id}/photos subcollection
    6. activities/{id}/monitoringRecords subcollection
    7. communityTasks (references users)
    8. communityTasks/{id}/participants subcollection
    9. notifications
    10. reports
    11. userPoints
    12. config/monthlyGoals documents
    13. stats/global (computed from imported data)
    14. leaderboard/all_time (computed from imported data)
    15. leaderboard/monthly (computed from imported data)

Stage 5: Media Migration
  Script: scripts/migration/05_migrate_media.js
  Source: grov-backend/storage/app/public/
    avatars/   -> gs://[bucket]/avatars/{uid}/avatar.[ext]
    evidence/  -> gs://[bucket]/activities/{activityId}/photos/{photoId}.[ext]
    tasks/     -> gs://[bucket]/community-tasks/{taskId}/cover.[ext]
  After upload: update Firestore documents with new Storage download URLs
  Note: If storage/ directory is empty (files not present), this stage is skipped
        and all avatarUrl/storageUrl fields remain null until users re-upload.

Stage 6: Verification
  Script: scripts/migration/06_verify.js
  Checks:
    - Auth user count == SQLite users count (excluding soft-deleted)
    - Firestore users count == Auth count
    - Firestore activities count == SQLite activities count
    - Firestore species count == SQLite species count
    - Firestore communityTasks count == SQLite community_tasks count
    - Firestore notifications count == SQLite notifications count
    - Spot check: 20 random users (name, email, role match)
    - Spot check: 20 random activities (type, status, quantities match)
    - Leaderboard totals match SQLite aggregation
    - Explore stats match SQLite aggregation
  Output: verification_report.json (pass/fail per check)

## Password Migration Details

Firebase Auth importUsers() accepts bcrypt hashes with these parameters:
  hash: user.password (Laravel bcrypt string, e.g., $2y$12$...)
  algorithm: BCRYPT
  rounds: 12

Laravel uses $2y$ prefix; Firebase accepts this. Users log in normally after migration.

## Data That Cannot Be Migrated

1. Laravel Sanctum tokens — Firebase uses ID tokens (auto-generated), no migration needed
2. Laravel sessions — Firebase uses persistent Auth state, no migration needed
3. Laravel Cache entries (smtp_settings, manual_aqi_override) — migrated to Firestore config/

## Rollback

If migration fails at any stage:
  - Stage 1-2 (export/transform): No Firebase changes, safe to re-run
  - Stage 3 (Auth import): Delete all imported Firebase Auth users and re-run
  - Stage 4 (Firestore import): Delete all Firestore collections and re-run
  - Stage 5 (Media): Delete uploaded Storage files and re-run
  - At any point: Original SQLite database is untouched and Laravel backend still works

## Estimated Migration Time

| Stage | Estimated time |
|---|---|
| Export | < 1 minute |
| Transform | < 1 minute |
| Auth import | < 1 minute |
| Firestore import | 2-5 minutes (depends on record count) |
| Media migration | 5-30 minutes (depends on file count/size) |
| Verification | < 2 minutes |
