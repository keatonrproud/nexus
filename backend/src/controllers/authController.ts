import { Request, Response } from 'express';
import { analyticsConfig, analyticsService } from '../config/analytics';
import { authConfig } from '../config/auth';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../types/auth';
import { JWTUtils } from '../utils/jwt';

// Types for Google OAuth responses
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class AuthController {
  // POST /auth/google
  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { googleToken }: LoginRequest = req.body;

      if (!googleToken) {
        res.status(400).json({ error: 'Google token is required' });
        return;
      }

      // Verify Google token and get user info
      const googleUser = await AuthService.verifyGoogleToken(googleToken);

      // Find or create user in our database
      const user = await AuthService.findOrCreateUser(googleUser);

      // Check if this is a new user (for analytics)
      const isNewUser =
        user.created_at &&
        new Date(user.created_at).getTime() > Date.now() - 5000; // Created within last 5 seconds

      // Generate JWT tokens
      const tokens = AuthService.generateTokens(user);

      // Track analytics event
      try {
        const eventType = isNewUser
          ? analyticsConfig.events.userSignup
          : analyticsConfig.events.userLogin;
        await analyticsService.track(eventType, {
          userId: user.id,
          email: user.email,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the login if analytics fails
      }

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        ...authConfig.cookies,
        path: '/auth/refresh',
      });

      // Set access token as httpOnly cookie for automatic authentication
      res.cookie('accessToken', tokens.accessToken, {
        ...authConfig.cookies,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days to match access token lifetime
      });

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(401).json({
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /auth/refresh
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          error: 'Refresh token is required',
          code: 'NO_REFRESH_TOKEN',
        });
        return;
      }

      // Generate new tokens
      const tokens = await AuthService.refreshTokens(refreshToken);

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        ...authConfig.cookies,
        path: '/auth/refresh',
      });

      // Set new access token as httpOnly cookie for automatic authentication
      res.cookie('accessToken', tokens.accessToken, {
        ...authConfig.cookies,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days to match access token lifetime
      });

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);

      // Clear invalid refresh token cookie
      res.clearCookie('refreshToken', {
        path: '/auth/refresh',
        httpOnly: true,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      // Clear invalid access token cookie
      res.clearCookie('accessToken', {
        path: '/',
        httpOnly: true,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      res.status(401).json({
        error: 'Token refresh failed',
        code: 'REFRESH_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /auth/logout
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        path: '/auth/refresh',
        httpOnly: true,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      // Clear the access token cookie
      res.clearCookie('accessToken', {
        path: '/',
        httpOnly: true,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /auth/me
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get full user details from database
      const user = await AuthService.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profile_picture_url: user.profile_picture_url,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to get user profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /auth/google/url (helper to get Google OAuth URL)
  static async getGoogleAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      const scopes = ['openid', 'email', 'profile'];

      // This would be used for server-side OAuth flow
      // For client-side, frontend will handle Google OAuth directly
      res.status(200).json({
        success: true,
        message: 'Use Google OAuth client-side integration',
        scopes,
        clientId: authConfig.google.clientId,
      });
    } catch (error) {
      console.error('Get Google auth URL error:', error);
      res.status(500).json({
        error: 'Failed to get Google auth URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /auth/google/signin-config - Get Google Sign-In button configuration
  static async getGoogleSignInConfig(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Return the Google Client ID for OneTap authentication
      res.status(200).json({
        success: true,
        config: {
          clientId: authConfig.google.clientId,
        },
      });
    } catch (error) {
      console.error('Get Google Sign-In config error:', error);
      res.status(500).json({
        error: 'Failed to get Google Sign-In configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /auth/google - Initiate Google OAuth flow
  static async initiateGoogleAuth(req: Request, res: Response): Promise<void> {
    try {
      // Check if Google OAuth is configured
      if (!authConfig.google.clientId || !authConfig.google.clientSecret) {
        // Development mode - create a test user
        console.log('Google OAuth not configured, using development mode');

        const testUser = {
          id: 'dev-user-123',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          verified_email: true,
        };

        // Find or create user in our database
        const user = await AuthService.findOrCreateUser(testUser);

        // Generate JWT tokens
        const tokens = AuthService.generateTokens(user);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', tokens.refreshToken, {
          ...authConfig.cookies,
          path: '/auth/refresh',
        });

        // Set access token as httpOnly cookie (for automatic auth)
        res.cookie('accessToken', tokens.accessToken, {
          ...authConfig.cookies,
          path: '/',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Redirect to frontend dashboard
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/`);
        return;
      }

      const scopes = ['openid', 'email', 'profile'];
      const state = Math.random().toString(36).substring(2, 15);

      // Store state in session for security (optional, but recommended)
      // For now, we'll skip state validation for simplicity

      const googleAuthUrl = new URL(
        'https://accounts.google.com/o/oauth2/v2/auth'
      );
      googleAuthUrl.searchParams.append(
        'client_id',
        authConfig.google.clientId
      );
      googleAuthUrl.searchParams.append(
        'redirect_uri',
        authConfig.google.redirectUri
      );
      googleAuthUrl.searchParams.append('response_type', 'code');
      googleAuthUrl.searchParams.append('scope', scopes.join(' '));
      googleAuthUrl.searchParams.append('state', state);
      googleAuthUrl.searchParams.append('access_type', 'offline');
      googleAuthUrl.searchParams.append('prompt', 'consent');

      // Redirect to Google OAuth
      res.redirect(googleAuthUrl.toString());
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      res.status(500).json({
        error: 'Failed to initiate Google OAuth',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /auth/google/callback - Handle Google OAuth callback
  static async handleGoogleCallback(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { code, error: oauthError } = req.query;

      if (oauthError) {
        console.error('Google OAuth error:', oauthError);
        res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
        );
        return;
      }

      if (!code || typeof code !== 'string') {
        res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_code`
        );
        return;
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: authConfig.google.clientId,
          client_secret: authConfig.google.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: authConfig.google.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const tokenData = await tokenResponse.json();
      const { access_token } = tokenData as GoogleTokenResponse;

      // Get user info from Google
      const userResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!userResponse.ok) {
        throw new Error('Failed to get user info from Google');
      }

      const googleUser = (await userResponse.json()) as GoogleUserInfo;

      // Find or create user in our database
      const user = await AuthService.findOrCreateUser({
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        verified_email: googleUser.verified_email,
      });

      // Check if this is a new user (for analytics)
      const isNewUser =
        user.created_at &&
        new Date(user.created_at).getTime() > Date.now() - 5000;

      // Generate JWT tokens
      const tokens = AuthService.generateTokens(user);

      // Track analytics event
      try {
        const eventType = isNewUser
          ? analyticsConfig.events.userSignup
          : analyticsConfig.events.userLogin;
        await analyticsService.track(eventType, {
          userId: user.id,
          email: user.email,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the login if analytics fails
      }

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        ...authConfig.cookies,
        path: '/auth/refresh',
      });

      // Set access token as httpOnly cookie (for automatic auth)
      res.cookie('accessToken', tokens.accessToken, {
        ...authConfig.cookies,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days to match access token lifetime
      });

      // Redirect to frontend dashboard
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=callback_failed`
      );
    }
  }

  // POST /auth/google/callback - Handle Google OneTap JWT callback
  static async handleGoogleOneTapCallback(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { credential } = req.body;

      if (!credential) {
        res.status(400).json({
          success: false,
          error: 'Google credential is required',
        });
        return;
      }

      // Verify Google JWT token and get user info
      const googleUser = await AuthService.verifyGoogleToken(credential);

      // Find or create user in our database
      const user = await AuthService.findOrCreateUser(googleUser);

      // Check if this is a new user (for analytics)
      const isNewUser =
        user.created_at &&
        new Date(user.created_at).getTime() > Date.now() - 5000;

      // Generate JWT tokens
      const tokens = AuthService.generateTokens(user);

      // Track analytics event
      try {
        const eventType = isNewUser
          ? analyticsConfig.events.userSignup
          : analyticsConfig.events.userLogin;
        await analyticsService.track(eventType, {
          userId: user.id,
          email: user.email,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the login if analytics fails
      }

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        ...authConfig.cookies,
        path: '/auth/refresh',
      });

      // Set access token as httpOnly cookie for automatic auth
      res.cookie('accessToken', tokens.accessToken, {
        ...authConfig.cookies,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days to match access token lifetime
      });

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      console.error('Google OneTap callback error:', error);
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /auth/validate - Validate and refresh current session
  static async validateSession(req: Request, res: Response): Promise<void> {
    try {
      // Check for access token in cookies
      const accessToken = req.cookies?.accessToken;
      const refreshToken = req.cookies?.refreshToken;

      if (!accessToken && !refreshToken) {
        res.status(401).json({
          error: 'No valid session found',
          code: 'NO_SESSION',
        });
        return;
      }

      // First try to validate the access token
      if (accessToken) {
        try {
          const decoded = JWTUtils.verifyAccessToken(accessToken);
          // Access token is valid, get user info
          const user = await AuthService.getUserById(decoded.userId);
          if (user) {
            res.status(200).json({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
              accessToken: accessToken,
            });
            return;
          }
        } catch (error) {
          // Access token invalid or expired, try refresh token
          console.log('Access token invalid, attempting refresh');
        }
      }

      // If access token validation failed, try refresh token
      if (refreshToken) {
        try {
          const tokens = await AuthService.refreshTokens(refreshToken);

          // Set new tokens as cookies
          res.cookie('refreshToken', tokens.refreshToken, {
            ...authConfig.cookies,
            path: '/auth/refresh',
          });

          res.cookie('accessToken', tokens.accessToken, {
            ...authConfig.cookies,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days to match access token lifetime
          });

          // Get user info from new access token
          const decoded = JWTUtils.verifyAccessToken(tokens.accessToken);
          const user = await AuthService.getUserById(decoded.userId);

          if (user) {
            res.status(200).json({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
              accessToken: tokens.accessToken,
            });
            return;
          }
        } catch (error) {
          console.error('Session refresh failed:', error);
        }
      }

      // All validation attempts failed
      res.clearCookie('accessToken', {
        path: '/',
        httpOnly: true,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      res.clearCookie('refreshToken', {
        path: '/auth/refresh',
        httpOnly: true,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      res.status(401).json({
        error: 'Session validation failed',
        code: 'SESSION_INVALID',
      });
    } catch (error) {
      console.error('Session validation error:', error);
      res.status(500).json({
        error: 'Session validation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
