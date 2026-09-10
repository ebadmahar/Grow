# Grōv — Firebase Setup Guide (Manual Steps Required)

This document lists EVERY manual step required in the Firebase Console and Google Cloud Console.
Steps marked [YOU] require your action. Steps marked [AUTO] will be performed by scripts/CLI.

## Step 1 — Create Firebase Projects [YOU]

1.1. Go to https://console.firebase.google.com
1.2. Click "Create a project"
1.3. Project name: grov-staging
     Project ID: grov-staging (or grov-staging-[random])
1.4. Enable Google Analytics: Yes (recommended)
1.5. Repeat for production:
     Project name: grov-production
     Project ID: grov-production (or grov-prod-[random])

## Step 2 — Upgrade to Blaze Plan [YOU]

Required for: Cloud Functions with external HTTP calls (AQI fetch), Secret Manager

2.1. In each project: Settings -> Usage and billing -> Modify plan -> Blaze
2.2. Link a billing account
2.3. Set budget alert: $50/month (recommended to avoid surprises)

## Step 3 — Enable Firebase Authentication [YOU]

For BOTH projects:
3.1. Authentication -> Get started
3.2. Sign-in method -> Email/Password -> Enable
3.3. Sign-in method -> Email link (passwordless) -> Leave disabled
3.4. Settings -> User actions -> Enable "Email enumeration protection" (recommended)

For Admin TOTP — Identity Platform Upgrade (optional but recommended):
3.5. Authentication -> Settings -> Upgrade to Identity Platform
     (This enables Firebase built-in MFA/TOTP support)
     Note: This is a one-way upgrade. Recommended for production.

## Step 4 — Enable Firestore [YOU]

For BOTH projects:
4.1. Firestore Database -> Create database
4.2. Start in PRODUCTION mode (NOT test mode)
4.3. Select region: asia-south1 (Mumbai — closest to Islamabad)
4.4. Click "Enable"

## Step 5 — Enable Firebase Storage [YOU]

For BOTH projects:
5.1. Storage -> Get started
5.2. Start in PRODUCTION mode
5.3. Region: asia-south1 (must match Firestore)
5.4. Click "Done"

## Step 6 — Enable Firebase Cloud Messaging [YOU]

FCM is enabled by default — no action required.

## Step 7 — Add Android App [YOU]

For BOTH projects:
7.1. Project settings (gear icon) -> Your apps -> Add app -> Android
7.2. Android package name: (check grov-app/app.json -> android.package)
     Example: com.growgrov.grovapp
7.3. App nickname: Grov App (Staging) / Grov App (Production)
7.4. SHA-1 fingerprint:
     Run this command on your machine:
       keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
     Copy the SHA-1 value and paste it.
7.5. Download google-services.json
     Place in: grov-app/android/app/google-services.json
     (Two files — one from staging, one from production — keep separate)

## Step 8 — Add iOS App (if targeting iOS) [YOU]

8.1. Project settings -> Your apps -> Add app -> iOS
8.2. Bundle ID: (check grov-app/app.json -> ios.bundleIdentifier)
8.3. Download GoogleService-Info.plist
     Place in: grov-app/ios/
8.4. Configure APNs:
     - Apple Developer Console -> Certificates -> Keys -> Create new key
     - Enable Apple Push Notifications service (APNs)
     - Download the .p8 key file
     - Firebase Console -> Project settings -> Cloud Messaging -> APNs Authentication Key
     - Upload the .p8 file, enter Key ID and Team ID

## Step 9 — Enable App Check [YOU]

For BOTH projects:
9.1. App Check -> Get started
9.2. For Android: Register with Play Integrity
     (Requires app to be published in Play Console even as internal testing)
9.3. For iOS: Register with App Attest
9.4. For development: Add debug token
     (Firebase Console -> App Check -> Apps -> Overflow menu -> Manage debug tokens)
     Save the debug token — it will be needed in the app during development.

## Step 10 — Generate Service Account Keys [YOU]

For BOTH projects:
10.1. Project settings -> Service accounts
10.2. Click "Generate new private key"
10.3. Download the JSON file
10.4. IMPORTANT: Store securely. NEVER commit to Git.
      Staging: save as service-account-staging.json (local only)
      Production: save as service-account-production.json (local only)
10.5. Share with migration scripts via environment variable:
      $env:GOOGLE_APPLICATION_CREDENTIALS = "path\to\service-account-staging.json"

## Step 11 — Configure SHA Fingerprints [YOU]

Already covered in Step 7. For release builds:
11.1. Generate release keystore if not already done
11.2. Add release SHA-1 and SHA-256 to Firebase Android app settings

## Step 12 — Google Cloud Secret Manager [AUTO after project created]

After you provide Project IDs, I will:
- Enable Secret Manager API via gcloud CLI
- Create secrets: smtp-noreply-password, smtp-security-password, totp-encryption-key, google-aqi-key
- Grant Cloud Functions service account access to secrets

## Step 13 — Firebase Hosting for Admin Dashboard [AUTO]

After React.js admin dashboard is built:
- firebase target:apply hosting grov-admin grov-admin
- firebase deploy --only hosting:grov-admin

Custom domain (optional):
13.1. Firebase Console -> Hosting -> Add custom domain
13.2. Enter: admin.growgrov.org (or staging-admin.growgrov.org)
13.3. Verify domain ownership via DNS TXT record
13.4. Add CNAME/A records as shown

## Step 14 — Firebase CLI Setup [AUTO]

I will run these commands after you provide project IDs:
  npm install -g firebase-tools
  firebase login
  firebase use --add grov-staging
  firebase use --add grov-production

## Summary Checklist for You

[ ] Create grov-staging Firebase project
[ ] Create grov-production Firebase project
[ ] Upgrade both to Blaze plan
[ ] Enable Auth (Email/Password) on both
[ ] Upgrade to Identity Platform (recommended for MFA/TOTP)
[ ] Enable Firestore (asia-south1) on both
[ ] Enable Storage (asia-south1) on both
[ ] Add Android app to both, download google-services.json (x2)
[ ] Add iOS app to both (if iOS), download GoogleService-Info.plist (x2), configure APNs
[ ] Enable App Check on both
[ ] Generate service account keys for both (keep local, never commit)
[ ] Note down both Project IDs and share with me to proceed

That is everything I need from you to begin Phases 1-4.
