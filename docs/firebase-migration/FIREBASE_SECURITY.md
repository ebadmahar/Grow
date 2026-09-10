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

## Admin 2FA — TOTP Architecture

Problem: Current codebase uses a SINGLE hardcoded TOTP secret JBSWY3DPEHPK3PXP
shared across all admin accounts. This is a critical security vulnerability.

Solution:
1. On first admin login after migration, Cloud Function setupAdminTotp() generates
   a unique TOTP secret for that admin account using a cryptographically secure
   random base32 string.
2. The secret is encrypted using AES-256-GCM with a key stored in Google Secret Manager.
3. The encrypted secret is stored in users/{uid}.totpSecret.
4. A QR code is generated and displayed ONCE for the admin to scan into Google Authenticator.
5. On subsequent admin logins, Cloud Function verifyAdminTotp(code) decrypts the
   stored secret and validates the RFC 6238 TOTP code.
6. The existing JBSWY3DPEHPK3PXP hardcoded secret is retired and must not be used.

Note on Firebase MFA:
Firebase Authentication built-in MFA (phone/TOTP) is available on the Identity Platform
(Firebase upgrade). If the project is on Blaze + Identity Platform is enabled, this can
replace the custom TOTP implementation. Evaluate during Phase 1 project setup.
Recommended: implement custom TOTP first (works everywhere), migrate to Firebase MFA
built-in as a Phase 2 hardening step once the Identity Platform is confirmed.

## Firestore Security Rules

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
      // Users may only update non-privileged fields
      allow update: if isAuthenticated() && isOwner(uid)
        && !request.resource.data.diff(resource.data).affectedKeys()
           .hasAny(['role', 'isDeleted', 'totalPlanted', 'totalSeeded',
                    'totalPoints', 'monthlyPoints', 'activitiesCount', 'totpSecret']);
      allow create, delete: if false; // Cloud Functions only
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

    // Community tasks — public read, all writes via Cloud Functions
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
      allow create: if isAuthenticated();
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

    // Config — admin only (SMTP, monthly goals, AQI settings)
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
