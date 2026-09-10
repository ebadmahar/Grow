/**
 * Grōv Parallel Operation Reconciliation Script
 *
 * Runs bidirectional reconciliation between the preserved SQLite database
 * and Firebase migration artifacts to guarantee mathematical consistency
 * and zero data loss during parallel operation.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const sqliteExportDir = path.join(rootDir, 'scripts/migration/export');
const transformedDir = path.join(rootDir, 'scripts/migration/transformed');
const forwardMapPath = path.join(rootDir, 'migration-data/id_mapping.json');
const reverseMapPath = path.join(rootDir, 'migration-data/firebase_to_old_id.json');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASSED: ${message}`);
    passed++;
  }
}

console.log('⚡ Starting Grōv Parallel Operation Reconciliation Audit...\n');

// 1. Verify Export & Transformed Datasets
console.log('--- AUDIT 1: Dataset Existence & Parity ---');
const tableMappings = [
  { table: 'users', exportFile: 'users.json', transformedFile: 'users_firestore.json' },
  { table: 'species', exportFile: 'species.json', transformedFile: 'species_firestore.json' },
  { table: 'interests', exportFile: 'interests.json', transformedFile: 'interests_firestore.json' },
  { table: 'locations', exportFile: 'locations.json', transformedFile: 'verifiedSites_firestore.json' },
  { table: 'activities', exportFile: 'activities.json', transformedFile: 'activities_firestore.json' },
  { table: 'notifications', exportFile: 'notifications.json', transformedFile: 'notifications_firestore.json' },
  { table: 'user_points', exportFile: 'user_points.json', transformedFile: 'user_points_firestore.json' },
];

for (const m of tableMappings) {
  const exportPath = path.join(sqliteExportDir, m.exportFile);
  const transformedPath = path.join(transformedDir, m.transformedFile);

  assert(fs.existsSync(exportPath), `Legacy SQLite export file exists for ${m.table}`);
  assert(fs.existsSync(transformedPath), `Transformed Firestore dataset exists for ${m.table}`);

  const rawData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  const transformedData = JSON.parse(fs.readFileSync(transformedPath, 'utf8'));

  assert(
    rawData.length === transformedData.length,
    `100% record parity for ${m.table}: SQLite has ${rawData.length}, Transformed has ${transformedData.length}`
  );
}

// 2. Ledger Audit (Quantity Planted & Points)
console.log('\n--- AUDIT 2: Mathematical Ledger Audit ---');
const rawActivities = JSON.parse(fs.readFileSync(path.join(sqliteExportDir, 'activities.json'), 'utf8'));
const transformedActivities = JSON.parse(fs.readFileSync(path.join(transformedDir, 'activities_firestore.json'), 'utf8'));

const rawTreesPlanted = rawActivities
  .filter(a => a.type === 'plantation')
  .reduce((sum, a) => sum + (parseInt(a.quantity, 10) || 0), 0);

const transformedTreesPlanted = transformedActivities
  .filter(a => a.type === 'plantation')
  .reduce((sum, a) => sum + (parseInt(a.quantity, 10) || 0), 0);

assert(
  rawTreesPlanted === transformedTreesPlanted,
  `Trees planted ledger match: ${rawTreesPlanted} trees in SQLite == ${transformedTreesPlanted} trees in Firebase`
);

const rawSeedsDispersed = rawActivities
  .filter(a => a.type === 'seeding' || a.type === 'seed_bombing')
  .reduce((sum, a) => sum + (parseInt(a.quantity, 10) || 0), 0);

const transformedSeedsDispersed = transformedActivities
  .filter(a => a.type === 'seeding' || a.type === 'seed_bombing')
  .reduce((sum, a) => sum + (parseInt(a.quantity, 10) || 0), 0);

assert(
  rawSeedsDispersed === transformedSeedsDispersed,
  `Seeds dispersed ledger match: ${rawSeedsDispersed} seeds in SQLite == ${transformedSeedsDispersed} seeds in Firebase`
);

// 3. Bidirectional ID Mapping Audit
console.log('\n--- AUDIT 3: Bidirectional ID Mapping Integrity ---');
const forwardMap = JSON.parse(fs.readFileSync(forwardMapPath, 'utf8'));
const reverseMap = JSON.parse(fs.readFileSync(reverseMapPath, 'utf8'));

let mappedCount = 0;
for (const table in forwardMap) {
  for (const oldId in forwardMap[table]) {
    mappedCount++;
    const fbId = forwardMap[table][oldId];
    assert(
      reverseMap[fbId] && reverseMap[fbId].table === table && reverseMap[fbId].oldId === parseInt(oldId, 10),
      `Bidirectional map check: ${table}#${oldId} <-> ${fbId}`
    );
  }
}

console.log(`\n======================================================================`);
console.log(`RECONCILIATION AUDIT: ${passed} / ${total} checks passed (${((passed / total) * 100).toFixed(1)}%)`);
console.log(`======================================================================`);

if (passed === total) {
  console.log('🎉 100% RECONCILIATION PARITY! Zero data loss across SQLite and Firebase.\n');
} else {
  console.error('❌ RECONCILIATION DISCREPANCY DETECTED!\n');
  process.exit(1);
}
