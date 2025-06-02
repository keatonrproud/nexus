import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Validation middleware for Google login
const googleLoginValidation = [
  body('googleToken')
    .notEmpty()
    .withMessage('Google token is required')
    .isString()
    .withMessage('Google token must be a string'),
];

// Validation middleware for Google OneTap callback
const googleOneTapValidation = [
  body('credential')
    .notEmpty()
    .withMessage('Google credential is required')
    .isString()
    .withMessage('Google credential must be a string'),
];

// Validation middleware for refresh token
const refreshTokenValidation = [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string'),
];

// POST /auth/google - Google OAuth login
router.post(
  '/google',
  googleLoginValidation,
  validateRequest,
  AuthController.googleLogin
);

// POST /auth/google/callback - Handle Google OneTap JWT callback
router.post(
  '/google/callback',
  googleOneTapValidation,
  validateRequest,
  AuthController.handleGoogleOneTapCallback
);

// GET /auth/google - Initiate Google OAuth flow
router.get('/google', AuthController.initiateGoogleAuth);

// GET /auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', AuthController.handleGoogleCallback);

// POST /auth/refresh - Refresh access token
router.post(
  '/refresh',
  refreshTokenValidation,
  validateRequest,
  AuthController.refreshToken
);

// POST /auth/logout - Logout user
router.post('/logout', AuthController.logout);

// GET /auth/me - Get current user profile
router.get('/me', authenticateToken, AuthController.getProfile);

// GET /auth/validate - Validate and refresh current session
router.get('/validate', AuthController.validateSession);

// GET /auth/google/url - Get Google OAuth URL (helper endpoint)
router.get('/google/url', AuthController.getGoogleAuthUrl);

// GET /auth/google/signin-config - Get Google Sign-In button configuration
router.get('/google/signin-config', AuthController.getGoogleSignInConfig);

export default router;
