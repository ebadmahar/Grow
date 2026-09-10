# Grōv — Production Cutover & Parallel Operation Runbook

> **Target Project**: `grov-production` (GCP Region: `asia-south1` Mumbai)  
> **Target Scale**: 25,000+ Concurrent Virtual Users  
> **Rollback Safety Baseline**: `grov-backend/` and `grov-backend/database/database.sqlite` (Untouched & Preserved)  
> **Client Invariant**: React Native UI **100% untouched** (0 modifications to screens, components, styles, or navigation)  

---

## 1. Executive Overview & Principles

This runbook defines the operational execution steps for cutting over the Grōv application backend from PHP 8.2 / Laravel 12 / SQLite to Google Firebase (`grov-production`).

### Three Core Invariants:
1. **Permanent Baseline Preservation**: The Laravel codebase (`grov-backend/`) and original SQLite database (`grov-backend/database/database.sqlite`) will **never be deleted or altered**. They remain running in parallel as the reference implementation and instant rollback safety net.
2. **Zero Mobile UI Changes**: All mobile client updates are strictly restricted to API and Auth context layers (`src/api/`, `src/context/AuthContext.tsx`).
3. **Secret Manager Decoupling**: Zero passwords or TOTP secrets exist in Firestore. All privileged-account credentials reside strictly in Google Secret Manager.

---

## 2. Pre-Cutover Checklist (T-48h to T-1h)

| Check | Item | Verification Command / URL | Owner |
|---|---|---|---|
| [x] | **Firebase Project Provisioning** | Project `grov-production` exists on Blaze Plan | Firebase Console | Ops |
| [x] | **Google Secret Manager Enabled** | Secret Manager API enabled in `grov-production` | `gcloud services list` | Security |
| [x] | **Admin TOTP Secrets Seeded** | Unique secrets created in Secret Manager | `gcloud secrets list` | Security |
| [x] | **SMTP Passwords Stored** | `grov-smtp-noreply-password` stored in Secret Manager | `gcloud secrets list` | Ops |
| [x] | **Firestore Indexes Built** | 12 composite indexes built in `grov-production` | `firebase deploy --only firestore:indexes` | Backend |
| [x] | **Load Testing Certification** | 21/21 SLA quality gates certified at 25K VUs | [LOAD_TEST_RESULTS_25K.md](file:///c:/Users/Ebad/Desktop/Grow%20Grov/docs/firebase-migration/LOAD_TEST_RESULTS_25K.md) | QA |
| [x] | **E2E Regression Suite** | 68/68 full system regression assertions passed | `node scripts/tests/verify_full_system_regression.js` | QA |

---

## 3. Step-by-Step Cutover Execution Sequence (T-0 to T+60m)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRODUCTION CUTOVER TIMELINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ T-00m: Read-only maintenance mode activated on legacy Laravel               │
│ T-05m: Final SQLite export & transform pipeline executed                    │
│ T-15m: Production Firestore & Auth data import executed                     │
│ T-25m: Parallel reconciliation audit (100% parity verified)                 │
│ T-30m: Cloud Functions & Security Rules deployed to grov-production         │
│ T-35m: React.js Admin SPA deployed to Firebase Hosting                      │
│ T-45m: Automated health checks & ping audit executed                        │
│ T-50m: Mobile app client pointed to grov-production via EAS OTA update      │
│ T-60m: Post-cutover monitoring & parallel observation window begins         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Read-Only Maintenance Lock (T-00m)
Put Laravel backend in maintenance mode to ensure zero in-flight writes:
```bash
php grov-backend/artisan down --message="Grōv scheduled platform upgrade in progress"
```

### Step 2: Final SQLite Data Export & Transformation (T-05m)
```bash
python scripts/migration/01_export_sqlite.py
node scripts/migration/02_transform.js
```

### Step 3: Production Import Pipeline (T-15m)
```bash
node scripts/migration/03_import_auth.js --project grov-production
node scripts/migration/04_import_firestore.js --project grov-production
node scripts/migration/05_migrate_media.js --project grov-production
```

### Step 4: Parallel Reconciliation Audit (T-25m)
Verify 100% record parity and ledger equality:
```bash
node scripts/deployment/parallel_reconciliation.js
```

### Step 5: Service Deployment (T-30m)
Compile and deploy Cloud Functions, Security Rules, Indexes, and Admin SPA:
```bash
node scripts/deployment/deploy_production.js
```

### Step 6: Cutover Health & Smoke Validation (T-45m)
Run the automated production validation suite:
```bash
node scripts/deployment/cutover_validation.js
```

### Step 7: Mobile App Client Release (T-50m)
Deploy the mobile app client update pointing to `grov-production`:
```bash
# EAS Update for instant OTA delivery
cd grov-app
npx eas-cli update --branch production --message "Grōv Firebase backend cutover"
```

---

## 4. Parallel Operation & Dual-Stack Monitoring Protocol (Days 1 to 30)

During the first 30 days post-cutover:
1. **The Laravel backend (`grov-backend/`) and SQLite database remain fully preserved and available.**
2. **Reconciliation Cron**:
   Run `node scripts/deployment/parallel_reconciliation.js` every 24 hours to ensure continuous ledger agreement.
3. **Performance Monitoring**:
   - Google Cloud Monitoring: Cloud Functions execution latency (P50 < 350ms, P95 < 1500ms).
   - Firebase Performance Monitoring: Direct Firestore read latency (P50 < 100ms).
   - Firebase Crashlytics: Target $\ge$ 99.9% crash-free mobile sessions.

---

## 5. Emergency Rollback Playbook (< 15-Minute Recovery SLA)

If a critical issue occurs (data loss > 1%, Cloud Function 5xx > 0.05%, or unhandled contention), immediately execute rollback:

### Rollback Step 1: Execute Emergency Rollback Script
```bash
node scripts/migration/rollback_firebase.js --confirm-rollback
```

### Rollback Step 2: Instant Mobile App Reversion
1. In `grov-app/src/api/client.ts`, revert base URL to Laravel gateway (`http://api.grov.pk/api`).
2. Release instant OTA rollback patch:
   ```bash
   cd grov-app
   npx eas-cli update --branch production --message "Emergency Rollback to Laravel"
   ```
3. Bring Laravel backend back up:
   ```bash
   php grov-backend/artisan up
   ```

### Rollback SLA Guarantee:
- **Mobile traffic restored to Laravel**: $\le$ 15 minutes.
- **Database loss**: 0 records (original SQLite was never modified).

---

## 6. Incident Escalation & Operational Contacts

| Role | Responsibility | Primary Channel |
|---|---|---|
| **Incident Commander** | Cutover Go/No-Go decision | War Room Discord / Slack |
| **Backend Lead** | Cloud Functions & Firestore health | PagerDuty |
| **Security Officer** | Secret Manager & 2FA audits | Security Hotline |
| **Mobile Lead** | EAS OTA updates & Crashlytics | Mobile Ops Channel |
