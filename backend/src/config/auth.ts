import { config } from './index';

// Construct base URL dynamically based on environment
const getBaseUrl = (): string => {
  if (config.NODE_ENV === 'production') {
    // In production, use a default production domain
    return 'https://nexus.keatonrproud.com';
  }

  // In development, use localhost with the configured port
  return `http://localhost:${config.PORT}`;
};

export const authConfig = {
  jwt: {
    secret: config.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars',
    expiresIn: config.JWT_EXPIRES_IN || '24h',
    refreshSecret:
      config.REFRESH_TOKEN_SECRET ||
      'your-super-secret-refresh-key-min-32-chars',
    refreshExpiresIn: config.REFRESH_TOKEN_EXPIRES_IN || '30d',
  },

  google: {
    clientId: config.GOOGLE_CLIENT_ID || '',
    clientSecret: config.GOOGLE_CLIENT_SECRET || '',
    // Dynamic redirect URI construction - match Google OAuth app configuration
    redirectUri: `${getBaseUrl()}/api/auth/google/callback`,
  },

  cookies: {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days to match refresh token lifetime
  },

  session: {
    name: 'nexus-session',
    secret: config.JWT_SECRET || 'your-session-secret-key',
  },
};

export default authConfig;
