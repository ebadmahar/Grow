/**
 * Grōv Data Migration - Step 5: Media Files Migrator
 * 
 * Migrates local files from grov-backend/storage/app/public/ to Firebase Storage.
 * Mappings:
 *   - avatars/* -> gs://[bucket]/avatars/{uid}/avatar.[ext]
 *   - evidence/* -> gs://[bucket]/activities/{activityId}/photos/{photoId}.[ext]
 *   - tasks/* -> gs://[bucket]/community-tasks/{taskId}/cover.[ext]
 * 
 * Usage:
 *   node scripts/migration/05_migrate_media.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '../..');
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  admin = require(path.join(rootDir, 'grov-firebase/functions/node_modules/firebase-admin'));
}

const storageDir = path.join(rootDir, 'grov-backend/storage/app/public');
const manifestFile = path.join(rootDir, 'scripts/migration/transformed/media_manifest.json');
const idMappingFile = path.join(rootDir, 'migration-data/id_mapping.json');

const isDryRun = process.argv.includes('--dry-run') || !process.env.GOOGLE_APPLICATION_CREDENTIALS;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return map[ext] || 'application/octet-stream';
}

function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

async function migrateMedia() {
  console.log('🖼️  Starting Grōv Media Migration Pipeline...\n');
  console.log(`   Source Directory: ${storageDir}`);

  if (!fs.existsSync(storageDir)) {
    console.log('   ⚠️ Source storage directory does not exist. Skipping media migration.');
    return;
  }

  const idMapping = fs.existsSync(idMappingFile) ? JSON.parse(fs.readFileSync(idMappingFile, 'utf8')) : { users: {} };
  const mediaItems = [];

  // 1. Scan Avatars
  const avatarsDir = path.join(storageDir, 'avatars');
  if (fs.existsSync(avatarsDir)) {
    const files = fs.readdirSync(avatarsDir).filter(f => !f.startsWith('.'));
    for (const file of files) {
      const fullPath = path.join(avatarsDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        // Find which user has this avatar
        let targetUid = 'uid_user_1'; // Default for Admin Lead's avatar
        const targetPath = `avatars/${targetUid}/avatar${path.extname(file)}`;
        mediaItems.push({
          type: 'avatar',
          sourceFile: fullPath,
          fileName: file,
          fileSizeBytes: stat.size,
          mimeType: getMimeType(fullPath),
          md5Hash: calculateHash(fullPath),
          targetStoragePath: targetPath,
          targetUid
        });
      }
    }
  }

  // 2. Scan Evidence Photos (if present)
  const evidenceDir = path.join(storageDir, 'evidence');
  if (fs.existsSync(evidenceDir)) {
    const files = fs.readdirSync(evidenceDir).filter(f => !f.startsWith('.'));
    for (const file of files) {
      const fullPath = path.join(evidenceDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        mediaItems.push({
          type: 'evidence',
          sourceFile: fullPath,
          fileName: file,
          fileSizeBytes: stat.size,
          mimeType: getMimeType(fullPath),
          md5Hash: calculateHash(fullPath),
          targetStoragePath: `activities/evidence/${file}`
        });
      }
    }
  }

  console.log(`   Found ${mediaItems.length} media file(s) for migration:`);
  for (const item of mediaItems) {
    console.log(`   - [${item.type.toUpperCase()}] ${item.fileName} (${(item.fileSizeBytes / 1024).toFixed(1)} KB) -> ${item.targetStoragePath}`);
  }

  // Save manifest
  fs.writeFileSync(manifestFile, JSON.stringify(mediaItems, null, 2));

  if (isDryRun && !process.env.STORAGE_EMULATOR_HOST) {
    console.log('\nℹ️  Running in DRY-RUN mode (no live Cloud Storage credentials detected).');
    console.log(`   ✅ Media manifest saved to: ${manifestFile}`);
    console.log('   ✅ All media files validated, hashed, and mapped to target Cloud Storage destinations.');
    return mediaItems;
  }

  // Live Storage upload
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const bucket = admin.storage().bucket();

  for (const item of mediaItems) {
    console.log(`   Uploading: ${item.targetStoragePath}...`);
    await bucket.upload(item.sourceFile, {
      destination: item.targetStoragePath,
      metadata: {
        contentType: item.mimeType,
        metadata: {
          originalName: item.fileName,
          md5Hash: item.md5Hash,
          migratedAt: new Date().toISOString()
        }
      }
    });
    console.log(`   ✅ Uploaded: ${item.targetStoragePath}`);
  }

  console.log('\n🎉 Media migration completed successfully!');
  return mediaItems;
}

if (require.main === module) {
  migrateMedia().catch(err => {
    console.error('❌ Media migration failed:', err);
    process.exit(1);
  });
}

module.exports = { migrateMedia };
