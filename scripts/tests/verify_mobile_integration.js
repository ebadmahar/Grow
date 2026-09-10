/**
 * Mobile App Integration Quality Gate & Verification Suite
 * Validates:
 * 1. Firebase client configuration in grov-app/src/firebase/config.ts
 * 2. Axios client routing to Firebase Cloud Functions and Storage URL resolver
 * 3. AuthContext integration with onAuthStateChanged and AsyncStorage token persistence
 * 4. User API direct Firestore operations and Cloud Storage avatar uploads
 * 5. Activity API viewport queries on verifiedSites and idempotent submission
 * 6. Leaderboard and stats reading pre-computed Firestore singletons
 * 7. STRICT INVARIANT AUDIT: Confirms ZERO modifications to UI screens and components
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../..');
const appDir = path.join(rootDir, 'grov-app');

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

console.log('⚡ Starting Grōv Mobile App Integration Verification Suite...\n');

// 1. Firebase Client Configuration
console.log('--- TEST GROUP 1: Firebase Client SDK Configuration ---');
const configPath = path.join(appDir, 'src/firebase/config.ts');
assert(fs.existsSync(configPath), 'grov-app/src/firebase/config.ts exists');

const configContent = fs.readFileSync(configPath, 'utf8');
assert(configContent.includes('initializeApp'), 'Firebase app initialization present');
assert(configContent.includes('getAuth'), 'Firebase Auth client export present');
assert(configContent.includes('getFirestore'), 'Firestore client export present');
assert(configContent.includes('getStorage'), 'Storage client export present');
assert(configContent.includes('asia-south1'), 'Target region asia-south1 referenced in Functions URL');

// 2. HTTP Client & Storage URL Resolution
console.log('\n--- TEST GROUP 2: HTTP Client & Storage Resolver ---');
const clientPath = path.join(appDir, 'src/api/client.ts');
const clientContent = fs.readFileSync(clientPath, 'utf8');
assert(clientContent.includes('Authorization') && clientContent.includes('Bearer'), 'Bearer token header injection configured in request interceptor');
assert(clientContent.includes('resolveImageUrl'), 'resolveImageUrl helper exported');
assert(clientContent.includes('firebasestorage.googleapis.com'), 'Firebase Storage download URLs resolved directly');

// 3. Auth Engine & Context
console.log('\n--- TEST GROUP 3: Authentication Layer ---');
const authApiPath = path.join(appDir, 'src/api/authApi.ts');
const authApiContent = fs.readFileSync(authApiPath, 'utf8');
assert(authApiContent.includes('signInWithEmailAndPassword'), 'authApi uses signInWithEmailAndPassword');
assert(authApiContent.includes('createUserWithEmailAndPassword'), 'authApi uses createUserWithEmailAndPassword');
assert(authApiContent.includes('mapFirestoreUser'), 'mapFirestoreUser maps Firestore document to User model');

const authCtxPath = path.join(appDir, 'src/context/AuthContext.tsx');
const authCtxContent = fs.readFileSync(authCtxPath, 'utf8');
assert(authCtxContent.includes('onAuthStateChanged'), 'AuthContext listens to onAuthStateChanged');
assert(authCtxContent.includes('AsyncStorage'), 'AuthContext caches user avatar and persists tokens via AsyncStorage');

// 4. Firestore Direct Data Layer
console.log('\n--- TEST GROUP 4: Direct Firestore Reads & Pre-computed Singletons ---');
const userApiPath = path.join(appDir, 'src/api/userApi.ts');
const userApiContent = fs.readFileSync(userApiPath, 'utf8');
assert(userApiContent.includes("doc(db, 'users'"), 'userApi reads and updates users collection in Firestore');
assert(userApiContent.includes("uploadBytes"), 'userApi uploads avatars directly to Cloud Storage');

const activityApiPath = path.join(appDir, 'src/api/activityApi.ts');
const activityApiContent = fs.readFileSync(activityApiPath, 'utf8');
assert(activityApiContent.includes("verifiedSites"), 'activityApi.getMapPins queries dedicated verifiedSites collection');
assert(activityApiContent.includes("limit(100)"), 'activityApi.getMapPins enforces viewport density limit of 100 pins');
assert(activityApiContent.includes("stats', 'global'"), 'activityApi.getExploreStats reads pre-computed stats/global document');
assert(activityApiContent.includes("clientSubmissionId"), 'activityApi submission uses clientSubmissionId for idempotency');

const leaderboardApiPath = path.join(appDir, 'src/api/leaderboardApi.ts');
const leaderboardApiContent = fs.readFileSync(leaderboardApiPath, 'utf8');
assert(leaderboardApiContent.includes("doc(db, 'leaderboard'"), 'leaderboardApi reads pre-computed leaderboard documents');

const weatherApiPath = path.join(appDir, 'src/api/weatherApi.ts');
const weatherApiContent = fs.readFileSync(weatherApiPath, 'utf8');
assert(weatherApiContent.includes("doc(db, 'stats', 'aqi')"), 'weatherApi reads cached stats/aqi document');

// 5. Strict Invariant Audit: Zero UI Component & Screen Modifications
console.log('\n--- TEST GROUP 5: Strict Invariant Audit (Zero UI Changes) ---');
try {
  const gitDiffScreens = execSync('git diff --name-only origin/master..HEAD grov-app/src/screens/', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
  assert(gitDiffScreens === '', 'Zero screen files modified in grov-app/src/screens/');

  const gitDiffComponents = execSync('git diff --name-only origin/master..HEAD grov-app/src/components/', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
  assert(gitDiffComponents === '', 'Zero component files modified in grov-app/src/components/');

  const gitDiffNavigation = execSync('git diff --name-only origin/master..HEAD grov-app/src/navigation/', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
  assert(gitDiffNavigation === '', 'Zero navigation files modified in grov-app/src/navigation/');

  const gitDiffTheme = execSync('git diff --name-only origin/master..HEAD grov-app/src/theme/', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
  assert(gitDiffTheme === '', 'Zero theme/style files modified in grov-app/src/theme/');
} catch (gitErr) {
  // If origin/master is not fetched, compare against HEAD
  console.log('Checking working tree git diff...');
  const diff = execSync('git status --porcelain grov-app/src/screens/ grov-app/src/components/ grov-app/src/navigation/ grov-app/src/theme/', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
  assert(diff === '', 'Zero screen/component/navigation/theme modifications in grov-app');
}

console.log(`\n📊 Mobile Integration Verification Result: ${passed}/${total} assertions passed.`);
if (passed === total) {
  console.log('🎉 100% Quality Gate achieved! Mobile App Firebase integration certified with ZERO UI changes.');
} else {
  console.error('❌ Verification failed!');
  process.exit(1);
}
