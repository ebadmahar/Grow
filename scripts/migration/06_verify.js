/**
 * Grōv Data Migration - Step 6: Comprehensive Migration Verification
 * 
 * Audits:
 * 1. Record Count Parity (SQLite vs Transformed Firestore vs Auth)
 * 2. 100% Bidirectional ID Mapping Integrity (id_mapping.json <-> firebase_to_old_id.json)
 * 3. Document-Level Legacy Traceability (_legacyId, _legacyTable, _migratedAt on 100% of records)
 * 4. Aggregated Metric Equality (Total trees planted and points audit)
 * 5. Field-by-Field Parity Spot-Checks
 * 
 * Usage:
 *   node scripts/migration/06_verify.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const exportDir = path.join(rootDir, 'scripts/migration/export');
const transformedDir = path.join(rootDir, 'scripts/migration/transformed');
const migrationDataDir = path.join(rootDir, 'migration-data');
const reportFile = path.join(transformedDir, 'verification_report.json');

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASSED: ${message}`);
    passedAssertions++;
  }
}

function loadJson(dir, name) {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function verifyMigration() {
  console.log('🔍 Starting Grōv Data Migration Comprehensive Verification...\n');

  // Load Source Exports
  const rawUsers = loadJson(exportDir, 'users.json') || [];
  const rawSpecies = loadJson(exportDir, 'species.json') || [];
  const rawInterests = loadJson(exportDir, 'interests.json') || [];
  const rawLocations = loadJson(exportDir, 'locations.json') || [];
  const rawActivities = loadJson(exportDir, 'activities.json') || [];
  const rawPlantations = loadJson(exportDir, 'plantation_activities.json') || [];
  const rawNotifications = loadJson(exportDir, 'notifications.json') || [];
  const rawPoints = loadJson(exportDir, 'user_points.json') || [];

  // Load Transformed Collections
  const tfUsers = loadJson(transformedDir, 'users_firestore.json') || [];
  const tfSpecies = loadJson(transformedDir, 'species_firestore.json') || [];
  const tfInterests = loadJson(transformedDir, 'interests_firestore.json') || [];
  const tfSites = loadJson(transformedDir, 'verifiedSites_firestore.json') || [];
  const tfActivities = loadJson(transformedDir, 'activities_firestore.json') || [];
  const tfNotifications = loadJson(transformedDir, 'notifications_firestore.json') || [];
  const tfPoints = loadJson(transformedDir, 'user_points_firestore.json') || [];

  // Load Master Mapping Tables
  const idMapping = loadJson(migrationDataDir, 'id_mapping.json');
  const reverseMapping = loadJson(migrationDataDir, 'firebase_to_old_id.json');

  console.log('--- TEST GROUP 1: Record Count Parity ---');
  assert(tfUsers.length === rawUsers.length, `Users count parity: SQLite (${rawUsers.length}) == Firestore (${tfUsers.length})`);
  assert(tfSpecies.length === rawSpecies.length, `Species count parity: SQLite (${rawSpecies.length}) == Firestore (${tfSpecies.length})`);
  assert(tfInterests.length === rawInterests.length, `Interests count parity: SQLite (${rawInterests.length}) == Firestore (${tfInterests.length})`);
  assert(tfSites.length === rawLocations.length, `Sites/Locations count parity: SQLite (${rawLocations.length}) == Firestore (${tfSites.length})`);
  assert(tfActivities.length === rawActivities.length, `Activities count parity: SQLite (${rawActivities.length}) == Firestore (${tfActivities.length})`);
  assert(tfNotifications.length === rawNotifications.length, `Notifications count parity: SQLite (${rawNotifications.length}) == Firestore (${tfNotifications.length})`);
  assert(tfPoints.length === rawPoints.length, `User points count parity: SQLite (${rawPoints.length}) == Firestore (${tfPoints.length})`);

  console.log('\n--- TEST GROUP 2: Bidirectional ID Mapping Integrity ---');
  assert(idMapping !== null && reverseMapping !== null, 'Both id_mapping.json and firebase_to_old_id.json exist in migration-data/');

  for (const [table, mapping] of Object.entries(idMapping)) {
    for (const [oldId, newId] of Object.entries(mapping)) {
      const reverseEntry = reverseMapping[newId];
      assert(
        reverseEntry !== undefined && reverseEntry.table === table && String(reverseEntry.oldId) === String(oldId),
        `Bidirectional resolution: [${table}] ${oldId} ➔ ${newId} ➔ [${reverseEntry ? reverseEntry.table : 'null'}] ${reverseEntry ? reverseEntry.oldId : 'null'}`
      );
    }
  }

  console.log('\n--- TEST GROUP 3: Document Traceability Metadata Audit ---');
  const allCollections = [
    { name: 'users', docs: tfUsers, idKey: 'uid' },
    { name: 'species', docs: tfSpecies, idKey: 'id' },
    { name: 'interests', docs: tfInterests, idKey: 'id' },
    { name: 'verifiedSites', docs: tfSites, idKey: 'siteId' },
    { name: 'activities', docs: tfActivities, idKey: 'activityId' },
    { name: 'notifications', docs: tfNotifications, idKey: 'id' },
    { name: 'userPoints', docs: tfPoints, idKey: 'id' }
  ];

  let totalDocsAudited = 0;
  for (const col of allCollections) {
    for (const doc of col.docs) {
      totalDocsAudited++;
      assert(
        doc._legacyId !== undefined && doc._legacyTable !== undefined && doc._migratedAt !== undefined,
        `Doc ${col.name}/${doc[col.idKey]} contains _legacyId (${doc._legacyId}), _legacyTable (${doc._legacyTable}), _migratedAt`
      );
    }
  }
  console.log(`   Audited traceability across ${totalDocsAudited} transformed documents.`);

  console.log('\n--- TEST GROUP 4: Data Equality & Aggregations ---');
  // Sum of verified planted trees
  const sqlVerifiedPlanted = rawPlantations
    .filter(p => {
      const parent = rawActivities.find(a => a.id === p.activity_id);
      return parent && parent.status === 'verified';
    })
    .reduce((sum, p) => sum + Number(p.quantity_planted || 0), 0);

  const firestoreVerifiedPlanted = tfActivities
    .filter(a => a.status === 'verified')
    .reduce((sum, a) => sum + Number(a.quantityPlanted || 0), 0);

  assert(
    sqlVerifiedPlanted === firestoreVerifiedPlanted,
    `Verified planted trees match: SQL (${sqlVerifiedPlanted}) == Firestore (${firestoreVerifiedPlanted})`
  );

  // Sum of points awarded
  const sqlPointsSum = rawPoints.reduce((sum, p) => sum + Number(p.points || 0), 0);
  const firestorePointsSum = tfPoints.reduce((sum, p) => sum + Number(p.points || 0), 0);
  assert(
    sqlPointsSum === firestorePointsSum,
    `Points ledger sum match: SQL (${sqlPointsSum}) == Firestore (${firestorePointsSum})`
  );

  // Spot-check Admin user
  const adminUser = tfUsers.find(u => u.uid === idMapping.users['1']);
  assert(adminUser.email === 'admin@grov.app', 'Admin user email preserved');
  assert(adminUser.role === 'admin', 'Admin user role preserved');
  assert(adminUser.totalPoints === 50, 'Admin user denormalized points match verified activity award (50 pts)');
  assert(adminUser.totalPlanted === 5, 'Admin user denormalized trees match verified activity quantity (5 trees)');

  // Spot-check Verified Activity 4
  const act4 = tfActivities.find(a => a.activityId === idMapping.activities['4']);
  assert(act4.status === 'verified', 'Activity 4 status is verified');
  assert(act4.speciesName === 'Ber', 'Activity 4 species denormalized to Ber');
  assert(act4.quantityPlanted === 5, 'Activity 4 quantity planted is 5');
  assert(act4.siteId === idMapping.locations['4'], 'Activity 4 siteId matches location 4 mapping');

  console.log(`\n📊 Migration Verification Summary: ${passedAssertions}/${totalAssertions} assertions passed.`);

  const report = {
    verifiedAt: new Date().toISOString(),
    totalAssertions,
    passedAssertions,
    status: passedAssertions === totalAssertions ? 'PASSED' : 'FAILED',
    summary: {
      totalSourceRecords: rawUsers.length + rawSpecies.length + rawInterests.length + rawLocations.length + rawActivities.length + rawNotifications.length + rawPoints.length,
      totalTransformedDocs: totalDocsAudited,
      bidirectionalMappings: Object.keys(reverseMapping).length
    }
  };

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`📄 Report written to: ${reportFile}`);

  if (passedAssertions === totalAssertions) {
    console.log('🎉 Migration Verification PASSED with 100% parity and zero discrepancies!');
  } else {
    console.error('❌ Migration Verification FAILED! Review errors above.');
    process.exit(1);
  }
}

if (require.main === module) {
  verifyMigration();
}

module.exports = { verifyMigration };
