# Grōv — Firebase Migration Plan

**Branch:** `firebase-migration`
**Tag:** `pre-firebase-snapshot` (rollback point)
**Status:** Phase 0 complete — awaiting Phase 1 approval

## Confirmed Design Decisions

| Decision | Choice |
|---|---|
| 2FA / TOTP | Firebase MFA where supported; per-admin unique TOTP secrets (no shared secrets) |
| Email / SMTP | Keep existing custom SMTP via Cloud Functions + Nodemailer; credentials in Firestore config/smtp |
| Admin Dashboard | React.js SPA deployed to Firebase Hosting |
| Firebase Projects | Two projects: grov-staging and grov-production |
| Data Migration | Migrate ALL existing SQLite data; original database preserved until fully validated |

## Branch Strategy

- main: preserved with snapshot tag pre-firebase-snapshot
- firebase-migration: all migration work (this branch)
  - docs/firebase-migration/   <- all architecture documents
  - grov-firebase/             <- Cloud Functions + Firestore rules (NEW)
  - grov-admin/                <- React.js admin dashboard (NEW)
  - grov-app/                  <- minimum backend integration changes only

## Phase 0 — Git Safety COMPLETE

- Committed safety snapshot to main: ee44c5b
- Pushed snapshot to origin/main
- Created and pushed firebase-migration branch
- Tagged pre-firebase-snapshot on GitHub
- Working tree confirmed clean
