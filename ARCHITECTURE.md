# Grōv Environmental Restoration Platform - System Architecture

Grōv is a production-ready, full-stack community environmental restoration platform consisting of a **Laravel 12 PHP REST API & Web Moderation Panel** (`grov-backend`) and a **Cross-Platform Expo React Native Mobile App** (`grov-app`).

---

## 1. System Overview & Technology Stack

```
                               ┌──────────────────────────────────────────────┐
                               │           React Native Mobile App            │
                               │          (Expo SDK 54 / React 19)            │
                               └──────────────────────┬───────────────────────┘
                                                      │ REST API (JSON)
                                                      ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                     Laravel 12 PHP Backend                                       │
 │                                                                                                  │
 │  ┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────────┐   ┌────────────────┐  │
 │  │ Sanctum Auth & 2FA   │   │  Dual SMTP Mailer    │   │ SQLite / MySQL  │   │ AQI & Weather  │  │
 │  │ (RFC 6238 Google OTP)│   │ (growgrov.org)       │   │ Database        │   │ Open-Meteo API │  │
 │  └──────────────────────┘   └──────────────────────┘   └─────────────────┘   └────────────────┘  │
 └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Technologies
- **Mobile Client (`grov-app`)**:
  - React Native `0.81.5`, React `19.1.0`, Expo SDK `54.0.0`
  - Navigation: `@react-navigation/native-stack` & `@react-navigation/bottom-tabs`
  - Maps: `react-native-maps` (Native map tile rendering)
  - Styling: Vanilla Custom Design System tokens (`src/theme/colors.ts`, `spacing.ts`, `typography.ts`)
  - Storage & Network: `@react-native-async-storage/async-storage`, `axios`
- **Backend API & Web Admin (`grov-backend`)**:
  - Framework: Laravel `12.x` / PHP `8.5`
  - Authentication: Laravel Sanctum Bearer tokens + Google Authenticator TOTP (`pragmarx/google2fa`)
  - Database: SQLite / MySQL with dynamic schema migrations & seeders
  - Mailers: Dual HTML Mailer configuration (`noreply@growgrov.org` & `security@growgrov.org`)

---

## 2. Security Architecture

### Authentication & 2FA
- **Sanctum Bearer Token**: Issued upon successful user login/registration and stored securely in `AsyncStorage`.
- **Google Authenticator (RFC 6238 TOTP)**:
  - Required for Admin/Coordinator roles.
  - Secret key generated on registration/setup. 6-digit TOTP codes are verified dynamically without hardcoded bypasses.
  - Login endpoint returns `requires_2fa: true` when TOTP code is required.

### Dual-SMTP System (`growgrov.org`)
- **Mailer 1 (`noreply@growgrov.org`)**: Dispatches onboarding, notifications, community drive updates, and newsletters via `MailService::sendNotificationEmail()`.
- **Mailer 2 (`security@growgrov.org`)**: Dispatches password resets, 2FA alerts, and security warnings via `MailService::sendSecurityEmail()`.
- Both mailers support dynamic Web Admin configuration (`/admin/dashboard`) and HTML Blade template rendering (`resources/views/emails/`).

---

## 3. Core Formulas & Business Logic

### CO₂ Offset Calculation Formula
The total Weekly CO₂ offset for verified tree planting activities is calculated using the strict scientific formula:

$$\text{Weekly CO}_2 = \frac{\text{Trees} \times \text{Annual CO}_2 \text{ per Tree} \times \text{Survival Rate} \times \text{Growth Factor}}{52}$$

- **Default Parameters**:
  - Annual CO₂ per Tree: `21.8 kg/year`
  - Survival Rate: `85% (0.85)`
  - Growth Factor: `1.2`

### Level & Role Promotion System
- **Volunteer**: Default role assigned upon registration.
- **Coordinator**: Users who have planted and verified **≥ 500 trees** trigger an automatic admin alert. Admins can promote volunteers to Coordinators via the Admin Dashboard.
- **Points & Leaderboard**: Points are awarded strictly for **verified** plantation/seeding activities (`status === 'verified'`).

---

## 4. API Endpoints Reference

### Public & Auth Routes (`/api/v1`)
- `POST /auth/register` - Create user account with optional location.
- `POST /auth/login` - Authenticate user credentials & optional 2FA OTP.
- `POST /auth/logout` - Revoke current access token.
- `POST /auth/forgot-password` - Dispatch password reset security email.
- `GET /ping` - Health check & server status.

### User & Profile Routes (`/api/v1/user`)
- `GET /profile` - Retrieve current authenticated user profile & cached stats.
- `PUT /profile` - Update user details (Name, Location, Bio, Avatar).
- `POST /profile/avatar` - Upload profile picture with local disk storage.
- `GET /leaderboard` - Retrieve global, weekly, and past-week rankings.

### Activity & Field Operations (`/api/v1/activities`)
- `GET /` - List all verified activities.
- `POST /` - Submit new tree plantation or seeding record with GPS location, species, count, and photos.
- `GET /{id}` - Retrieve activity details.
- `POST /{id}/observations` - Add monitoring observation (soil moisture, growth status, photos).

### Map & Environmental Data (`/api/v1/map`)
- `GET /pins` - Fetch map pins for all verified active restoration sites in Islamabad.
- `GET /stats` - Fetch cumulative verified trees planted, active sites, and total CO₂ offset.
- `GET /weather/aqi` - Retrieve real-time Air Quality Index (AQI) data for Islamabad.

### Admin Moderation & SMTP Management (`/api/v1/admin`)
- `GET /activities/pending` - List pending activities awaiting verification.
- `POST /activities/{id}/verify` - Approve or reject submitted restoration activities.
- `GET /smtp` - Retrieve Dual-SMTP credentials.
- `PUT /smtp` - Save Dual-SMTP configuration.
- `POST /smtp/test` - Send test HTML email via `noreply` or `security` mailer.

---

## 5. Repository File Structure

```
.
├── DESIGN.md                            # Comprehensive UI/UX Design System Specification
├── PRODUCT.md                           # Product Requirements Document & Feature Specs
├── ARCHITECTURE.md                      # Complete Technical Architecture (This Document)
├── PROJECT_INFO.md                      # AI Assistant Project Context File
│
├── grov-app/                            # Expo React Native Cross-Platform Application
│   ├── App.tsx                          # Root React Native Entrypoint & ErrorBoundary
│   ├── app.json                         # Expo app configuration (Cleartext traffic, splash, package)
│   ├── eas.json                         # Expo Application Services build profile configuration
│   ├── babel.config.js                  # Babel configuration with babel-preset-expo
│   └── src/
│       ├── api/                         # Axios client & domain API modules
│       │   ├── client.ts                # Axios instance, dynamic Base URL & error interceptors
│       │   ├── authApi.ts               # Auth endpoints (Login, Register, 2FA)
│       │   ├── activityApi.ts           # Activity endpoints (Plantation, Seeding, Map Pins)
│       │   ├── communityApi.ts          # Community Drive CRUD API
│       │   ├── userApi.ts               # Profile & Leaderboard API
│       │   └── weatherApi.ts            # AQI & Environmental Data API
│       ├── components/                  # UI Design System components
│       │   ├── common/                  # Buttons, Cards, Inputs, Headers, Badges, Modals
│       │   └── navigation/              # Custom Bottom Glass Dock Navigator
│       ├── context/                     # React Context (AuthContext with AsyncStorage caching)
│       ├── navigation/                  # Root Stack & Bottom Tab Navigators
│       ├── screens/                     # Application Screens
│       │   ├── auth/                    # Splash, Login, Register, Forgot Password
│       │   ├── home/                    # Home Dashboard (Live Map, Verified Stats, AQI)
│       │   ├── explore/                 # Interactive Site Map & Details
│       │   ├── activity/                # Logging Plantation/Seeding Activities
│       │   ├── community/               # Community Hub & Drive Details CRUD
│       │   ├── leaderboard/             # Leaderboard (All-Time, Weekly, Past Week)
│       │   ├── profile/                 # Profile & App Settings
│       │   └── admin/                   # Admin Moderation Dashboard
│       ├── theme/                       # Color tokens, typography & spacing
│       └── types/                       # TypeScript interfaces & API response contracts
│
└── grov-backend/                        # Laravel 12 PHP Backend REST API & Web Admin
    ├── app/
    │   ├── Http/Controllers/Api/        # API Controllers (Auth, Activity, Map, User, Admin)
    │   ├── Http/Controllers/Web/        # Admin Web Controllers
    │   ├── Models/                      # Eloquent Data Models (User, Activity, Goal, Location)
    │   └── Services/                    # MailService (Dual-SMTP HTML email dispatching)
    ├── config/                          # Laravel Configuration (mail.php, sanctum.php, cors.php)
    ├── database/                        # Database Migrations, Factories & Seeders
    ├── resources/views/                 # Blade Views (Admin Dashboard, HTML Email Templates)
    └── routes/                          # Route definitions (api.php, web.php)
```
