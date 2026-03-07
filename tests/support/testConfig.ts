import * as fs from 'fs';
import * as path from 'path';

export interface ConsignoConfig {
  baseUrl: string;
  loginUrl: string;
  email: string;
  password: string;
  invalidPassword: string;
  reassignEmail: string;
  documentPath: string;
}

const DEFAULT_BASE_URL = 'https://cloud.consigno.com';
const DEFAULT_INVALID_PASSWORD = 'invalid-password';
const DEFAULT_DOCUMENT_PATH = 'Document/Test.pdf';

function loadDotEnvIfPresent(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Configure it locally or in GitHub Actions secrets.`,
    );
  }

  return value;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getConsignoConfig(): ConsignoConfig {
  loadDotEnvIfPresent();

  const baseUrl = trimTrailingSlash(process.env.CONSIGNO_BASE_URL ?? DEFAULT_BASE_URL);
  const email = getRequiredEnv('CONSIGNO_EMAIL');
  const password = getRequiredEnv('CONSIGNO_PASSWORD');
  const invalidPassword = process.env.CONSIGNO_INVALID_PASSWORD?.trim() || DEFAULT_INVALID_PASSWORD;
  const reassignEmail = process.env.CONSIGNO_REASSIGN_EMAIL?.trim() || email;
  const documentPath = process.env.CONSIGNO_DOCUMENT_PATH?.trim() || DEFAULT_DOCUMENT_PATH;

  return {
    baseUrl,
    loginUrl: `${baseUrl}/login?redirect=dashboard`,
    email,
    password,
    invalidPassword,
    reassignEmail,
    documentPath,
  };
}
