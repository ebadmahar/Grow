import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { Request } from 'firebase-functions/v2/https';

export interface AuthContext {
  uid: string;
  email: string;
  role: 'volunteer' | 'coordinator' | 'admin';
  isAdmin: boolean;
  isCoordinator: boolean;
  name?: string;
}

/**
 * Extracts and verifies the Firebase ID token from Authorization header (Bearer <token>).
 */
export async function authenticateRequest(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpsError('unauthenticated', 'Missing or malformed Authorization header.');
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const role = (decodedToken.role as 'volunteer' | 'coordinator' | 'admin') || 'volunteer';
    const isAdmin = decodedToken.isAdmin === true || role === 'admin';
    const isCoordinator = decodedToken.isCoordinator === true || isAdmin || role === 'coordinator';

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
      isAdmin,
      isCoordinator,
      name: decodedToken.name,
    };
  } catch (error: any) {
    throw new HttpsError('unauthenticated', 'Invalid or expired Firebase ID token: ' + error.message);
  }
}

/**
 * Enforces admin authorization.
 */
export function requireAdmin(auth: AuthContext): void {
  if (!auth.isAdmin) {
    throw new HttpsError('permission-denied', 'Administrative privileges required.');
  }
}

/**
 * Enforces coordinator or admin authorization.
 */
export function requireCoordinatorOrAdmin(auth: AuthContext): void {
  if (!auth.isCoordinator) {
    throw new HttpsError('permission-denied', 'Coordinator or Administrative privileges required.');
  }
}
