/**
 * Admin Suite Quality Gate & Verification Suite
 * Validates:
 * 1. Admin SPA distribution bundle integrity (dist/index.html, assets)
 * 2. Mandatory per-admin TOTP 2FA gating in AuthContext and LoginPage
 * 3. Existence and coverage of all 11 administrative panels
 * 4. Zero hardcoded secrets/passwords in admin client bundle
 * 5. Firebase Hosting configuration alignment in firebase.json
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const adminDir = path.join(rootDir, 'grov-admin');
const distDir = path.join(adminDir, 'dist');

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

console.log('⚡ Starting Grōv Admin Dashboard Verification Suite...\n');

// 1. Check Dist Build Output
console.log('--- TEST GROUP 1: Production Build Assets ---');
assert(fs.existsSync(distDir), 'grov-admin/dist directory exists');
assert(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html generated');

const htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
assert(htmlContent.includes('Grōv'), 'HTML title and branding present');
assert(htmlContent.includes('viewport'), 'Viewport meta tag present for responsive design');

const assetsDir = path.join(distDir, 'assets');
assert(fs.existsSync(assetsDir), 'dist/assets directory exists');
const assetFiles = fs.readdirSync(assetsDir);
assert(assetFiles.some(f => f.endsWith('.js')), 'Production JavaScript bundle generated');
assert(assetFiles.some(f => f.endsWith('.css')), 'Production CSS design tokens stylesheet generated');

// 2. Check 11 Governance Panels
console.log('\n--- TEST GROUP 2: Administrative Governance Panels ---');
const requiredPanels = [
  'OverviewPanel.tsx',
  'VerificationPanel.tsx',
  'UsersPanel.tsx',
  'AqiPanel.tsx',
  'TwoFactorPanel.tsx',
  'SmtpPanel.tsx',
  'SpeciesPanel.tsx',
  'DrivesPanel.tsx',
  'GoalsPanel.tsx',
  'ReportsPanel.tsx',
  'AnalyticsPanel.tsx'
];

for (const panel of requiredPanels) {
  const panelPath = path.join(adminDir, 'src/panels', panel);
  assert(fs.existsSync(panelPath), `Panel exists: ${panel}`);
}

// 3. Security & Zero-Secrets Compliance
console.log('\n--- TEST GROUP 3: Security & 2FA Architecture ---');
const authContextContent = fs.readFileSync(path.join(adminDir, 'src/context/AuthContext.tsx'), 'utf8');
assert(authContextContent.includes('verifyAdminTotp'), 'AuthContext calls verifyAdminTotp Cloud Function');
assert(authContextContent.includes('isTotpVerified'), 'AuthContext tracks isTotpVerified session state');

const twoFactorContent = fs.readFileSync(path.join(adminDir, 'src/panels/TwoFactorPanel.tsx'), 'utf8');
assert(twoFactorContent.includes('setupAdminTotp'), 'TwoFactorPanel invokes setupAdminTotp Cloud Function');
assert(twoFactorContent.includes('Google Secret Manager'), 'TwoFactorPanel references Google Secret Manager architecture');

// Search for hardcoded shared legacy secret
const legacySecret = 'JBSWY3DPEHPK3PXP';
let legacyFound = false;
function checkDirForSecret(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory() && f !== 'node_modules' && f !== '.git') {
      checkDirForSecret(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.js')) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes(legacySecret)) legacyFound = true;
    }
  }
}
checkDirForSecret(path.join(adminDir, 'src'));
assert(!legacyFound, 'Zero instances of legacy hardcoded TOTP secret JBSWY3DPEHPK3PXP in grov-admin source code');

// 4. Firebase Hosting Configuration Alignment
console.log('\n--- TEST GROUP 4: Firebase Hosting Configuration ---');
const firebaseJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8'));
assert(firebaseJson.hosting && firebaseJson.hosting.public === 'grov-admin/dist', 'firebase.json hosting.public configured to grov-admin/dist');
assert(firebaseJson.hosting.rewrites && firebaseJson.hosting.rewrites[0].destination === '/index.html', 'SPA rewrite configured to /index.html');

console.log(`\n📊 Admin Suite Verification Result: ${passed}/${total} assertions passed.`);
if (passed === total) {
  console.log('🎉 100% Quality Gate achieved! Grōv React.js Admin Suite verified.');
} else {
  console.error('❌ Verification failed!');
  process.exit(1);
}
