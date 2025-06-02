import { NextFunction, Request, Response } from 'express';
import { JWTPayload } from '../types/auth';
import { JWTUtils } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for token in Authorization header first
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // If no token in header, check cookies
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify the token
    const decoded = JWTUtils.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1];

    // If no token in header, check cookies
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (token) {
      const decoded = JWTUtils.verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

export const requireAuth = authenticateToken;
