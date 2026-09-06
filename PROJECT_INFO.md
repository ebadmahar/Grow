# Grōv Platform - Comprehensive AI Context & Project Information

This file serves as the definitive reference document for AI assistants working on the **Grōv Environmental Restoration Platform**.

---

## 1. Executive Summary

Grōv is a production-grade, full-stack community tree planting and environmental restoration platform. Users can log tree planting and seeding activities with GPS coordinates, photos, and notes; track live Air Quality Index (AQI) data in Islamabad; calculate verified CO₂ offsets using scientific formulas; participate in community drives; compete on all-time and weekly leaderboards; and manage account security via Google Authenticator 2FA.

Admins and Coordinators can review, approve, reject, or manage community restoration drives and verify submitted tree planting activities.

---

## 2. AI Assistant Prompt Summary

> **Copy-paste this text when introducing this project to another AI model:**
>
> "This repository contains the full-stack codebase for **Grōv**, a community environmental restoration platform.
> It includes:
> 1. `grov-app/`: Cross-platform Expo React Native application (`React 19`, `React Native 0.81.5`, `Expo SDK 54`, `TypeScript`, `react-native-maps`).
> 2. `grov-backend/`: Laravel 12 PHP REST API and Web Moderation Dashboard (`PHP 8.5`, Sanctum Auth, RFC 6238 Google 2FA, Dual-SMTP with `growgrov.org`).
>
> **Core Guidelines & Architectural Rules:**
> - **Zero Falsy/Mock Data**: All dashboard statistics (Trees Planted, Active Sites, CO₂ Offset, Points) are derived strictly from database queries where `status === 'verified'`. Default values for empty states are `0`.
> - **Strict 2FA Security**: Admin and Coordinator logins strictly require 6-digit Google Authenticator TOTP codes. Hardcoded bypasses (like `123456`) are strictly forbidden.
> - **Dual-SMTP Mailers**: Onboarding/newsletters use `noreply@growgrov.org`. Security/password resets use `security@growgrov.org`.
> - **CO₂ Offset Formula**: `Weekly CO₂ = (Trees × Annual CO₂ per Tree × Survival Rate × Growth Factor) / 52` (Default Annual CO₂: 21.8 kg, Survival Rate: 0.85, Growth Factor: 1.2).
> - **Network & Permissions**: Mobile app uses `http://192.168.1.10:8000/api/v1` (with dynamic Server IP modal on Login screen) and requires `android:usesCleartextTraffic="true"` and `@xml/network_security_config`. Map markers must use explicit numeric `Number(lat)` and `Number(lng)` parsing."

---

## 3. Core Features & Functional Requirements

### A. Authentication & User Profile
- **Registration**: Allows signing up with Name, Email, Password, Location, and mandatory Terms & Conditions checkbox with Modal viewer.
- **Role Progression**: Users start as `volunteer`. Upon planting and verifying **500 trees**, an notification is sent to the Admin panel to promote them to `coordinator`.
- **Profile Picture Caching**: Avatars are cached locally using `AsyncStorage` to avoid fetching the image on every app boot.
- **Profile Details Update**: Users can edit Name, Location, Bio, and Avatar via the App Settings screen.

### B. Activity Logging & Verification
- **Plantation & Seeding Logging**: Form requires tree species, site name, count, planting method, notes, and photos.
- **Moderation Workflow**:
  - `pending`: Submitted activity awaiting verification.
  - `verified`: Approved activity. Updates points, leaderboard, active sites, and total CO₂ offset.
  - `rejected`: Rejected activity. Moves to the rejected tab; users can view but cannot edit or add observations.

### C. Live Maps & Environmental Stats
- **Home Dashboard Map**: Interactive `MapView` rendering pins for all active verified restoration sites in Islamabad.
- **Live AQI**: Real-time Islamabad Air Quality Index display without "Poor" or "Extremely Poor" text labels (shows numeric value).
- **Lifetime Data Display**: Cumulative stats (Trees Planted, CO₂ Offset, Active Field Sites) show total data since Day 1.

### D. Leaderboards & Community Drives
- **Leaderboard Views**: Supports All-Time, Weekly, and Past-Week leaderboard filters with rank badges.
- **Community Drive CRUD**: Admins can Create, Read, Update, and Delete any community drive. Coordinators can edit or delete their own created drives.

---

## 4. Environment Setup & Development Commands

### Backend (`grov-backend`)
```bash
cd grov-backend

# Install dependencies
composer install

# Environment & Migrations
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed

# Run Laravel Backend listening on all network interfaces
php artisan serve --host=0.0.0.0 --port=8000
```

### Mobile App (`grov-app`)
```bash
cd grov-app

# Install dependencies
npm install

# Typecheck codebase
npx tsc --noEmit

# Test local Metro bundling for Android
npx expo export --platform android

# Start Expo Metro server for Expo Go testing
npx expo start --clear

# Build local Android APK via Gradle
cd android
export JAVA_HOME=/home/ebad-mahar/.android-toolchain/jdk-17
export ANDROID_HOME=/home/ebad-mahar/.android-toolchain/android-sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
./gradlew assembleRelease
```

---

## 5. Summary Matrix of User Roles & Permissions

| Feature / Action                     | Volunteer | Coordinator | Admin |
|--------------------------------------|-----------|-------------|-------|
| Log Tree Plantation / Seeding        | ✅        | ✅          | ✅    |
| View Public Leaderboard & AQI        | ✅        | ✅          | ✅    |
| Edit Own Profile & Avatar            | ✅        | ✅          | ✅    |
| Create Community Drives              | ❌        | ✅          | ✅    |
| Edit / Delete Own Community Drives   | ❌        | ✅          | ✅    |
| Edit / Delete ALL Community Drives   | ❌        | ❌          | ✅    |
| Approve / Reject Pending Activities  | ❌        | ❌          | ✅    |
| Promote Volunteer to Coordinator     | ❌        | ❌          | ✅    |
| Configure Dual-SMTP Credentials      | ❌        | ❌          | ✅    |
