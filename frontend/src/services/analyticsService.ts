import type {
  AnalyticsConfig,
  DashboardMetrics,
  DetailedAnalyticsData,
  HitsData,
  PathAnalyticsData,
  ProjectAnalyticsData,
  ProjectPathsData,
  TotalCountsData,
  UserSitesData,
} from "@/types";
import apiClient from "./apiClient";

// Analytics API functions
export const analyticsApi = {
  // Get analytics configuration
  getConfig: async (): Promise<AnalyticsConfig> => {
    const response = await apiClient.get<AnalyticsConfig>("/analytics/config");
    return response.data;
  },

  // Get dashboard metrics (overview of all projects)
  getDashboardMetrics: async (
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardMetrics> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await apiClient.get<DashboardMetrics>(
      `/analytics/dashboard?${params.toString()}`,
    );
    return response.data;
  },

  // Get project-specific analytics
  getProjectAnalytics: async (
    projectId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ProjectAnalyticsData> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await apiClient.get<ProjectAnalyticsData>(
      `/analytics/projects/${projectId}?${params.toString()}`,
    );
    return response.data;
  },

  // Track custom event
  trackEvent: async (
    event: string,
    properties: Record<string, any> = {},
  ): Promise<{
    success: boolean;
    message: string;
    analyticsEnabled: boolean;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      analyticsEnabled: boolean;
    }>("/analytics/track", {
      event,
      properties,
    });
    return response.data;
  },

  // New detailed analytics endpoints

  // Get detailed analytics (browsers, systems, locations, etc.)
  getDetailedAnalytics: async (
    projectId: string,
    type:
      | "browsers"
      | "systems"
      | "locations"
      | "languages"
      | "sizes"
      | "campaigns"
      | "toprefs",
    startDate: string,
    endDate: string,
    options: {
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<DetailedAnalyticsData> => {
    const params = new URLSearchParams();
    params.append("type", type);
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.offset) params.append("offset", options.offset.toString());

    const response = await apiClient.get<DetailedAnalyticsData>(
      `/analytics/projects/${projectId}/detailed?${params.toString()}`,
    );
    return response.data;
  },

  // Get all paths for a project
  getProjectPaths: async (
    projectId: string,
    options: {
      limit?: number;
      after?: number;
    } = {},
  ): Promise<ProjectPathsData> => {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.after) params.append("after", options.after.toString());

    const response = await apiClient.get<ProjectPathsData>(
      `/analytics/projects/${projectId}/paths?${params.toString()}`,
    );
    return response.data;
  },

  // Get referrals for a specific path
  getPathReferrals: async (
    projectId: string,
    pathId: number,
    startDate: string,
    endDate: string,
    options: {
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<PathAnalyticsData> => {
    const params = new URLSearchParams();
    params.append("pathId", pathId.toString());
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.offset) params.append("offset", options.offset.toString());

    const response = await apiClient.get<PathAnalyticsData>(
      `/analytics/projects/${projectId}/path-referrals?${params.toString()}`,
    );
    return response.data;
  },

  // Get total counts for a project
  getTotalCounts: async (
    projectId: string,
    startDate: string,
    endDate: string,
  ): Promise<TotalCountsData> => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await apiClient.get<TotalCountsData>(
      `/analytics/projects/${projectId}/totals?${params.toString()}`,
    );
    return response.data;
  },

  // Get detailed hits data
  getHitsData: async (
    projectId: string,
    startDate: string,
    endDate: string,
    options: {
      daily?: boolean;
      limit?: number;
    } = {},
  ): Promise<HitsData> => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    if (options.daily !== undefined)
      params.append("daily", options.daily.toString());
    if (options.limit) params.append("limit", options.limit.toString());

    const response = await apiClient.get<HitsData>(
      `/analytics/projects/${projectId}/hits?${params.toString()}`,
    );
    return response.data;
  },

  // Get user's GoatCounter sites
  getUserSites: async (): Promise<UserSitesData> => {
    const response = await apiClient.get<UserSitesData>(
      "/analytics/user/sites",
    );
    return response.data;
  },
};

// Helper functions for date ranges
export const getDateRangeOptions = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      label: "Last 7 days",
      value: "7d",
      startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: today,
    },
    {
      label: "Last 30 days",
      value: "30d",
      startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: today,
    },
    {
      label: "Last 90 days",
      value: "90d",
      startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDate: today,
    },
    {
      label: "This month",
      value: "month",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: today,
    },
    {
      label: "Last month",
      value: "lastMonth",
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth(), 0),
    },
  ];
};

// Format date for API calls
export const formatDateForApi = (
  date: Date,
  isEndDate: boolean = false,
): string => {
  // If it's an end date, add 1 day to make it inclusive since GoatCounter uses exclusive end dates
  const dateToFormat = isEndDate
    ? new Date(date.getTime() + 24 * 60 * 60 * 1000)
    : date;
  return dateToFormat.toISOString().split("T")[0];
};

// Calculate percentage change
export const calculatePercentageChange = (
  current: number,
  previous: number,
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Format numbers for display
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return "0";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

// Format percentage for display
export const formatPercentage = (
  percentage: number | undefined | null,
): string => {
  if (percentage === undefined || percentage === null || isNaN(percentage)) {
    return "0.0%";
  }
  return `${percentage.toFixed(1)}%`;
};

export default analyticsApi;
