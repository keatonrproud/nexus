import { Router } from 'express';
import {
  getAnalyticsConfig,
  getDashboardMetrics,
  getDetailedAnalytics,
  getHitsData,
  getPathAnalytics,
  getProjectAnalytics,
  getProjectPaths,
  getTotalCounts,
  getUserSites,
  trackEvent,
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';
import { cacheMiddleware } from '../utils/cache';

const router = Router();

// All analytics routes require authentication
router.use(authenticateToken);

// GET /analytics/config - Get analytics configuration (cache for 10 minutes)
router.get('/config', cacheMiddleware(10 * 60 * 1000), getAnalyticsConfig);

// GET /analytics/dashboard - Get dashboard metrics (cache for 2 minutes)
router.get('/dashboard', cacheMiddleware(2 * 60 * 1000), getDashboardMetrics);

// POST /analytics/track - Track custom event (no caching for POST)
router.post('/track', trackEvent);

// GET /analytics/projects/:projectId - Get project analytics (cache for 5 minutes)
router.get(
  '/projects/:projectId',
  cacheMiddleware(5 * 60 * 1000),
  getProjectAnalytics
);

// New detailed analytics endpoints

// GET /analytics/projects/:projectId/detailed - Get detailed analytics (browsers, systems, etc.)
// Query params: type (browsers|systems|locations|languages|sizes|campaigns|toprefs), startDate, endDate, limit, offset
router.get(
  '/projects/:projectId/detailed',
  cacheMiddleware(5 * 60 * 1000),
  getDetailedAnalytics
);

// GET /analytics/projects/:projectId/paths - Get all paths for a project
// Query params: limit, after
router.get(
  '/projects/:projectId/paths',
  cacheMiddleware(10 * 60 * 1000),
  getProjectPaths
);

// GET /analytics/projects/:projectId/paths/:pathId/referrals - Get referrals for a specific path
// Query params: startDate, endDate, limit, offset
router.get(
  '/projects/:projectId/path-referrals',
  cacheMiddleware(5 * 60 * 1000),
  getPathAnalytics
);

// GET /analytics/projects/:projectId/totals - Get total counts
// Query params: startDate, endDate
router.get(
  '/projects/:projectId/totals',
  cacheMiddleware(5 * 60 * 1000),
  getTotalCounts
);

// GET /analytics/projects/:projectId/hits - Get detailed hits data
// Query params: startDate, endDate, daily, limit
router.get(
  '/projects/:projectId/hits',
  cacheMiddleware(5 * 60 * 1000),
  getHitsData
);

// GET /analytics/user/sites - Get user's GoatCounter sites
router.get('/user/sites', cacheMiddleware(30 * 60 * 1000), getUserSites);

export default router;
