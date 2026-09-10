/**
 * Grōv Firestore Seeder Script
 * Idempotently seeds Firestore with:
 * - species catalogue
 * - interests catalogue
 * - verifiedSites (for viewport map exploration)
 * - config (monthlyGoals, non-secret smtp, aqiSettings)
 * - stats & leaderboard singletons (global, aqi, all_time, monthly, weekly)
 *
 * Usage:
 *   node scripts/seeds/seed_firestore.js [--emulator | --project <projectId>]
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const rootDir = path.resolve(__dirname, '../..');

// Load seed data files
const speciesData = JSON.parse(fs.readFileSync(path.join(rootDir, 'seeds/species.json'), 'utf8'));
const interestsData = JSON.parse(fs.readFileSync(path.join(rootDir, 'seeds/interests.json'), 'utf8'));
const verifiedSitesData = JSON.parse(fs.readFileSync(path.join(rootDir, 'seeds/verifiedSites.json'), 'utf8'));
const configData = JSON.parse(fs.readFileSync(path.join(rootDir, 'seeds/config.json'), 'utf8'));
const statsData = JSON.parse(fs.readFileSync(path.join(rootDir, 'seeds/stats.json'), 'utf8'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'grov-staging';
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

async function seed() {
  console.log('🌱 Starting Grōv Firestore Database Seeding...\n');

  // 1. Seed Species Collection
  console.log(`📦 Seeding species (${speciesData.length} entries)...`);
  const speciesBatch = db.batch();
  for (const item of speciesData) {
    const { id, ...data } = item;
    const ref = db.collection('species').doc(id);
    speciesBatch.set(ref, {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  await speciesBatch.commit();
  console.log('   ✅ Species catalogue seeded successfully.');

  // 2. Seed Interests Collection
  console.log(`📦 Seeding interests (${interestsData.length} entries)...`);
  const interestsBatch = db.batch();
  for (const item of interestsData) {
    const { id, ...data } = item;
    const ref = db.collection('interests').doc(id);
    interestsBatch.set(ref, {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  await interestsBatch.commit();
  console.log('   ✅ Interests catalogue seeded successfully.');

  // 3. Seed Verified Sites Collection
  console.log(`📦 Seeding verifiedSites (${verifiedSitesData.length} entries)...`);
  const sitesBatch = db.batch();
  for (const item of verifiedSitesData) {
    const { id, ...data } = item;
    const ref = db.collection('verifiedSites').doc(id);
    sitesBatch.set(ref, {
      ...data,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(data.createdAt)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(data.updatedAt)),
      lastActivityAt: admin.firestore.Timestamp.fromDate(new Date(data.lastActivityAt))
    }, { merge: true });
  }
  await sitesBatch.commit();
  console.log('   ✅ Verified sites seeded successfully.');

  // 4. Seed Config Documents
  console.log('📦 Seeding system configuration (non-secret)...');
  const configBatch = db.batch();

  // Monthly Goal (current & specific year-month)
  const currentGoal = configData.monthlyGoals.current;
  const goalYearMonth = `${currentGoal.year}-${String(currentGoal.month).padStart(2, '0')}`;
  
  const currentGoalRef = db.collection('config').doc('monthlyGoals').collection('history').doc(goalYearMonth);
  configBatch.set(currentGoalRef, {
    ...currentGoal,
    createdAt: admin.firestore.Timestamp.fromDate(new Date(currentGoal.createdAt))
  }, { merge: true });

  const activeGoalDocRef = db.collection('config').doc('monthlyGoals').collection('active').doc('current');
  configBatch.set(activeGoalDocRef, {
    ...currentGoal,
    createdAt: admin.firestore.Timestamp.fromDate(new Date(currentGoal.createdAt))
  }, { merge: true });

  // Direct document: config/monthlyGoals (used by direct queries)
  const legacyGoalRef = db.collection('config').doc(`monthlyGoals_${goalYearMonth}`);
  configBatch.set(legacyGoalRef, {
    ...currentGoal,
    createdAt: admin.firestore.Timestamp.fromDate(new Date(currentGoal.createdAt))
  }, { merge: true });

  // Non-secret SMTP configuration (passwords in Secret Manager)
  const smtpRef = db.collection('config').doc('smtp');
  configBatch.set(smtpRef, configData.smtp, { merge: true });

  // AQI configuration
  const aqiSettingsRef = db.collection('config').doc('aqiSettings');
  configBatch.set(aqiSettingsRef, configData.aqiSettings, { merge: true });

  await configBatch.commit();
  console.log('   ✅ System config documents seeded successfully.');

  // 5. Seed Pre-computed Statistics and Leaderboard Stubs
  console.log('📦 Seeding pre-computed statistics and leaderboard stubs...');
  const statsBatch = db.batch();

  const globalStatsRef = db.collection('stats').doc('global');
  statsBatch.set(globalStatsRef, {
    ...statsData.global,
    lastUpdated: admin.firestore.Timestamp.fromDate(new Date(statsData.global.lastUpdated))
  }, { merge: true });

  const aqiStatsRef = db.collection('stats').doc('aqi');
  statsBatch.set(aqiStatsRef, {
    ...statsData.aqi,
    lastUpdatedAt: admin.firestore.Timestamp.fromDate(new Date(statsData.aqi.lastUpdatedAt))
  }, { merge: true });

  for (const period of ['all_time', 'monthly', 'weekly']) {
    const lbRef = db.collection('leaderboard').doc(period);
    statsBatch.set(lbRef, {
      ...statsData.leaderboard[period],
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(statsData.leaderboard[period].updatedAt))
    }, { merge: true });
  }

  await statsBatch.commit();
  console.log('   ✅ Stats and leaderboard singletons seeded successfully.\n');

  console.log('🎉 Grōv Firestore seeding completed successfully!');
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  });
}

module.exports = { seed };
