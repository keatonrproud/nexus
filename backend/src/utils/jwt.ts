import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { JWTPayload, RefreshTokenPayload } from '../types/auth';

export class JWTUtils {
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const secret = authConfig.jwt.secret;
    if (!secret) {
      throw new Error('JWT secret is not configured');
    }

    // Use simple string for expiresIn - JWT library accepts this format
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }

  static generateRefreshToken(
    payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>
  ): string {
    const secret = authConfig.jwt.refreshSecret;
    if (!secret) {
      throw new Error('JWT refresh secret is not configured');
    }

    // Use simple string for expiresIn - JWT library accepts this format
    return jwt.sign(payload, secret, { expiresIn: '30d' });
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const secret = authConfig.jwt.secret;
      if (!secret) {
        throw new Error('JWT secret is not configured');
      }

      return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const secret = authConfig.jwt.refreshSecret;
      if (!secret) {
        throw new Error('JWT refresh secret is not configured');
      }

      return jwt.verify(token, secret) as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }
}
