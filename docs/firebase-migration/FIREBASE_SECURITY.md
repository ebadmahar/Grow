# Grōv — Firebase Security Architecture

## Overview

Security is enforced at THREE independent layers:
1. Firestore Security Rules — what clients can read/write directly
2. Firebase Storage Security Rules — what files clients can access
3. Cloud Functions — server-side validation for all privileged mutations

NO security-sensitive operation relies solely on frontend checks.

## Firebase Custom Claims (Role System)

Set via Cloud Function updateUserRole() using admin.auth().setCustomUserClaims():
  {
    role: "volunteer" | "coordinator" | "admin",
    isAdmin: boolean,
    isCoordinator: boolean
  }

Claims are embedded in the Firebase ID token (JWT).
Cloud Functions verify claims via admin.auth().verifyIdToken(idToken).

## Admin 2FA — Non-Deferred Per-Admin TOTP Architecture

### Problem
The current Laravel codebase has a **hardcoded shared TOTP secret `JBSWY3DPEHPK3PXP`** in both `AuthController.php` and `AdminWebController.php`. Every admin shares the same key. This is a critical security vulnerability.

### Strict Requirement: Privileged-Account 2FA is NOT Deferred
Privileged-account 2FA is mandatory from Day 1 for all administrators and coordinators.

### Secure Design: Secrets Stored Exclusively in Google Secret Manager (NEVER in Firestore)
1. **Zero Plaintext/Encrypted Secrets in Firestore**:
   - `users/{uid}` contains only `totpEnabled: boolean` and `mfaEnrolled: boolean`.
   - The actual TOTP secret is **never stored as a field in Firestore** (neither plain nor encrypted).
2. **Secret Storage in Google Secret Manager**:
   - On admin/coordinator account provisioning, Cloud Function `setupAdminTotp()` generates a unique, cryptographically random base32 TOTP secret.
   - The secret is saved directly to Google Secret Manager at `projects/{projectId}/secrets/totp-secret-{adminUid}` with restrictive IAM bindings (accessible only by the Cloud Functions runtime service account).
   - Alternatively, when Firebase Identity Platform MFA is active, enrollment occurs directly within Identity Platform's secure credential store without touching application databases.
3. **Verification Flow**:
   - Admin logs in with email/password via Firebase Auth.
   - Client calls Cloud Function `verifyAdminTotp(code)`.
   - Function retrieves the secret from Google Secret Manager for the caller UID, validates the RFC 6238 TOTP time-step token, and mints an elevated session claim or completes authentication.
4. **Hardcoded Secret Retired**: The shared secret `JBSWY3DPEHPK3PXP` is completely removed and rejected.

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    function isAdmin() {
      return request.auth.token.isAdmin == true;
    }
    function isCoordinator() {
      return request.auth.token.isCoordinator == true || isAdmin();
    }

    // Users
    match /users/{uid} {
      allow read: if isAuthenticated() && (isOwner(uid) || isAdmin());
      // Users may only update non-privileged profile fields
      allow update: if isAuthenticated() && isOwner(uid)
        && !request.resource.data.diff(resource.data).affectedKeys()
           .hasAny(['role', 'isDeleted', 'totalPlanted', 'totalSeeded',
                    'totalPoints', 'monthlyPoints', 'activitiesCount',
                    'totpEnabled', 'mfaEnrolled', '_legacyId', '_legacyTable']);
      allow create, delete: if false; // Provisioned via Cloud Functions only

      // Bounded Device Subcollection for FCM tokens
      match /devices/{deviceId} {
        allow read, write: if isAuthenticated() && isOwner(uid);
      }
    }

    // Dedicated Verified Sites Collection for Map Rendering
    match /verifiedSites/{siteId} {
      allow read: if true;
      allow write: if false; // Updated exclusively via verifyActivity Cloud Function
    }

    // Activities — all writes via Cloud Functions (admin SDK)
    match /activities/{activityId} {
      allow read: if isAuthenticated();
      allow write: if false;
      match /photos/{photoId} {
        allow read: if isAuthenticated();
        allow write: if false;
      }
      match /monitoringRecords/{recordId} {
        allow read: if isAuthenticated();
        allow write: if false;
      }
    }

    // Species — public read, admin write only
    match /species/{speciesId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Community tasks — public read, writes via Cloud Functions
    match /communityTasks/{taskId} {
      allow read: if true;
      allow write: if false;
      match /participants/{participantId} {
        allow read: if isAuthenticated();
        allow write: if false;
      }
    }

    // Interests — public read, admin write
    match /interests/{interestId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Notifications — owner read only, isRead update only
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated()
        && resource.data.userId == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
      allow create, delete: if false;
    }

    // Reports — owner or admin read, user create, admin update
    match /reports/{reportId} {
      allow read: if isAuthenticated()
        && (resource.data.reporterId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() && request.resource.data.reporterId == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if false;
    }

    // Stats — public read, no client writes
    match /stats/{statId} {
      allow read: if true;
      allow write: if false;
    }

    // Leaderboard — public read, no client writes
    match /leaderboard/{period} {
      allow read: if true;
      allow write: if false;
    }

    // Config — admin only (SMTP metadata, AQI settings) — ZERO SECRETS STORED HERE
    match /config/{docId} {
      allow read, write: if isAdmin();
    }
    // Monthly goals public read (needed by mobile app home screen)
    match /config/monthlyGoals/{goalId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // User points — owner or admin read only
    match /userPoints/{pointId} {
      allow read: if isAuthenticated()
        && (resource.data.userId == request.auth.uid || isAdmin());
      allow write: if false;
    }
  }
}

## Firebase Storage Security Rules

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Avatar images — owner write, public read
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    // Activity evidence photos — uploaded by Cloud Function only
    match /activities/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }

    // Community task cover images — coordinator/admin via Cloud Function
    match /community-tasks/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }

    // Monitoring record photos — uploaded by Cloud Function only
    match /monitoring/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}

## App Check Configuration

Android: Play Integrity provider
iOS: App Attest provider
Development: Debug provider (never commit debug token)

App Check is enforced on:
- All Cloud Functions HTTPS endpoints
- Firestore (optional — enable after testing is stable)
- Firebase Storage

## Secrets Management

All sensitive values stored in Google Secret Manager, NOT in source code or Firestore:
  - SMTP passwords (noreply + security mailers)
  - TOTP encryption key (AES-256-GCM key for per-admin TOTP secrets)
  - Google Air Quality API key
  - Firebase service account key (local only, never committed)

Cloud Functions access secrets via Secret Manager at runtime:
  const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

## NEVER in source code or committed to Git
  - Firebase service account JSON
  - Google Secret Manager secrets
  - .env files with real credentials
  - Firestore rules in test mode (allow read, write: if true)
  - Production API keys

## Coordinator Self-Verification Prevention

Preserved from original Laravel logic:
  Cloud Function verifyActivity() checks:
    if (activity.userId === callerUid && !isAdmin) {
      throw new HttpsError('permission-denied',
        'Coordinators cannot verify their own activities.');
    }
