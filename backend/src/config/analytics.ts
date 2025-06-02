import axios from 'axios';

export interface GoatCounterHit {
  count: number;
  path_id: number;
  path: string;
  event: boolean;
  title: string;
  max: number;
  stats: GoatCounterHitStat[];
  ref_scheme?: string;
}

export interface GoatCounterHitStat {
  day: string;
  hourly: number[];
  daily: number;
}

export interface GoatCounterMetric {
  id: string;
  name: string;
  count: number;
  ref_scheme?: string;
}

export interface GoatCounterTotalCount {
  total: number;
  total_events: number;
  total_utc: number;
}

export interface GoatCounterPath {
  id: number;
  path: string;
  title: string;
  event: boolean;
}

export interface GoatCounterSite {
  id: number;
  code: string;
  cname: string;
  link_domain: string;
  created_at: string;
  updated_at: string;
}

export interface GoatCounterUser {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

// Enhanced rate limiter class with retry logic for GoatCounter's API limits
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 300; // 300ms between requests (slightly conservative for 4 per second)
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second base delay

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(fn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Check if this is a rate limit error
      if (this.isRateLimitError(error) && attempt <= this.maxRetries) {
        const waitTime = this.calculateRetryDelay(error, attempt);
        console.warn(
          `Rate limit hit (attempt ${attempt}/${this.maxRetries}). Retrying in ${waitTime}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.executeWithRetry(fn, attempt + 1);
      }

      // If it's not a rate limit error or we've exhausted retries, throw the error
      throw error;
    }
  }

  private isRateLimitError(error: any): boolean {
    return (
      error?.response?.status === 429 ||
      error?.code === 'ECONNRESET' ||
      (error?.response?.data?.error &&
        typeof error.response.data.error === 'string' &&
        error.response.data.error.includes('rate limit'))
    );
  }

  private calculateRetryDelay(error: any, attempt: number): number {
    // Try to parse the retry-after header or error message
    let retryAfter = 0;

    if (error?.response?.headers?.['retry-after']) {
      retryAfter = parseInt(error.response.headers['retry-after'], 10) * 1000;
    } else if (
      error?.response?.data?.error &&
      typeof error.response.data.error === 'string'
    ) {
      // Parse "rate limited exceeded; try again in 7.632748ms" format
      const match = error.response.data.error.match(/try again in ([\d.]+)ms/);
      if (match) {
        retryAfter = Math.ceil(parseFloat(match[1]));
      }
    }

    // Use exponential backoff if no specific retry time is provided
    if (retryAfter === 0) {
      retryAfter = this.baseRetryDelay * Math.pow(2, attempt - 1);
    }

    // Add some jitter to avoid thundering herd
    const jitter = Math.random() * 200; // 0-200ms jitter
    return Math.max(retryAfter + jitter, this.minInterval);
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minInterval) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }

      const fn = this.queue.shift();
      if (fn) {
        this.lastRequestTime = Date.now();
        await fn();
      }
    }

    this.processing = false;
  }
}

class GoatCounterClient {
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter();
  }

  private getApiUrl(siteCode: string): string {
    return `https://${siteCode}.goatcounter.com/api/v0`;
  }

  private getHeaders(apiToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Nexus/1.0',
    };
  }

  private handleApiError(error: any, operation: string): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      console.error(`GoatCounter ${operation} API error:`, {
        status,
        data,
        url: error.config?.url,
      });

      if (status === 401) {
        throw new Error(
          `Authentication failed for GoatCounter API. Please check your API token.`
        );
      } else if (status === 403) {
        throw new Error(
          `Access forbidden. Please check your GoatCounter permissions.`
        );
      } else if (status === 404) {
        throw new Error(
          `GoatCounter site not found. Please check your site code.`
        );
      } else if (status === 429) {
        throw new Error(
          `Rate limit exceeded for GoatCounter API. This should be retried automatically.`
        );
      } else {
        throw new Error(
          `GoatCounter API error (${status}): ${data?.error || 'Unknown error'}`
        );
      }
    } else if (error.request) {
      console.error(`GoatCounter ${operation} network error:`, error.message);
      throw new Error(
        `Network error connecting to GoatCounter API. Please check your internet connection.`
      );
    } else {
      console.error(`GoatCounter ${operation} error:`, error.message);
      throw new Error(
        `Failed to fetch ${operation} data from GoatCounter: ${error.message}`
      );
    }
  }

  /**
   * Get pageview and visitor statistics
   * GET /api/v0/stats/hits
   */
  async getHits(
    siteCode: string,
    apiToken: string,
    startDate: string,
    endDate: string,
    options: {
      daily?: boolean;
      limit?: number;
      includePaths?: number[];
      excludePaths?: number[];
    } = {}
  ): Promise<GoatCounterHit[]> {
    return this.rateLimiter.execute(async () => {
      try {
        const params: any = {
          start: startDate,
          end: endDate,
        };

        if (options.daily !== undefined) params.daily = options.daily;
        if (options.limit !== undefined) params.limit = options.limit;
        if (options.includePaths)
          params.include_paths = options.includePaths.join(',');
        if (options.excludePaths)
          params.exclude_paths = options.excludePaths.join(',');

        const response = await axios.get(
          `${this.getApiUrl(siteCode)}/stats/hits`,
          {
            headers: this.getHeaders(apiToken),
            params,
            timeout: 10000, // 10 second timeout
          }
        );

        return response.data.hits || [];
      } catch (error) {
        this.handleApiError(error, 'hits');
      }
    });
  }

  /**
   * Get total pageview count for date range
   * GET /api/v0/stats/total
   */
  async getTotalCount(
    siteCode: string,
    apiToken: string,
    startDate: string,
    endDate: string,
    includePaths?: number[]
  ): Promise<GoatCounterTotalCount> {
    return this.rateLimiter.execute(async () => {
      try {
        const params: any = {
          start: startDate,
          end: endDate,
        };

        if (includePaths) params.include_paths = includePaths.join(',');

        const response = await axios.get(
          `${this.getApiUrl(siteCode)}/stats/total`,
          {
            headers: this.getHeaders(apiToken),
            params,
            timeout: 10000, // 10 second timeout
          }
        );

        return response.data;
      } catch (error) {
        this.handleApiError(error, 'total count');
      }
    });
  }

  /**
   * Get browser/system/location/etc stats
   * GET /api/v0/stats/{page}
   * Page can be: browsers, systems, locations, languages, sizes, campaigns, toprefs
   */
  async getStatsPage(
    siteCode: string,
    apiToken: string,
    page:
      | 'browsers'
      | 'systems'
      | 'locations'
      | 'languages'
      | 'sizes'
      | 'campaigns'
      | 'toprefs',
    startDate: string,
    endDate: string,
    options: {
      limit?: number;
      offset?: number;
      includePaths?: number[];
    } = {}
  ): Promise<GoatCounterMetric[]> {
    return this.rateLimiter.execute(async () => {
      try {
        const params: any = {
          start: startDate,
          end: endDate,
        };

        if (options.limit !== undefined) params.limit = options.limit;
        if (options.offset !== undefined) params.offset = options.offset;
        if (options.includePaths)
          params.include_paths = options.includePaths.join(',');

        const response = await axios.get(
          `${this.getApiUrl(siteCode)}/stats/${page}`,
          {
            headers: this.getHeaders(apiToken),
            params,
            timeout: 10000, // 10 second timeout
          }
        );

        return response.data.stats || [];
      } catch (error) {
        this.handleApiError(error, `${page} stats`);
      }
    });
  }

  /**
   * Get detailed stats for a specific browser/system/etc ID
   * GET /api/v0/stats/{page}/{id}
   */
  async getStatsPageDetail(
    siteCode: string,
    apiToken: string,
    page:
      | 'browsers'
      | 'systems'
      | 'locations'
      | 'sizes'
      | 'campaigns'
      | 'toprefs',
    id: string,
    startDate: string,
    endDate: string,
    options: {
      limit?: number;
      offset?: number;
      includePaths?: number[];
    } = {}
  ): Promise<GoatCounterMetric[]> {
    return this.rateLimiter.execute(async () => {
      try {
        const params: any = {
          start: startDate,
          end: endDate,
        };

        if (options.limit !== undefined) params.limit = options.limit;
        if (options.offset !== undefined) params.offset = options.offset;
        if (options.includePaths)
          params.include_paths = options.includePaths.join(',');

        const response = await axios.get(
          `${this.getApiUrl(siteCode)}/stats/${page}/${id}`,
          {
            headers: this.getHeaders(apiToken),
            params,
            timeout: 10000, // 10 second timeout
          }
        );

        return response.data.stats || [];
      } catch (error) {
        this.handleApiError(error, `${page} detail stats`);
      }
    });
  }

  /**
   * Get referral stats for a specific path
   * GET /api/v0/stats/hits/{path_id}
   */
  async getPathReferrals(
    siteCode: string,
    apiToken: string,
    pathId: number,
    startDate: string,
    endDate: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<GoatCounterMetric[]> {
    return this.rateLimiter.execute(async () => {
      try {
        const params: any = {
          start: startDate,
          end: endDate,
        };

        if (options.limit !== undefined) params.limit = options.limit;
        if (options.offset !== undefined) params.offset = options.offset;

        const response = await axios.get(
          `${this.getApiUrl(siteCode)}/stats/hits/${pathId}`,
          {
            headers: this.getHeaders(apiToken),
            params,
            timeout: 10000, // 10 second timeout
          }
        );

        return response.data.refs || [];
      } catch (error) {
        this.handleApiError(error, 'path referrals');
      }
    });
  }

  /**
   * Get overview of all paths on the site
   * GET /api/v0/paths
   */
  async getPaths(
    siteCode: string,
    apiToken: string,
    options: {
      limit?: number;
      after?: number;
    } = {}
  ): Promise<{ paths: GoatCounterPath[]; more: boolean }> {
    return this.rateLimiter.execute(async () => {
      try {
        const params: any = {};

        if (options.limit !== undefined) params.limit = options.limit;
        if (options.after !== undefined) params.after = options.after;

        const response = await axios.get(`${this.getApiUrl(siteCode)}/paths`, {
          headers: this.getHeaders(apiToken),
          params,
          timeout: 10000, // 10 second timeout
        });

        return {
          paths: response.data.paths || [],
          more: response.data.more || false,
        };
      } catch (error) {
        this.handleApiError(error, 'paths');
      }
    });
  }

  /**
   * Get information about the current user
   * GET /api/v0/me
   */
  async getCurrentUser(
    apiToken: string
  ): Promise<{ user: GoatCounterUser; sites: GoatCounterSite[] }> {
    return this.rateLimiter.execute(async () => {
      try {
        // Note: This endpoint doesn't use site-specific URL
        const response = await axios.get(`https://goatcounter.com/api/v0/me`, {
          headers: this.getHeaders(apiToken),
          timeout: 10000, // 10 second timeout
        });

        return {
          user: response.data.user,
          sites: response.data.sites || [],
        };
      } catch (error) {
        this.handleApiError(error, 'user info');
      }
    });
  }

  /**
   * List all sites for the current user
   * GET /api/v0/sites
   */
  async getSites(apiToken: string): Promise<GoatCounterSite[]> {
    return this.rateLimiter.execute(async () => {
      try {
        // Note: This endpoint doesn't use site-specific URL
        const response = await axios.get(
          `https://goatcounter.com/api/v0/sites`,
          {
            headers: this.getHeaders(apiToken),
            timeout: 10000, // 10 second timeout
          }
        );

        return response.data.sites || [];
      } catch (error) {
        this.handleApiError(error, 'sites');
      }
    });
  }

  /**
   * Track pageview (server-side)
   * POST /api/v0/count
   */
  async trackPageview(
    siteCode: string,
    apiToken: string,
    path: string,
    title?: string,
    referrer?: string
  ): Promise<void> {
    return this.rateLimiter.execute(async () => {
      try {
        const hit = {
          path,
          title: title || '',
          ref: referrer || '',
          size: [0, 0], // Screen size, can be omitted for server-side tracking
        };

        await axios.post(
          `${this.getApiUrl(siteCode)}/count`,
          {
            no_sessions: false,
            hits: [hit],
          },
          {
            headers: this.getHeaders(apiToken),
            timeout: 10000, // 10 second timeout
          }
        );
      } catch (error) {
        console.error('GoatCounter tracking error:', error);
        // Don't throw error for tracking failures to avoid breaking the main flow
        // But still apply rate limiting for failed requests
      }
    });
  }
}

