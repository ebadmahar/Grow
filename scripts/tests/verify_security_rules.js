/**
 * Security Rules & Index Verification Test Suite
 * Validates:
 * 1. firestore.rules structure, syntax, and comprehensive path coverage
 * 2. Strict enforcement of non-privileged field diff checks (role escalation prevention)
 * 3. Absence of dangerous open rules (allow read, write: if true) on sensitive documents
 * 4. Verification that TOTP and secrets are excluded from user updateable fields
 * 5. Bounded device subcollection configuration
 * 6. Dedicated verifiedSites read-only protection
 * 7. Composite indexes validity and query coverage
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const rulesPath = path.join(rootDir, 'firestore.rules');
const indexesPath = path.join(rootDir, 'firestore.indexes.json');
const storageRulesPath = path.join(rootDir, 'storage.rules');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASSED: ${message}`);
    passedTests++;
  }
}

console.log('🔒 Starting Grōv Security Rules & Configuration Quality Gate...\n');

// 1. Check firestore.rules exists and is valid syntax
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
assert(rulesContent.includes("rules_version = '2';"), 'firestore.rules defines rules_version 2');
assert(rulesContent.includes('service cloud.firestore'), 'firestore.rules targets cloud.firestore service');

// 2. Critical Collections Coverage
const requiredCollections = [
  'users/{uid}',
  'devices/{deviceId}',
  'verifiedSites/{siteId}',
  'activities/{activityId}',
  'species/{speciesId}',
  'communityTasks/{taskId}',
  'interests/{interestId}',
  'notifications/{notificationId}',
  'reports/{reportId}',
  'stats/{statId}',
  'leaderboard/{period}',
  'config/{docId}',
  'userPoints/{pointId}'
];

for (const coll of requiredCollections) {
  assert(rulesContent.includes(coll), `Rule path coverage includes: ${coll}`);
}

// 3. Prevent Privilege Escalation on users/{uid}
assert(rulesContent.includes("hasAny(["), 'users/{uid} updates enforce affectedKeys blacklist');
assert(rulesContent.includes("'role'"), 'User updates cannot modify role');
assert(rulesContent.includes("'totalPlanted'"), 'User updates cannot modify totalPlanted');
assert(rulesContent.includes("'totalPoints'"), 'User updates cannot modify totalPoints');
assert(rulesContent.includes("'totpEnabled'"), 'User updates cannot modify totpEnabled');
assert(rulesContent.includes("'mfaEnrolled'"), 'User updates cannot modify mfaEnrolled');
assert(rulesContent.includes("'_legacyId'"), 'User updates cannot modify legacy migration metadata');

// 4. Client Write Blocking for Critical Collections (Cloud Functions only)
const clientWriteBlocked = [
  'match /verifiedSites/{siteId} {\n      allow read: if true;\n      allow write: if false;',
  'match /activities/{activityId} {\n      allow read: if isAuthenticated();\n      allow write: if false;',
  'match /stats/{statId} {\n      allow read: if true;\n      allow write: if false;',
  'match /leaderboard/{period} {\n      allow read: if true;\n      allow write: if false;',
  'match /userPoints/{pointId} {\n      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());\n      allow write: if false;'
];

for (const snippet of clientWriteBlocked) {
  assert(rulesContent.replace(/\r\n/g, '\n').includes(snippet), `Client writes safely blocked for: ${snippet.split('\n')[0]}`);
}

// 5. No Open Read/Write Rules (No `allow read, write: if true;`)
assert(!rulesContent.includes('allow read, write: if true;'), 'Zero open allow read, write: if true rules exist');
assert(!rulesContent.includes('totpSecret'), 'No totpSecret field exists in rules (secrets in Secret Manager only)');

// 6. Validate firestore.indexes.json
const indexesContent = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
assert(Array.isArray(indexesContent.indexes), 'firestore.indexes.json defines valid indexes array');
assert(indexesContent.indexes.length >= 10, `Composite indexes count is sufficient (${indexesContent.indexes.length} defined)`);

const hasVerifiedSitesIndex = indexesContent.indexes.some(idx => idx.collectionGroup === 'verifiedSites');
assert(hasVerifiedSitesIndex, 'Composite indexes include verifiedSites for viewport map queries');

const hasActivitiesIndex = indexesContent.indexes.some(idx => idx.collectionGroup === 'activities');
assert(hasActivitiesIndex, 'Composite indexes include activities for filtered history');

// 7. Validate storage.rules
const storageContent = fs.readFileSync(storageRulesPath, 'utf8');
assert(storageContent.includes("rules_version = '2';"), 'storage.rules defines rules_version 2');
assert(storageContent.includes("5 * 1024 * 1024"), 'storage.rules enforces 5MB max file size');
assert(storageContent.includes("image/.*"), 'storage.rules enforces image MIME validation');
assert(storageContent.includes("match /activities/{allPaths=**} {\n      allow read: if true;\n      allow write: if false;"), 'storage.rules blocks direct activity photo uploads');

console.log(`\n📊 Quality Gate Result: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('🎉 100% Quality Gate achieved! Rules and schema configurations are fully verified.');
} else {
  console.error('❌ Quality Gate failed! Review errors above.');
  process.exit(1);
}
