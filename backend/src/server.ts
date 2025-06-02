import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import * as path from 'path';
import { config } from './config/index';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import boardRoutes from './routes/board';
import projectRoutes from './routes/projects';
import { logger } from './utils/logger';

const app = express();

// Health check endpoint first - before any middleware
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }) as any);
app.use(cookieParser() as any);

// CORS middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://nexus.keatonrproud.com', 'https://nexus.fly.dev']
        : ['http://localhost:3000'],
    credentials: true,
  })
);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
}

// Redirect Google OAuth callback to the correct API route (for backward compatibility)
app.get('/auth/google/callback', (req, res) => {
  const queryString = new URLSearchParams(
    req.query as Record<string, string>
  ).toString();
  res.redirect(`/api/auth/google/callback?${queryString}`);
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Bug Idea Board API is running!' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// Board routes (separate path to avoid conflicts)
app.use('/api/board', boardRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Serve frontend for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// 404 handler for unknown API routes
app.use('/api/*', (req, res, next) => {
  res.status(404).json({ error: 'API route not found' });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

const PORT = config.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all interfaces for Docker/Fly.io

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, HOST, () => {
    logger.info(`Server running on ${HOST}:${PORT} in ${config.NODE_ENV} mode`);
  });

  // Optimize server for faster startup
  server.timeout = 30000; // 30 second timeout
  server.keepAliveTimeout = 65000; // Keep connections alive
  server.headersTimeout = 66000; // Headers timeout
}

export default app;
