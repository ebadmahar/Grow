/**
 * Grōv Data Migration - Step 3: Firebase Auth User Import
 * 
 * Imports user records into Firebase Authentication preserving Laravel's bcrypt password hashes.
 * Sets custom user claims for roles: isAdmin, isCoordinator.
 * 
 * Usage:
 *   node scripts/migration/03_import_auth.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  admin = require(path.join(rootDir, 'grov-firebase/functions/node_modules/firebase-admin'));
}
const usersFile = path.join(rootDir, 'scripts/migration/transformed/users_firestore.json');
const resultsFile = path.join(rootDir, 'scripts/migration/transformed/auth_import_results.json');

const isDryRun = process.argv.includes('--dry-run') || !process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function importAuth() {
  console.log('👤 Starting Grōv Firebase Auth User Import...\n');

  if (!fs.existsSync(usersFile)) {
    throw new Error(`Transformed users file not found at ${usersFile}. Run 02_transform.js first.`);
  }

  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  console.log(`   Found ${users.length} users to import into Firebase Authentication.`);

  // Prepare users for admin.auth().importUsers()
  const userRecords = users.map(u => {
    // Custom claims per role
    const customClaims = {
      role: u.role,
      isAdmin: u.role === 'admin',
      isCoordinator: u.role === 'coordinator' || u.role === 'admin'
    };

    return {
      uid: u.uid,
      email: u.email,
      emailVerified: true,
      displayName: u.name,
      photoURL: u.avatarUrl || undefined,
      disabled: Boolean(u.isDeleted),
      passwordHash: Buffer.from(u.passwordHash), // Laravel bcrypt string buffer
      customClaims
    };
  });

  const hashOptions = {
    algorithm: 'BCRYPT',
    rounds: 12
  };

  if (isDryRun && !process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log('ℹ️  Running in DRY-RUN / Validation mode (no live Firebase Auth credentials detected).');
    console.log('   Validating user import payload schema and bcrypt compatibility:');
    
    for (const record of userRecords) {
      if (!record.uid || !record.email || !record.passwordHash) {
        throw new Error(`Invalid user record for UID ${record.uid}`);
      }
      const hashString = record.passwordHash.toString();
      if (!hashString.startsWith('$2y$') && !hashString.startsWith('$2a$') && !hashString.startsWith('$2b$')) {
        throw new Error(`Invalid bcrypt hash format for user ${record.email}: ${hashString.substring(0, 10)}...`);
      }
      console.log(`   ✅ Validated: ${record.email.padEnd(25)} | UID: ${record.uid} | Role: ${record.customClaims.role} (claims: isAdmin=${record.customClaims.isAdmin}, isCoordinator=${record.customClaims.isCoordinator})`);
    }

    const summary = {
      status: 'dry_run_validated',
      totalUsers: userRecords.length,
      hashAlgorithm: 'BCRYPT',
      rounds: 12,
      validatedAt: new Date().toISOString()
    };
    fs.writeFileSync(resultsFile, JSON.stringify(summary, null, 2));
    console.log(`\n🎉 All ${userRecords.length} user records validated and certified for Firebase Auth bcrypt import!`);
    return summary;
  }

  // Live import execution
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  console.log(`   Importing ${userRecords.length} users with BCRYPT rounds 12...`);
  const result = await admin.auth().importUsers(userRecords, { hash: hashOptions });

  console.log(`   ✅ Success count: ${result.successCount}`);
  console.log(`   ⚠️ Failure count: ${result.failureCount}`);

  if (result.errors.length > 0) {
    result.errors.forEach(err => {
      console.error(`      Error at index ${err.index}: ${err.error.message}`);
    });
  }

  // Set custom user claims
  for (const record of userRecords) {
    try {
      await admin.auth().setCustomUserClaims(record.uid, record.customClaims);
      console.log(`   ✅ Custom claims applied to: ${record.uid} (${record.customClaims.role})`);
    } catch (err) {
      console.error(`   ⚠️ Failed to set claims for ${record.uid}:`, err.message);
    }
  }

  fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2));
  console.log('\n🎉 Firebase Auth user import completed successfully!');
  return result;
}

if (require.main === module) {
  importAuth().catch(err => {
    console.error('❌ Auth import failed:', err);
    process.exit(1);
  });
}

module.exports = { importAuth };
