/**
 * Grōv Data Migration - Step 2: Schema Transformation & Bidirectional ID Mapping
 * 
 * Transforms SQLite exported JSON into Firestore document structures.
 * Generates:
 *   - migration-data/id_mapping.json (SQLite ID -> Firestore ID)
 *   - migration-data/firebase_to_old_id.json (Firestore ID -> SQLite ID)
 *   - scripts/migration/transformed/*.json (Firestore collection payloads)
 * 
 * Injects _legacyId, _legacyTable, and _migratedAt into all migrated documents.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const exportDir = path.join(rootDir, 'scripts/migration/export');
const transformedDir = path.join(rootDir, 'scripts/migration/transformed');
const migrationDataDir = path.join(rootDir, 'migration-data');

osEnsureDir(transformedDir);
osEnsureDir(migrationDataDir);

function osEnsureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readExport(tableName) {
  const file = path.join(exportDir, `${tableName}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Simple Geohash encoder
function encodeGeohash(latitude, longitude, precision = 6) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latMin = -90.0, latMax = 90.0;
  let lonMin = -180.0, lonMax = 180.0;
  let geohash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    let mid;
    if (isEven) {
      mid = (lonMin + lonMax) / 2;
      if (longitude >= mid) {
        ch |= (1 << (4 - bit));
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        ch |= (1 << (4 - bit));
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return geohash;
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function transform() {
  console.log('🔄 Starting Grōv Data Transformation & Mapping...\n');
  const migratedAt = new Date().toISOString();

  // Load exports
  const rawUsers = readExport('users');
  const rawInterests = readExport('interests');
  const rawUserInterests = readExport('user_interests');
  const rawSpecies = readExport('species');
  const rawLocations = readExport('locations');
  const rawActivities = readExport('activities');
  const rawPlantations = readExport('plantation_activities');
  const rawSeedings = readExport('seeding_activities');
  const rawGoals = readExport('community_goals');
  const rawNotifications = readExport('notifications');
  const rawPoints = readExport('user_points');

  // Master bidirectional ID maps
  const idMapping = {
    users: {},
    species: {},
    interests: {},
    locations: {},
    activities: {},
    community_goals: {},
    notifications: {},
    user_points: {}
  };

  const reverseMapping = {};

  function registerMapping(table, oldId, newId) {
    idMapping[table][String(oldId)] = newId;
    reverseMapping[newId] = {
      table,
      oldId: Number(oldId)
    };
  }

  // 1. Transform Interests
  console.log('📦 Transforming interests...');
  const transformedInterests = rawInterests.map(item => {
    const newId = slugify(item.name);
    registerMapping('interests', item.id, newId);
    return {
      id: newId,
      name: item.name,
      order: item.id,
      _legacyId: item.id,
      _legacyTable: 'interests',
      _migratedAt: migratedAt
    };
  });

  // 2. Transform Species
  console.log('📦 Transforming species...');
  const transformedSpecies = rawSpecies.map(item => {
    const newId = slugify(item.common_name);
    registerMapping('species', item.id, newId);
    return {
      id: newId,
      commonName: item.common_name,
      scientificName: item.scientific_name,
      localName: item.local_name,
      type: item.category === 'mangrove' ? 'Shrub' : 'Tree',
      category: item.category,
      nativeRegion: item.suitable_zones,
      description: item.basic_description,
      guidance: item.basic_guidance,
      isNative: Boolean(item.is_native),
      isActive: Boolean(item.is_active),
      order: item.id,
      _legacyId: item.id,
      _legacyTable: 'species',
      _migratedAt: migratedAt
    };
  });

  // 3. Transform Users & Link Interests
  console.log('📦 Transforming users...');
  // Group interests per user
  const userInterestsMap = {};
  for (const ui of rawUserInterests) {
    if (!userInterestsMap[ui.user_id]) userInterestsMap[ui.user_id] = [];
    const interestDocId = idMapping.interests[String(ui.interest_id)];
    if (interestDocId) userInterestsMap[ui.user_id].push(interestDocId);
  }

  const transformedUsers = rawUsers.map(u => {
    const newUid = `uid_user_${u.id}`;
    registerMapping('users', u.id, newUid);

    return {
      uid: newUid,
      name: u.name,
      email: u.email,
      passwordHash: u.password, // Preserved for Auth import
      role: u.role,
      location: u.location || 'Islamabad, Pakistan',
      bio: u.bio,
      avatarUrl: u.avatar_path || null,
      settings: u.settings_json ? JSON.parse(u.settings_json) : { emailNotifications: true, pushNotifications: true },
      interestIds: userInterestsMap[u.id] || [],
      totalPlanted: 0,
      totalSeeded: 0,
      totalPoints: 0,
      monthlyPoints: 0,
      activitiesCount: 0,
      totpEnabled: false,
      mfaEnrolled: false,
      isDeleted: Boolean(u.deleted_at),
      createdAt: u.created_at ? new Date(u.created_at).toISOString() : migratedAt,
      _legacyId: u.id,
      _legacyTable: 'users',
      _migratedAt: migratedAt
    };
  });

  // 4. Transform Locations into verifiedSites
  console.log('📦 Transforming locations into verifiedSites...');
  const transformedSites = rawLocations.map(loc => {
    const newId = `site_${loc.id}`;
    registerMapping('locations', loc.id, newId);
    const geohash = encodeGeohash(Number(loc.latitude), Number(loc.longitude));

    return {
      siteId: newId,
      name: loc.name,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      geohash,
      region: loc.region || 'Islamabad, Pakistan',
      accuracyMeters: loc.accuracy_meters || 8,
      activityCount: 0, // Will aggregate below
      totalTreesPlanted: 0,
      totalSeedsDispersed: 0,
      primarySpecies: [],
      status: 'active',
      lastActivityAt: loc.created_at ? new Date(loc.created_at).toISOString() : migratedAt,
      createdAt: loc.created_at ? new Date(loc.created_at).toISOString() : migratedAt,
      updatedAt: loc.updated_at ? new Date(loc.updated_at).toISOString() : migratedAt,
      _legacyId: loc.id,
      _legacyTable: 'locations',
      _migratedAt: migratedAt
    };
  });

  // Map of siteId to site doc for aggregation
  const siteDocsMap = {};
  transformedSites.forEach(s => { siteDocsMap[s.siteId] = s; });

  // Map of userUid to user doc for aggregation
  const userDocsMap = {};
  transformedUsers.forEach(u => { userDocsMap[u.uid] = u; });

  // 5. Transform Activities (Merge Plantation & Seeding sub-records)
  console.log('📦 Transforming activities & merging plantation/seeding details...');
  const plantationsByActivityId = {};
  rawPlantations.forEach(p => { plantationsByActivityId[p.activity_id] = p; });

  const seedingsByActivityId = {};
  rawSeedings.forEach(s => { seedingsByActivityId[s.activity_id] = s; });

  const transformedActivities = rawActivities.map(act => {
    const newId = `activity_${act.id}`;
    registerMapping('activities', act.id, newId);

    const userUid = idMapping.users[String(act.user_id)];
    const userDoc = userDocsMap[userUid];
    const siteId = idMapping.locations[String(act.location_id)];
    const siteDoc = siteDocsMap[siteId];

    const plantation = plantationsByActivityId[act.id];
    const seeding = seedingsByActivityId[act.id];

    let speciesId = null;
    let speciesName = null;
    let quantityPlanted = null;
    let plantingMethod = null;
    let seedsDispersed = null;
    let dispersalMethod = null;
    let coverageAreaSqm = null;

    if (plantation) {
      speciesId = idMapping.species[String(plantation.species_id)] || null;
      const sp = transformedSpecies.find(s => s.id === speciesId);
      speciesName = sp ? sp.commonName : null;
      quantityPlanted = Number(plantation.quantity_planted) || 0;
      plantingMethod = plantation.planting_method || 'Pit Planting';
    } else if (seeding) {
      speciesId = idMapping.species[String(seeding.species_id)] || null;
      const sp = transformedSpecies.find(s => s.id === speciesId);
      speciesName = sp ? sp.commonName : null;
      seedsDispersed = Number(seeding.seeds_dispersed) || 0;
      dispersalMethod = seeding.dispersal_method || 'Hand Broadcasting';
      coverageAreaSqm = Number(seeding.coverage_area_sqm) || 0;
    }

    const geohash = siteDoc ? siteDoc.geohash : 'twc4s7';

    // Update aggregates if activity is verified
    if (act.status === 'verified') {
      if (userDoc) {
        userDoc.totalPlanted += (quantityPlanted || 0);
        userDoc.totalSeeded += (seedsDispersed || 0);
        userDoc.totalPoints += Number(act.points_awarded || 0);
        userDoc.activitiesCount += 1;
      }
      if (siteDoc) {
        siteDoc.activityCount += 1;
        siteDoc.totalTreesPlanted += (quantityPlanted || 0);
        siteDoc.totalSeedsDispersed += (seedsDispersed || 0);
        if (speciesName && !siteDoc.primarySpecies.includes(speciesName)) {
          siteDoc.primarySpecies.push(speciesName);
        }
        siteDoc.lastActivityAt = act.created_at ? new Date(act.created_at).toISOString() : migratedAt;
      }
    } else if (act.status === 'reported' && userDoc) {
      userDoc.activitiesCount += 1;
    }

    return {
      activityId: newId,
      userId: userUid || String(act.user_id),
      userName: userDoc ? userDoc.name : 'Unknown Volunteer',
      userAvatarUrl: userDoc ? userDoc.avatarUrl : null,
      activityType: act.activity_type,
      status: act.status,
      date: act.date ? new Date(act.date).toISOString() : migratedAt,
      fieldNotes: act.field_notes,
      pointsAwarded: Number(act.points_awarded) || 0,
      pointsProcessed: act.status === 'verified',
      clientSubmissionId: `legacy_migration_${act.id}`,
      verifiedBy: act.verified_by ? idMapping.users[String(act.verified_by)] : null,
      verifiedAt: act.verified_at ? new Date(act.verified_at).toISOString() : null,
      siteName: siteDoc ? siteDoc.name : 'Islamabad Restoration Site',
      siteId: siteId || null,
      latitude: siteDoc ? siteDoc.latitude : 33.7485,
      longitude: siteDoc ? siteDoc.longitude : 73.0645,
      geohash,
      region: siteDoc ? siteDoc.region : 'Islamabad, Pakistan',
      speciesId,
      speciesName,
      quantityPlanted,
      plantingMethod,
      seedsDispersed,
      dispersalMethod,
      coverageAreaSqm,
      createdAt: act.created_at ? new Date(act.created_at).toISOString() : migratedAt,
      _legacyId: act.id,
      _legacyTable: 'activities',
      _migratedAt: migratedAt
    };
  });

  // 6. Transform Notifications
  console.log('📦 Transforming notifications...');
  const transformedNotifications = rawNotifications.map(n => {
    const newId = `notification_${n.id}`;
    registerMapping('notifications', n.id, newId);
    return {
      id: newId,
      userId: idMapping.users[String(n.user_id)] || String(n.user_id),
      type: n.type || 'system',
      title: n.title,
      message: n.message,
      isRead: Boolean(n.is_read),
      data: n.data_json ? JSON.parse(n.data_json) : null,
      createdAt: n.created_at ? new Date(n.created_at).toISOString() : migratedAt,
      _legacyId: n.id,
      _legacyTable: 'notifications',
      _migratedAt: migratedAt
    };
  });

  // 7. Transform User Points
  console.log('📦 Transforming user points...');
  const transformedPoints = rawPoints.map(p => {
    const newId = `point_${p.id}`;
    registerMapping('user_points', p.id, newId);
    return {
      id: newId,
      userId: idMapping.users[String(p.user_id)] || String(p.user_id),
      activityId: p.activity_id ? (idMapping.activities[String(p.activity_id)] || `activity_${p.activity_id}`) : null,
      points: Number(p.points),
      reason: p.reason || 'Restoration activity award',
      createdAt: p.created_at ? new Date(p.created_at).toISOString() : migratedAt,
      _legacyId: p.id,
      _legacyTable: 'user_points',
      _migratedAt: migratedAt
    };
  });

  // 8. Transform Monthly Goals
  console.log('📦 Transforming community goals...');
  const transformedGoals = rawGoals.map(g => {
    const key = `${g.year}-${String(g.month).padStart(2, '0')}`;
    const newId = `goal_${key}`;
    registerMapping('community_goals', g.id, newId);
    return {
      id: newId,
      year: Number(g.year),
      month: Number(g.month),
      title: g.title,
      targetTrees: Number(g.target_trees),
      targetSeeds: Number(g.target_seeds),
      targetMonitoring: Number(g.target_monitoring),
      targetParticipants: Number(g.target_participants),
      status: g.status,
      _legacyId: g.id,
      _legacyTable: 'community_goals',
      _migratedAt: migratedAt
    };
  });

  // 9. Write Transformed Output Files
  const collections = [
    { name: 'interests_firestore.json', data: transformedInterests },
    { name: 'species_firestore.json', data: transformedSpecies },
    { name: 'users_firestore.json', data: transformedUsers },
    { name: 'verifiedSites_firestore.json', data: transformedSites },
    { name: 'activities_firestore.json', data: transformedActivities },
    { name: 'notifications_firestore.json', data: transformedNotifications },
    { name: 'user_points_firestore.json', data: transformedPoints },
    { name: 'community_goals_firestore.json', data: transformedGoals }
  ];

  for (const col of collections) {
    fs.writeFileSync(path.join(transformedDir, col.name), JSON.stringify(col.data, null, 2));
    console.log(`   ✅ Wrote ${col.name.padEnd(30)} : ${String(col.data.length).padStart(4)} records`);
  }

  // 10. Write Master Mapping Files to migration-data/
  fs.writeFileSync(path.join(migrationDataDir, 'id_mapping.json'), JSON.stringify(idMapping, null, 2));
  fs.writeFileSync(path.join(migrationDataDir, 'firebase_to_old_id.json'), JSON.stringify(reverseMapping, null, 2));

  console.log('\n📄 Permanent mapping files written:');
  console.log(`   ✅ ${path.join(migrationDataDir, 'id_mapping.json')}`);
  console.log(`   ✅ ${path.join(migrationDataDir, 'firebase_to_old_id.json')}`);

  console.log('\n🎉 Schema transformation completed successfully!');
}

if (require.main === module) {
  transform();
}

module.exports = { transform };
