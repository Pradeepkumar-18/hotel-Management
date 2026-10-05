export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigins: string[];
  database: {
    uri: string;
  };
  auth: {
    sessionSecret: string;
    staffCookieName: string;
    staffCsrfCookieName: string;
    guestCookieName: string;
    staffSessionMaxAge: number;
    staffSessionIdle: number;
    guestSessionMaxAge: number;
    guestSessionIdle: number;
  };
  platform: {
    defaultCurrency: string;
    defaultTimezone: string;
    holdExpiryMinutes: number;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3002').split(',').map((origin) => origin.trim()).filter(Boolean),
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/staywise_dev',
  },
  auth: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-do-not-use-in-production-min-32-chars',
    staffCookieName: process.env.STAFF_SESSION_COOKIE_NAME || 'staywise_staff_sid',
    staffCsrfCookieName: process.env.STAFF_CSRF_COOKIE_NAME || 'staywise_staff_csrf',
    guestCookieName: process.env.GUEST_SESSION_COOKIE_NAME || 'staywise_guest_sid',
    staffSessionMaxAge: parseInt(process.env.STAFF_SESSION_MAX_AGE_SECONDS || '43200', 10),
    staffSessionIdle: parseInt(process.env.STAFF_SESSION_IDLE_SECONDS || '1800', 10),
    guestSessionMaxAge: parseInt(process.env.GUEST_SESSION_MAX_AGE_SECONDS || '7776000', 10),
    guestSessionIdle: parseInt(process.env.GUEST_SESSION_IDLE_SECONDS || '2592000', 10),
  },
  platform: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
    holdExpiryMinutes: parseInt(process.env.HOLD_EXPIRY_MINUTES || '10', 10),
  },
});
