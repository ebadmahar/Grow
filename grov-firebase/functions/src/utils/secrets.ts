import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let client: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client;
}

/**
 * Retrieves a secret from Google Secret Manager.
 * Falls back to process.env if Secret Manager is not reachable (e.g. in local emulator).
 */
export async function getSecret(secretName: string): Promise<string> {
  // Check process.env first (for emulator/development overrides)
  const envKey = secretName.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (process.env[envKey]) {
    return process.env[envKey] as string;
  }
  if (process.env[secretName]) {
    return process.env[secretName] as string;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'grov-staging';
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    const sm = getClient();
    const [version] = await sm.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`Secret ${secretName} has empty payload.`);
    }
    return payload;
  } catch (err: any) {
    console.warn(`[SecretManager] Could not access secret ${secretName} from GCP: ${err.message}. Checking local environment.`);
    if (process.env[envKey]) {
      return process.env[envKey] as string;
    }
    throw new Error(`Failed to resolve required secret: ${secretName}`);
  }
}

/**
 * Stores or updates a secret payload in Google Secret Manager.
 */
export async function storeSecret(secretName: string, secretValue: string): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'grov-staging';
  const parent = `projects/${projectId}`;
  const sm = getClient();

  try {
    // Try to create secret if it does not exist
    try {
      await sm.createSecret({
        parent,
        secretId: secretName,
        secret: {
          replication: {
            automatic: {},
          },
        },
      });
    } catch (e: any) {
      // Secret already exists (ALREADY_EXISTS = 6), ignore
      if (e.code !== 6) {
        throw e;
      }
    }

    // Add new secret version
    await sm.addSecretVersion({
      parent: `projects/${projectId}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(secretValue, 'utf8'),
      },
    });
  } catch (err: any) {
    console.error(`[SecretManager] Error storing secret ${secretName}:`, err.message);
    throw err;
  }
}
