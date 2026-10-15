export interface ValidatedEnv {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  API_PREFIX: string;
  MONGODB_URI: string;
  SESSION_SECRET: string;
  CORS_ORIGINS: string;
  MFA_ENABLED: 'true' | 'false';
  STAFF_SESSION_MAX_AGE_SECONDS: number;
  STAFF_SESSION_IDLE_SECONDS: number;
  GUEST_SESSION_MAX_AGE_SECONDS: number;
  GUEST_SESSION_IDLE_SECONDS: number;
  DEFAULT_CURRENCY: string;
  DEFAULT_TIMEZONE: string;
  HOLD_EXPIRY_MINUTES: number;
  [key: string]: unknown;
}

export function validateEnv(raw: Record<string, unknown>): ValidatedEnv {
  const issues: string[] = [];

  const nodeEnv = (raw.NODE_ENV || 'development') as string;
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    issues.push(`NODE_ENV: must be 'development' | 'test' | 'production' (received '${nodeEnv}')`);
  }

  const parsePositiveInt = (key: string, defaultVal: number): number => {
    const val = raw[key] !== undefined && raw[key] !== '' ? Number(raw[key]) : defaultVal;
    if (!Number.isInteger(val) || val <= 0) {
      issues.push(`${key}: must be a positive integer`);
    }
    return val;
  };

  const port = parsePositiveInt('PORT', 3000);
  const apiPrefix = typeof raw.API_PREFIX === 'string' && raw.API_PREFIX ? raw.API_PREFIX : '/api/v1';

  const mongodbUri = (raw.MONGODB_URI as string) || 'mongodb://127.0.0.1:27017/staywise_dev';
  if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
    issues.push('MONGODB_URI: must be a valid mongodb:// or mongodb+srv:// URI');
  }

  const sessionSecret = (raw.SESSION_SECRET as string) || 'dev-secret-do-not-use-in-production-min-32-chars';
  if (sessionSecret.length < 32) {
    issues.push('SESSION_SECRET: must be at least 32 characters long');
  }

  const corsOrigins = (raw.CORS_ORIGINS as string) || 'http://localhost:5173,http://localhost:3001,http://localhost:3002';
  const mfaEnabled = (raw.MFA_ENABLED === 'true' ? 'true' : 'false') as 'true' | 'false';

  const staffMaxAge = parsePositiveInt('STAFF_SESSION_MAX_AGE_SECONDS', 43200);
  const staffIdle = parsePositiveInt('STAFF_SESSION_IDLE_SECONDS', 1800);
  const guestMaxAge = parsePositiveInt('GUEST_SESSION_MAX_AGE_SECONDS', 7776000);
  const guestIdle = parsePositiveInt('GUEST_SESSION_IDLE_SECONDS', 2592000);
  const holdExpiry = parsePositiveInt('HOLD_EXPIRY_MINUTES', 10);

  const defaultCurrency = (raw.DEFAULT_CURRENCY as string) || 'INR';
  const defaultTimezone = (raw.DEFAULT_TIMEZONE as string) || 'Asia/Kolkata';

  // Production superRefine checks
  if (nodeEnv === 'production') {
    if (sessionSecret.startsWith('dev-secret')) {
      issues.push('SESSION_SECRET: must be set with a strong production secret and cannot start with dev-secret');
    }
    if (/127\.0\.0\.1|localhost/.test(mongodbUri)) {
      issues.push('MONGODB_URI: must not point to localhost or 127.0.0.1 in production');
    }
    if (/localhost/.test(corsOrigins)) {
      issues.push('CORS_ORIGINS: must list production origins only without localhost');
    }
  }

  if (issues.length > 0) {
    const formatted = issues.map((i) => `  ${i}`).join('\n');
    throw new Error(`Invalid environment:\n${formatted}`);
  }

  return {
    ...raw,
    NODE_ENV: nodeEnv as 'development' | 'test' | 'production',
    PORT: port,
    API_PREFIX: apiPrefix,
    MONGODB_URI: mongodbUri,
    SESSION_SECRET: sessionSecret,
    CORS_ORIGINS: corsOrigins,
    MFA_ENABLED: mfaEnabled,
    STAFF_SESSION_MAX_AGE_SECONDS: staffMaxAge,
    STAFF_SESSION_IDLE_SECONDS: staffIdle,
    GUEST_SESSION_MAX_AGE_SECONDS: guestMaxAge,
    GUEST_SESSION_IDLE_SECONDS: guestIdle,
    DEFAULT_CURRENCY: defaultCurrency,
    DEFAULT_TIMEZONE: defaultTimezone,
    HOLD_EXPIRY_MINUTES: holdExpiry,
  };
}
