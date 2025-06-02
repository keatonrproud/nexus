// User types
export interface User {
  id: string;
  email: string;
  name: string;
  google_id: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

// Project types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  url: string;
  emoji?: string;
  goatcounter_site_code?: string;
  goatcounter_api_token?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  url: string;
  emoji?: string;
  goatcounter_site_code?: string;
  goatcounter_api_token?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  url?: string;
  emoji?: string;
  goatcounter_site_code?: string;
  goatcounter_api_token?: string;
}

// Board item types
export type BoardItemType = "bug" | "idea";
export type BoardItemPriority = "now" | "later";

export interface BoardItem {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  type: BoardItemType;
  priority: BoardItemPriority;
  created_at: string;
  updated_at: string;
}

export interface BoardStats {
  total: number;
  bugs: number;
  ideas: number;
  byPriority: {
    now: number;
    later: number;
  };
}

export interface CreateBoardItemRequest {
  title: string;
  description?: string;
  type: BoardItemType;
  priority?: BoardItemPriority;
}

export interface UpdateBoardItemRequest {
  title?: string;
  description?: string;
  priority?: BoardItemPriority;
}

// Analytics types
// GoatCounter API response types
export interface GoatCounterStats {
  total_pageviews: number;
  total_visitors: number;
  total_sessions?: number;
  bounce_rate?: number;
  // Additional properties that components expect
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

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

export interface GoatCounterAnalyticsData {
  stats: GoatCounterStats | null;
  pageViews: GoatCounterHit[] | null;
  topPages: GoatCounterMetric[] | null;
  referrers: GoatCounterMetric[] | null;
  countries: GoatCounterMetric[] | null;
  browsers: GoatCounterMetric[] | null;
  operatingSystems: GoatCounterMetric[] | null;
  devices: GoatCounterMetric[] | null;
}

// Site analytics for dashboard
export interface SiteAnalytics {
  projectId: string;
  projectName: string;
  projectUrl: string;
  projectEmoji?: string;
  siteCode: string | null;
  analytics: GoatCounterAnalyticsData | null;
  error?: string;
}

// Dashboard analytics response
export interface DashboardMetrics {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  sites: SiteAnalytics[];
  aggregatedStats: {
    totalPageviews: number;
    totalVisitors: number;
    totalSites: number;
    totalProjects?: number;
    failedProjects?: number;
  } | null;
  analyticsEnabled: boolean;
  warnings?: {
    message: string;
    details: string[];
    suggestion: string;
  };
}

// Project-specific analytics response
export interface ProjectAnalyticsData {
  project: {
    id: string;
    name: string;
    url: string;
    emoji?: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  siteCode?: string;
  analytics?: GoatCounterAnalyticsData;
  error?: string;
  analyticsEnabled: boolean;
}

// Analytics configuration
export interface AnalyticsConfig {
  enabled: boolean;
  events: Record<string, string>;
  goatcounterConfigured: boolean;
}

// Date range options for analytics
export interface DateRangeOption {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profile_picture_url?: string;
}

export interface LoginResponse {
  success: boolean;
  user: AuthUser;
  accessToken?: string;
  message?: string;
}

// Filter and search types
export interface BoardFilters {
  type?: BoardItemType;
  priority?: BoardItemPriority;
  tags?: string[];
  search?: string;
}

export interface ProjectFilters {
  search?: string;
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface OptimisticUpdate<T> {
  type: "create" | "update" | "delete";
  data: T;
  tempId?: string;
}

// Detailed analytics response types
export interface DetailedAnalyticsData {
  project: {
    id: string;
    name: string;
    url: string;
    emoji?: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  type:
    | "browsers"
    | "systems"
    | "locations"
    | "languages"
    | "sizes"
    | "campaigns"
    | "toprefs";
  data: GoatCounterMetric[];
  analyticsEnabled: boolean;
  error?: string;
}

export interface PathAnalyticsData {
  project: {
    id: string;
    name: string;
    url: string;
    emoji?: string;
  };
  pathId: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  referrals: GoatCounterMetric[];
  analyticsEnabled: boolean;
  error?: string;
}

export interface ProjectPathsData {
  project: {
    id: string;
    name: string;
    url: string;
    emoji?: string;
  };
  paths: GoatCounterPath[];
  more: boolean;
  analyticsEnabled: boolean;
  error?: string;
}

export interface TotalCountsData {
  project: {
    id: string;
    name: string;
    url: string;
    emoji?: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  totals: GoatCounterTotalCount | null;
  analyticsEnabled: boolean;
  error?: string;
}

export interface HitsData {
  project: {
    id: string;
    name: string;
    url: string;
    emoji?: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  hits: GoatCounterHit[];
  analyticsEnabled: boolean;
  error?: string;
}

export interface UserSitesData {
  user: GoatCounterUser | null;
  sites: GoatCounterSite[];
  analyticsEnabled: boolean;
  error?: string;
}
