import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { config } from '../config';
import {
  analyticsConfig,
  analyticsService,
  goatcounterClient,
} from '../config/analytics';

// Create Supabase client
const supabase = createClient(
  config.SUPABASE_URL || '',
  config.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const getAnalyticsConfig = async (req: Request, res: Response) => {
  try {
    res.json({
      enabled: analyticsConfig.goatcounter.enabled,
      events: analyticsConfig.events,
      goatcounterConfigured: analyticsConfig.goatcounter.enabled,
    });
  } catch (error) {
    console.error('Analytics config error:', error);
    res.status(500).json({ error: 'Failed to get analytics configuration' });
  }
};

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Start date and end date are required' });
    }

    // Get all projects for the user
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(
        `
        id,
        name,
        url,
        emoji,
        goatcounter_site_code,
        goatcounter_api_token
      `
      )
      .eq('user_id', req.user.userId);

    if (projectsError) {
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    const sites = [];
    let totalPageviews = 0;
    let totalVisitors = 0;
    let failedProjects = 0;
    const errors: string[] = [];

    // Process projects sequentially to avoid rate limiting - this is now handled by the enhanced rate limiter
    for (const project of projects || []) {
      const siteCode = project.goatcounter_site_code;
      const apiToken = project.goatcounter_api_token;

      // Skip projects without both siteCode and apiToken
      if (!siteCode || !apiToken) {
        // Project without analytics configured
        sites.push({
          projectId: project.id,
          projectName: project.name,
          projectUrl: project.url,
          projectEmoji: project.emoji,
          siteCode: null,
          analytics: null,
        });
        continue;
      }

      try {
        // Prioritize essential data - only get hits and totals for dashboard
        // Additional data can be fetched on-demand when viewing individual projects
        const [hits, totals] = await Promise.all([
          goatcounterClient.getHits(
            siteCode,
            apiToken,
            startDate as string,
            endDate as string,
            { limit: 10 }
          ),
          goatcounterClient.getTotalCount(
            siteCode,
            apiToken,
            startDate as string,
            endDate as string
          ),
        ]);

        totalPageviews += totals.total;
        totalVisitors += totals.total; // GoatCounter doesn't separate unique visitors in total endpoint

        // Transform hits to pageviews format for compatibility
        const pageViews = hits.map((hit) => ({
          path: hit.path,
          title: hit.title,
          count: hit.count,
          count_unique: hit.count,
        }));

        sites.push({
          projectId: project.id,
          projectName: project.name,
          projectUrl: project.url,
          projectEmoji: project.emoji,
          siteCode,
          analytics: {
            stats: {
              total_pageviews: totals.total,
              total_visitors: totals.total,
              total_sessions: totals.total,
              bounce_rate: 0,
              pageviews: totals.total,
              visitors: totals.total,
              visits: totals.total,
              bounces: 0,
              totaltime: 0,
            },
            pageViews: hits,
            topPages: pageViews,
            referrers: [],
            countries: [],
            browsers: [],
            operatingSystems: [],
            devices: [],
          },
        });
      } catch (error) {
        failedProjects++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `Analytics fetch error for project ${project.id} (${project.name}):`,
          error
        );

        // Collect error details for debugging
        errors.push(`${project.name}: ${errorMessage}`);

        // Continue with other projects even if one fails
        sites.push({
          projectId: project.id,
          projectName: project.name,
          projectUrl: project.url,
          projectEmoji: project.emoji,
          siteCode,
          analytics: null,
          error: errorMessage,
        });
      }
    }

    // Prepare response with additional error information
    const response: any = {
      dateRange: {
        startDate: startDate as string,
        endDate: endDate as string,
      },
      sites,
      aggregatedStats:
        sites.length > 0
          ? {
              totalPageviews,
              totalVisitors,
              totalSites: sites.filter((site) => site.analytics).length,
              totalProjects: sites.length,
              failedProjects,
            }
          : null,
      analyticsEnabled: analyticsConfig.goatcounter.enabled,
    };

    // Include error details if there were failures
    if (failedProjects > 0) {
      response.warnings = {
        message: `Failed to fetch analytics for ${failedProjects} project(s)`,
        details: errors,
        suggestion:
          'Check your GoatCounter API tokens and site codes. Some projects may experience temporary rate limiting.',
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};

export const getProjectAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Start date and end date are required' });
    }

    // Get project with analytics configuration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        `
        id,
        name,
        url,
        emoji,
        goatcounter_site_code,
        goatcounter_api_token
      `
      )
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const siteCode = project.goatcounter_site_code;
    const apiToken = project.goatcounter_api_token;

    if (!siteCode || !apiToken) {
      return res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        analyticsEnabled: false,
        analytics: null,
        error:
          'GoatCounter site code or API token not configured for this project',
      });
    }

    try {
      // Fetch essential data first (hits and totals)
      const [hits, totals] = await Promise.all([
        goatcounterClient.getHits(
          siteCode,
          apiToken,
          startDate as string,
          endDate as string,
          { limit: 20 }
        ),
        goatcounterClient.getTotalCount(
          siteCode,
          apiToken,
          startDate as string,
          endDate as string
        ),
      ]);

      // Fetch additional data sequentially to avoid rate limiting
      let browsers: any[] = [];
      let systems: any[] = [];
      let locations: any[] = [];
      let referrers: any[] = [];

      try {
        browsers = await goatcounterClient.getStatsPage(
          siteCode,
          apiToken,
          'browsers',
          startDate as string,
          endDate as string,
          { limit: 10 }
        );
      } catch (error) {
        console.error('Failed to fetch browsers data:', error);
      }

      try {
        systems = await goatcounterClient.getStatsPage(
          siteCode,
          apiToken,
          'systems',
          startDate as string,
          endDate as string,
          { limit: 10 }
        );
      } catch (error) {
        console.error('Failed to fetch systems data:', error);
      }

      try {
        locations = await goatcounterClient.getStatsPage(
          siteCode,
          apiToken,
          'locations',
          startDate as string,
          endDate as string,
          { limit: 10 }
        );
      } catch (error) {
        console.error('Failed to fetch locations data:', error);
      }

      try {
        referrers = await goatcounterClient.getStatsPage(
          siteCode,
          apiToken,
          'toprefs',
          startDate as string,
          endDate as string,
          { limit: 10 }
        );
      } catch (error) {
        console.error('Failed to fetch referrers data:', error);
      }

      // Transform hits to pageviews format for compatibility
      const pageViews = hits.map((hit) => ({
        path: hit.path,
        title: hit.title,
        count: hit.count,
        count_unique: hit.count,
      }));

      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        siteCode,
        analytics: {
          stats: {
            total_pageviews: totals.total,
            unique_visitors: totals.total,
            bounce_rate: 0,
            avg_session_duration: 0,
            pageviews: totals.total,
            visitors: totals.total,
            visits: totals.total,
            bounces: 0,
            totaltime: 0,
          },
          pageViews: hits,
          topPages: pageViews,
          referrers: referrers,
          countries: locations,
          browsers: browsers,
          operatingSystems: systems,
          devices: null,
        },
        analyticsEnabled: true,
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        siteCode,
        analyticsEnabled: true,
        error: 'Failed to fetch analytics data',
      });
    }
  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch project analytics' });
  }
};

export const trackEvent = async (req: Request, res: Response) => {
  try {
    const { eventType, data, siteCode } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    await analyticsService.track(eventType, data || {}, siteCode);

    res.json({ success: true, message: 'Event tracked successfully' });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Start date and end date are required' });
    }

    // Get project analytics configuration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('goatcounter_site_code, goatcounter_api_token')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.goatcounter_site_code || !project.goatcounter_api_token) {
      return res
        .status(400)
        .json({
          error:
            'GoatCounter site code or API token not configured for this project',
        });
    }

    // Fetch analytics data from GoatCounter using new API methods
    const [hits, totals] = await Promise.all([
      goatcounterClient.getHits(
        project.goatcounter_site_code,
        project.goatcounter_api_token,
        startDate as string,
        endDate as string
      ),
      goatcounterClient.getTotalCount(
        project.goatcounter_site_code,
        project.goatcounter_api_token,
        startDate as string,
        endDate as string
      ),
    ]);

    // Transform the data to match our expected format
    const transformedData = {
      total_pageviews: totals.total,
      unique_visitors: totals.total,
      bounce_rate: 0,
      avg_session_duration: 0,
      pages: hits.map((hit) => ({
        path: hit.path,
        title: hit.title,
        count: hit.count,
        count_unique: hit.count,
      })),
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

export const getPageviews = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Start date and end date are required' });
    }

    // Get project analytics configuration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('goatcounter_site_code, goatcounter_api_token')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.goatcounter_site_code || !project.goatcounter_api_token) {
      return res
        .status(400)
        .json({
          error:
            'GoatCounter site code or API token not configured for this project',
        });
    }

    // Fetch pageview data from GoatCounter using new API method
    const hits = await goatcounterClient.getHits(
      project.goatcounter_site_code,
      project.goatcounter_api_token,
      startDate as string,
      endDate as string
    );

    // Transform hits to pageviews format
    const pageviews = hits.map((hit) => ({
      path: hit.path,
      title: hit.title,
      count: hit.count,
      count_unique: hit.count,
    }));

    res.json({ pageviews });
  } catch (error) {
    console.error('Pageviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pageview data' });
  }
};

export const getDetailedAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { projectId } = req.params;
    const { startDate, endDate, type } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Start date and end date are required' });
    }

    if (
      !type ||
      ![
        'browsers',
        'systems',
        'locations',
        'languages',
        'sizes',
        'campaigns',
        'toprefs',
      ].includes(type as string)
    ) {
      return res
        .status(400)
        .json({
          error:
            'Valid type is required (browsers, systems, locations, languages, sizes, campaigns, toprefs)',
        });
    }

    // Get project with analytics configuration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        'id, name, url, emoji, goatcounter_site_code, goatcounter_api_token'
      )
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const siteCode = project.goatcounter_site_code;
    const apiToken = project.goatcounter_api_token;

    if (!siteCode || !apiToken) {
      return res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        type: type as string,
        data: [],
        analyticsEnabled: false,
        error:
          'GoatCounter site code or API token not configured for this project',
      });
    }

    try {
      const data = await goatcounterClient.getStatsPage(
        siteCode,
        apiToken,
        type as
          | 'browsers'
          | 'systems'
          | 'locations'
          | 'languages'
          | 'sizes'
          | 'campaigns'
          | 'toprefs',
        startDate as string,
        endDate as string,
        {
          limit: parseInt(req.query.limit as string) || 20,
          offset: parseInt(req.query.offset as string) || 0,
        }
      );

      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        type: type as string,
        data,
        analyticsEnabled: true,
      });
    } catch (error) {
      console.error('Detailed analytics fetch error:', error);
      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        type: type as string,
        data: [],
        analyticsEnabled: true,
        error: 'Failed to fetch detailed analytics data',
      });
    }
  } catch (error) {
    console.error('Detailed analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch detailed analytics' });
  }
};

export const getPathAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { projectId } = req.params;
    const { pathId, startDate, endDate } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!pathId) {
      return res.status(400).json({ error: 'Path ID is required' });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Start date and end date are required' });
    }

    // Get project with analytics configuration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        'id, name, url, emoji, goatcounter_site_code, goatcounter_api_token'
      )
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const siteCode = project.goatcounter_site_code;
    const apiToken = project.goatcounter_api_token;

    if (!siteCode || !apiToken) {
      return res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        pathId: parseInt(pathId as string),
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        referrals: [],
        analyticsEnabled: false,
        error:
          'GoatCounter site code or API token not configured for this project',
      });
    }

    try {
      const referrals = await goatcounterClient.getPathReferrals(
        siteCode,
        apiToken,
        parseInt(pathId as string),
        startDate as string,
        endDate as string,
        {
          limit: parseInt(req.query.limit as string) || 20,
          offset: parseInt(req.query.offset as string) || 0,
        }
      );

      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        pathId: parseInt(pathId as string),
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        referrals,
        analyticsEnabled: true,
      });
    } catch (error) {
      console.error('Path analytics fetch error:', error);
      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        pathId: parseInt(pathId as string),
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        referrals: [],
        analyticsEnabled: true,
        error: 'Failed to fetch path analytics data',
      });
    }
  } catch (error) {
    console.error('Path analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch path analytics' });
  }
};

export const getProjectPaths = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Get project with analytics configuration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        'id, name, url, emoji, goatcounter_site_code, goatcounter_api_token'
      )
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const siteCode = project.goatcounter_site_code;
    const apiToken = project.goatcounter_api_token;

    if (!siteCode || !apiToken) {
      return res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        paths: [],
        more: false,
        analyticsEnabled: false,
        error:
          'GoatCounter site code or API token not configured for this project',
      });
    }

    try {
      const result = await goatcounterClient.getPaths(siteCode, apiToken, {
        limit: parseInt(req.query.limit as string) || 50,
        after: parseInt(req.query.after as string) || undefined,
      });

      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        paths: result.paths,
        more: result.more,
        analyticsEnabled: true,
      });
    } catch (error) {
      console.error('Project paths fetch error:', error);
      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        paths: [],
        more: false,
        analyticsEnabled: true,
        error: 'Failed to fetch project paths',
      });
    }
  } catch (error) {
    console.error('Project paths error:', error);
    res.status(500).json({ error: 'Failed to fetch project paths' });
  }
};

export const getTotalCounts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Start date and end date are required' });
    }

    // Get project with analytics configuration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        'id, name, url, emoji, goatcounter_site_code, goatcounter_api_token'
      )
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const siteCode = project.goatcounter_site_code;
    const apiToken = project.goatcounter_api_token;

    if (!siteCode || !apiToken) {
      return res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        totals: null,
        analyticsEnabled: false,
        error:
          'GoatCounter site code or API token not configured for this project',
      });
    }

    try {
      const totals = await goatcounterClient.getTotalCount(
        siteCode,
        apiToken,
        startDate as string,
        endDate as string
      );

      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        totals,
        analyticsEnabled: true,
      });
    } catch (error) {
      console.error('Total counts fetch error:', error);
      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        totals: null,
        analyticsEnabled: true,
        error: 'Failed to fetch total counts',
      });
    }
  } catch (error) {
    console.error('Total counts error:', error);
    res.status(500).json({ error: 'Failed to fetch total counts' });
  }
};

export const getHitsData = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { projectId } = req.params;
    const { startDate, endDate, daily, limit } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Start date and end date are required' });
    }

    // Get project with analytics configuration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        'id, name, url, emoji, goatcounter_site_code, goatcounter_api_token'
      )
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const siteCode = project.goatcounter_site_code;
    const apiToken = project.goatcounter_api_token;

    if (!siteCode || !apiToken) {
      return res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        hits: [],
        analyticsEnabled: false,
        error:
          'GoatCounter site code or API token not configured for this project',
      });
    }

    try {
      const hits = await goatcounterClient.getHits(
        siteCode,
        apiToken,
        startDate as string,
        endDate as string,
        {
          daily: daily === 'true',
          limit: parseInt(limit as string) || 20,
        }
      );

      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        hits,
        analyticsEnabled: true,
      });
    } catch (error) {
      console.error('Hits data fetch error:', error);
      res.json({
        project: {
          id: project.id,
          name: project.name,
          url: project.url,
          emoji: project.emoji,
        },
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
        hits: [],
        analyticsEnabled: true,
        error: 'Failed to fetch hits data',
      });
    }
  } catch (error) {
    console.error('Hits data error:', error);
    res.status(500).json({ error: 'Failed to fetch hits data' });
  }
};

export const getUserSites = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Note: This endpoint requires a GoatCounter API token to be provided
    // Since this is a user-level endpoint, we would need the user to provide their token
    // For now, we'll return an error indicating that this functionality requires configuration
    res.json({
      user: null,
      sites: [],
      analyticsEnabled: true,
      error:
        'User sites endpoint requires a GoatCounter API token. Please configure your projects individually.',
    });
  } catch (error) {
    console.error('User sites error:', error);
    res.status(500).json({ error: 'Failed to fetch user sites' });
  }
};
