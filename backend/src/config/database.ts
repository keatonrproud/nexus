import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { config } from './index';

let supabaseInstance: SupabaseClient | null = null;
let initializationStarted = false;

// Create a single reusable Supabase client - but make it lazy
export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // Initialize the client with optimized options
    supabaseInstance = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        // Disable retries during startup to speed up initial connection
        global: {
          headers: { 'X-Client-Info': 'nexus-backend' },
        },
        db: {
          schema: 'public',
        },
      }
    );

    logger.info('Supabase client initialized');

    // Only start the connection test once
    if (!initializationStarted) {
      initializationStarted = true;

      // Test connection in background after returning the client
      setTimeout(() => {
        testDatabaseConnection().then((connected) => {
          if (!connected) {
            logger.warn(
              'Database connection test failed, but server will continue running'
            );
          }
        });
      }, 100);
    }
  }

  return supabaseInstance;
};

// For client-side operations (with anon key)
export const getSupabaseClient = (): SupabaseClient => {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
};

// Test the database connection without blocking server startup
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      logger.error('Supabase connection test failed:', error);
      return false;
    }

    logger.info('Connected to Supabase successfully');
    return true;
  } catch (error) {
    logger.error('Supabase connection test failed:', error);
    return false;
  }
};

// Initialize database connection in background without blocking
export const initializeDatabase = async (): Promise<void> => {
  // Just get the instance to initialize it, without waiting for test
  getSupabase();
};
