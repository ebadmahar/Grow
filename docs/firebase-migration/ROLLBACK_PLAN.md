# Grōv — Rollback Plan

## Principle
The Laravel backend (`grov-backend/`) and original SQLite database (`database.sqlite`) remain UNTOUCHED throughout and following the entire migration. They will NOT be deleted, altered, or decommissioned during the migration, serving as the permanent rollback safety net and reference implementation. The Firebase system is built entirely alongside, not replacing in-place. Rollback at any point requires only switching the mobile app API endpoint.

## Rollback Triggers
Execute rollback if any of the following occur:
- Data loss detected (record count mismatch > 1%)
- Firebase unavailability > 5 minutes affecting production users
- Critical security vulnerability discovered in Firebase architecture
- Load test failure at 5,000 concurrent users or below
- Admin dashboard functional regression (cannot verify activities)

## Rollback Procedures by Phase

### Before Phase 7 (Mobile Integration) — No user impact
Action: Simply stop Firebase migration work. Users are unaffected.
Laravel backend is still running normally.

### During Phase 7 (Mobile Integration) — Partial migration
Action:
  1. Revert grov-app/src/api/client.ts to use Laravel base URL
  2. Revert grov-app/src/context/AuthContext.tsx to Sanctum token flow
  3. Build and deploy the reverted app
  4. Users see no change — they were using the Firebase version only during testing

### After Phase 9 (Production Launch) — Full Firebase
Action:
  1. Deploy a hotfix build of the mobile app with Laravel API endpoints restored
  2. Users are redirected back to Laravel
  3. All Firebase data written during the production window must be:
     a. Exported from Firestore
     b. Merged back into the original SQLite database manually
  Note: This is the most complex rollback — hence thorough testing before Phase 9

## Git Rollback

To restore any file to pre-migration state:
  git checkout pre-firebase-snapshot -- <file>

To view the full pre-migration state:
  git checkout pre-firebase-snapshot

## Database Rollback

Original SQLite file location: grov-backend/database/database.sqlite
This file is NOT modified during migration.
If production MySQL is used, ensure daily backups are maintained throughout migration.

## Firebase Rollback (Staging → Production failure)

If production Firebase import fails partway:
  1. Delete all partially imported Firestore collections
  2. Delete all Firebase Auth users (admin.auth().deleteUsers())
  3. Re-run migration pipeline from Stage 3 (Auth import)

Script: scripts/migration/rollback_firebase.js
  - Deletes all Firestore documents in all collections
  - Deletes all Firebase Auth users
  - Clears Firebase Storage bucket
  Use only in emergency — irreversible without re-running import.