// Analytics service for tracking events
class AnalyticsService {
  async track(
    eventType: string,
    data: Record<string, any>,
    siteCode?: string
  ): Promise<void> {
    try {
      if (siteCode && analyticsConfig.goatcounter.enabled) {
        // Track with GoatCounter if site code is provided
        await goatcounterClient.trackPageview(
          siteCode,
          data.path || `/${eventType}`,
          data.title || eventType,
          data.referrer
        );
      }

      // Log the event for debugging
      console.log(`Analytics event: ${eventType}`, data);
    } catch (error) {
      console.error('Analytics tracking failed:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
}

export const goatcounterClient = new GoatCounterClient();
export const analyticsService = new AnalyticsService();

export const analyticsConfig = {
  goatcounter: {
    enabled: true, // Always enabled since we check per-project tokens
    rateLimit: {
      requests: 4, // 4 requests per second
      window: 1000, // 1 second window
    },
  },
  events: {
    userSignup: 'user_signup',
    userLogin: 'user_login',
    projectCreated: 'project_created',
    projectDeleted: 'project_deleted',
    bugReported: 'bug_reported',
    ideaCreated: 'idea_created',
    itemStatusChanged: 'item_status_changed',
    itemPriorityChanged: 'item_priority_changed',
    itemDeleted: 'item_deleted',
  },
};
