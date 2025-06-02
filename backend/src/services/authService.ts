import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { authConfig } from '../config/auth';
import { AuthTokens, GoogleUserInfo, User } from '../types/auth';
import { JWTUtils } from '../utils/jwt';

const googleClient = new OAuth2Client(
  authConfig.google.clientId,
  authConfig.google.clientSecret,
  authConfig.google.redirectUri
);

// Lazy-load Supabase client to avoid initialization errors
let supabaseClient: SupabaseClient | null = null;

// In-memory storage for development mode
const devUsers: Map<string, User> = new Map();
let userIdCounter = 1;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = config.SUPABASE_URL;
    const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase configuration is not properly set up. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

function isSupabaseConfigured(): boolean {
  const supabaseUrl = config.SUPABASE_URL;
  const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY;
  return !!(supabaseUrl && supabaseKey);
}

export class AuthService {
  static async verifyGoogleToken(token: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: authConfig.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token payload');
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture,
        verified_email: payload.email_verified || false,
      };
    } catch (error) {
      throw new Error('Invalid Google token');
    }
  }

  static async findOrCreateUser(googleUser: GoogleUserInfo): Promise<User> {
    try {
      // Use in-memory storage if Supabase is not configured
      if (!isSupabaseConfigured()) {
        console.log('Using development mode with in-memory storage');

        // Check if user already exists
        for (const [id, user] of devUsers) {
          if (user.google_id === googleUser.id) {
            // Update existing user
            const updatedUser: User = {
              ...user,
              email: googleUser.email,
              name: googleUser.name,
              profile_picture_url: googleUser.picture,
              updated_at: new Date().toISOString(),
            };
            devUsers.set(id, updatedUser);
            return updatedUser;
          }
        }

        // Create new user
        const newUser: User = {
          id: `dev-user-${userIdCounter++}`,
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.id,
          profile_picture_url: googleUser.picture,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        devUsers.set(newUser.id, newUser);
        return newUser;
      }

      // Use Supabase for production
      const supabase = getSupabaseClient();

      // First, try to find existing user by google_id
      let { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleUser.id)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingUser) {
        // Update user info if needed
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: googleUser.email,
            name: googleUser.name,
            profile_picture_url: googleUser.picture,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updatedUser;
      }

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.id,
          profile_picture_url: googleUser.picture,
        })
        .select()
        .single();

      if (createError) throw createError;
      return newUser;
    } catch (error) {
      console.error('Error finding/creating user:', error);
      throw new Error('Failed to authenticate user');
    }
  }

  static generateTokens(user: User): AuthTokens {
    const accessToken = JWTUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = JWTUtils.generateRefreshToken({
      userId: user.id,
      tokenVersion: 1, // Could be stored in DB for token invalidation
    });

    return { accessToken, refreshToken };
  }

  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      const supabase = getSupabaseClient();

      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      // Use in-memory storage if Supabase is not configured
      if (!isSupabaseConfigured()) {
        return devUsers.get(userId) || null;
      }

      // Use Supabase for production
      const supabase = getSupabaseClient();

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return null;
      return user;
    } catch (error) {
      return null;
    }
  }
}
