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

function applyDotEnvContent(content: string): void {
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

function loadDotEnvIfPresent(): void {
  const root = process.cwd();
  const primaryPath = path.resolve(root, '.env');
  if (fs.existsSync(primaryPath)) {
    applyDotEnvContent(fs.readFileSync(primaryPath, 'utf8'));
    return;
  }

  const fallbackPath = path.resolve(root, '.env.example');
  if (fs.existsSync(fallbackPath)) {
    applyDotEnvContent(fs.readFileSync(fallbackPath, 'utf8'));
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

function assertNotPlaceholder(name: string, value: string): void {
  const normalized = value.toLowerCase();
  const knownPlaceholders = new Set([
    'your-email@example.com',
    'your-password',
    'changeme',
    '<email>',
    '<password>',
  ]);
  if (knownPlaceholders.has(normalized)) {
    throw new Error(
      `Environment variable "${name}" still uses a placeholder value. Update your .env with real credentials.`,
    );
  }
}

function assertLikelyEmail(name: string, value: string): void {
  // Minimal email check to fail fast on obvious typos.
  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailLike.test(value)) {
    throw new Error(
      `Environment variable "${name}" has an invalid email format: "${value}".`,
    );
  }
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getConsignoConfig(): ConsignoConfig {
  loadDotEnvIfPresent();

  const baseUrl = trimTrailingSlash(process.env.CONSIGNO_BASE_URL ?? DEFAULT_BASE_URL);
  const email = getRequiredEnv('CONSIGNO_EMAIL');
  const password = getRequiredEnv('CONSIGNO_PASSWORD');
  assertNotPlaceholder('CONSIGNO_EMAIL', email);
  assertNotPlaceholder('CONSIGNO_PASSWORD', password);
  assertLikelyEmail('CONSIGNO_EMAIL', email);
  const invalidPassword = process.env.CONSIGNO_INVALID_PASSWORD?.trim() || DEFAULT_INVALID_PASSWORD;
  const reassignEmail = process.env.CONSIGNO_REASSIGN_EMAIL?.trim() || email;
  const documentPath = process.env.CONSIGNO_DOCUMENT_PATH?.trim() || DEFAULT_DOCUMENT_PATH;
  assertLikelyEmail('CONSIGNO_REASSIGN_EMAIL', reassignEmail);

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
