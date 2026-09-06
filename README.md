# Grōv - Community Environmental Restoration Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Framework: Laravel 12](https://img.shields.io/badge/Laravel-12.x-red.svg)](https://laravel.com)
[![Framework: Expo React Native](https://img.shields.io/badge/Expo-SDK_54-blue.svg)](https://expo.dev)

Grōv is a production-ready, full-stack community environmental restoration platform. Users can log tree planting and seeding activities with GPS coordinates, photos, and notes; track live Air Quality Index (AQI) data in Islamabad; calculate verified CO₂ offsets using scientific formulas; participate in community drives; compete on leaderboards; and manage account security via Google Authenticator 2FA.

---

## 🌟 Key Features

- 🌳 **Verified Activity Logging**: Track tree plantations and seedings with GPS location tag, photos, species selection, and notes.
- 🗺️ **Live Islamabad Restoration Map**: Interactive native `MapView` displaying all active, verified restoration field sites.
- 💨 **Real-Time Air Quality Index (AQI)**: Clean AQI data integration for Islamabad.
- 🧪 **Scientific CO₂ Offset Calculation**: Weekly CO₂ absorption calculation using `(Trees × Annual CO₂ per Tree × Survival Rate × Growth Factor) / 52`.
- 🔐 **Google Authenticator 2FA**: Strict RFC 6238 TOTP verification for Admin and Coordinator role actions.
- 📧 **Dual-SMTP Email System**: Dedicated HTML mailers (`noreply@growgrov.org` for onboarding/updates, `security@growgrov.org` for 2FA/resets).
- 🏆 **Gamified Leaderboard**: Filter by All-Time, Weekly, and Past Week with rank badges.
- 🛡️ **Role Moderation Matrix**: Volunteer, Coordinator (>=500 verified trees alert), and Admin controls.

---

## 🛠️ Tech Stack

- **Mobile Application (`grov-app`)**:
  - React Native 0.81.5 / React 19 / Expo SDK 54 / TypeScript
  - `react-native-maps`, `@react-navigation/native`, `axios`, `AsyncStorage`
  - Network Security Config + Dynamic Server IP Settings Modal
- **Backend API & Admin Panel (`grov-backend`)**:
  - Laravel 12.x / PHP 8.5 / Laravel Sanctum
  - Pragmarx Google2FA TOTP / Custom Dual-SMTP HTML Mailer Service
  - SQLite / MySQL with migrations & seeders

---

## 📁 Repository Structure

```
.
├── grov-app/          # Expo React Native Cross-Platform App
├── grov-backend/      # Laravel 12 PHP Backend REST API & Admin Panel
├── html_prototype/    # Prototype UI Templates
├── ARCHITECTURE.md    # Full Technical Architecture & API Documentation
├── PROJECT_INFO.md    # AI Context & Prompt Guide
├── DESIGN.md          # Design System Specs
└── PRODUCT.md         # Product Requirements
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd grov-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Mobile App Setup
```bash
cd grov-app
npm install
npm start
```
- Open **Expo Go** on your Android/iOS device and scan the QR code.
- Tap **⚙️ Server IP** on the login screen if you need to adjust your local machine's IP address (`http://192.168.1.10:8000/api/v1`).

---

## 📄 Documentation & AI Guides

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for full database schemas, security flows, and API specs.
- Read [PROJECT_INFO.md](PROJECT_INFO.md) for AI assistant context prompts and role access matrices.
