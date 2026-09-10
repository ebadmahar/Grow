import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { authenticateRequest, requireAdmin } from '../utils/auth';
import { getSecret, storeSecret } from '../utils/secrets';

/**
 * HTTP Endpoint: setupAdminTotp
 * Generates a unique, cryptographically random base32 TOTP secret per admin.
 * Stores the secret EXCLUSIVELY in Google Secret Manager (NEVER in Firestore).
 * Returns QR code data URL for Google Authenticator enrollment.
 */
export const setupAdminTotp = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    requireAdmin(auth);

    // 1. Generate unique RFC 6238 base32 secret
    const secret = authenticator.generateSecret();
    const secretName = `totp-secret-${auth.uid}`;

    // 2. Store exclusively in Google Secret Manager
    await storeSecret(secretName, secret);

    // 3. Generate Authenticator OTPAuth URI and QR code
    const issuer = 'Grov Platform';
    const otpAuthUrl = authenticator.keyuri(auth.email, issuer, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // 4. Update Firestore user document with non-secret flag only
    const db = admin.firestore();
    await db.collection('users').doc(auth.uid).update({
      totpEnabled: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[setupAdminTotp] Admin TOTP configured for ${auth.email} (UID: ${auth.uid}) in Secret Manager`);

    res.status(200).json({
      success: true,
      message: 'Per-admin TOTP secret generated and stored securely in Google Secret Manager.',
      data: {
        qrCode: qrCodeDataUrl,
        manualKey: secret,
        issuer,
        account: auth.email,
      },
    });
  } catch (error: any) {
    console.error('[setupAdminTotp] Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * HTTP Endpoint: verifyAdminTotp
 * Validates a 6-digit TOTP code against the admin's secret stored in Google Secret Manager.
 */
export const verifyAdminTotp = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    requireAdmin(auth);

    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(422).json({ error: 'A 6-digit TOTP verification code is required.' });
      return;
    }

    // 1. Retrieve secret from Google Secret Manager
    const secretName = `totp-secret-${auth.uid}`;
    let secret: string;
    try {
      secret = await getSecret(secretName);
    } catch (sErr: any) {
      res.status(400).json({ error: 'TOTP has not been enrolled for this administrator account. Run setupAdminTotp first.' });
      return;
    }

    // 2. Verify RFC 6238 time-step token
    const isValid = authenticator.check(code.trim(), secret);

    if (!isValid) {
      console.warn(`[verifyAdminTotp] Failed TOTP verification attempt for admin ${auth.email}`);
      res.status(401).json({ error: 'Invalid or expired two-factor authentication code.' });
      return;
    }

    // 3. Issue elevated session claims
    const currentClaims = (await admin.auth().getUser(auth.uid)).customClaims || {};
    await admin.auth().setCustomUserClaims(auth.uid, {
      ...currentClaims,
      totpVerifiedAt: Date.now(),
    });

    console.log(`[verifyAdminTotp] Admin TOTP successfully validated for ${auth.email}`);

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication verified successfully.',
      data: {
        verified: true,
        uid: auth.uid,
        email: auth.email,
      },
    });
  } catch (error: any) {
    console.error('[verifyAdminTotp] Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * HTTP Endpoint: updateUserRole
 * Allows administrators to promote or demote users, updating both Firebase Auth custom claims and Firestore.
 */
export const updateUserRole = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST' && req.method !== 'PUT') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    requireAdmin(auth);

    const { targetUserId, role } = req.body;

    if (!targetUserId || !['volunteer', 'coordinator', 'admin'].includes(role)) {
      res.status(422).json({ error: 'Invalid parameters. Required: targetUserId and role ("volunteer" | "coordinator" | "admin").' });
      return;
    }

    const db = admin.firestore();

    // 1. Set Custom User Claims in Firebase Auth
    const customClaims = {
      role,
      isAdmin: role === 'admin',
      isCoordinator: role === 'coordinator' || role === 'admin',
    };

    await admin.auth().setCustomUserClaims(targetUserId, customClaims);

    // 2. Update Firestore user document
    await db.collection('users').doc(targetUserId).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[updateUserRole] User ${targetUserId} role updated to ${role} by ${auth.email}`);

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      data: {
        userId: targetUserId,
        role,
        claims: customClaims,
      },
    });
  } catch (error: any) {
    console.error('[updateUserRole] Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
