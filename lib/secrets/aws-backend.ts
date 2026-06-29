/**
 * AWS Secrets Manager backend (#257).
 *
 * Requires: `@aws-sdk/client-secrets-manager` installed as a dependency.
 * Configuration env vars:
 *   AWS_REGION          — e.g. "us-east-1"
 *   AWS_ACCESS_KEY_ID   — IAM key (or use instance role / ECS task role)
 *   AWS_SECRET_ACCESS_KEY
 *
 * The secret name in AWS should match the name passed to fetchSecret().
 * Example: fetchSecret("KEEPER_SECRET") → looks up the AWS secret named "KEEPER_SECRET".
 */

import type { SecretsProvider } from './index';

export class AwsSecretsProvider implements SecretsProvider {
  async fetchSecret(name: string): Promise<string> {
    // Dynamic import keeps the AWS SDK out of the browser bundle.
    // @aws-sdk/client-secrets-manager is declared as an optionalDependency —
    // install it with: bun add @aws-sdk/client-secrets-manager
    let SecretsManagerClient: any;
    let GetSecretValueCommand: any;
    try {
      const mod = await import('@aws-sdk/client-secrets-manager');
      SecretsManagerClient = mod.SecretsManagerClient;
      GetSecretValueCommand = mod.GetSecretValueCommand;
    } catch {
      throw new Error(
        '[aws-backend] AWS Secrets Manager backend requires @aws-sdk/client-secrets-manager. ' +
        'Run: bun add @aws-sdk/client-secrets-manager',
      );
    }

    const region = process.env.AWS_REGION;
    if (!region) {
      throw new Error('[aws-backend] AWS_REGION environment variable is required.');
    }

    const client = new SecretsManagerClient({ region });
    const command = new GetSecretValueCommand({ SecretId: name });
    const response = await client.send(command);

    const secret = response.SecretString;
    if (!secret) {
      throw new Error(
        `[aws-backend] Secret "${name}" exists in AWS Secrets Manager but has no string value.`,
      );
    }

    // If the secret is stored as JSON ({"KEEPER_SECRET":"S..."}), extract the value
    try {
      const parsed = JSON.parse(secret) as Record<string, string>;
      if (typeof parsed[name] === 'string') return parsed[name];
    } catch {
      // Not JSON — treat as a raw string value
    }

    return secret;
  }
}
