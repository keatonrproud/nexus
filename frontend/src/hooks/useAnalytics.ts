import {
  analyticsApi,
  formatDateForApi,
  getDateRangeOptions,
} from "@/services/analyticsService";
import type { DateRangeOption } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useOptimisticQuery } from "./useOptimisticQuery";

// Hook for analytics configuration
export function useAnalyticsConfig() {
  const {
    data: config,
    isLoading,
    error,
    refetch,
  } = useOptimisticQuery({
    queryKey: ["analytics", "config"],
    queryFn: analyticsApi.getConfig,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    config,
    isLoading,
    error,
    refetch,
    isEnabled: config?.enabled ?? false,
  };
}

// Hook for dashboard analytics
export function useDashboardAnalytics(dateRange?: DateRangeOption) {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>(
    dateRange || getDateRangeOptions()[0], // Default to last 30 days
  );

  const queryKey = useMemo(() => {
    return [
      "analytics",
      "dashboard",
      formatDateForApi(selectedDateRange.startDate),
      formatDateForApi(selectedDateRange.endDate, true),
    ];
  }, [selectedDateRange]);

  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useOptimisticQuery({
    queryKey,
    queryFn: () =>
      analyticsApi.getDashboardMetrics(
        formatDateForApi(selectedDateRange.startDate),
        formatDateForApi(selectedDateRange.endDate, true),
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Track event mutation
  const trackEventMutation = useMutation({
    mutationFn: ({
      event,
      properties,
    }: {
      event: string;
      properties?: Record<string, any>;
    }) => analyticsApi.trackEvent(event, properties),
    onSuccess: () => {
      // Optionally refetch analytics after tracking events
      // refetch();
    },
    onError: (error: Error) => {
      console.error("Failed to track event:", error);
    },
  });

  return {
    // Data
    metrics,
    dateRange: selectedDateRange,
    dateRangeOptions: getDateRangeOptions(),

    // Loading states
    isLoading,
    isTrackingEvent: trackEventMutation.isPending,

    // Error states
    error,
    trackEventError: trackEventMutation.error,

    // Actions
    setDateRange: setSelectedDateRange,
    trackEvent: (event: string, properties?: Record<string, any>) =>
      trackEventMutation.mutate({ event, properties }),
    refetch,

    // Computed values
    hasData: !!metrics,
    isAnalyticsEnabled: metrics?.analyticsEnabled ?? false,
  };
}

// Hook for project-specific analytics
export function useProjectAnalytics(
  projectId: string,
  dateRange?: DateRangeOption,
) {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>(
    dateRange || getDateRangeOptions()[0], // Default to last 30 days
  );

  const queryKey = useMemo(() => {
    return [
      "analytics",
      "project",
      projectId,
      formatDateForApi(selectedDateRange.startDate),
      formatDateForApi(selectedDateRange.endDate, true),
    ];
  }, [projectId, selectedDateRange]);

  const {
    data: analytics,
    isLoading,
    error,
    refetch,
  } = useOptimisticQuery({
    queryKey,
    queryFn: () =>
      analyticsApi.getProjectAnalytics(
        projectId,
        formatDateForApi(selectedDateRange.startDate),
        formatDateForApi(selectedDateRange.endDate, true),
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!projectId,
  });

  // Track project-specific event mutation
  const trackEventMutation = useMutation({
    mutationFn: ({
      event,
      properties,
    }: {
      event: string;
      properties?: Record<string, any>;
    }) => analyticsApi.trackEvent(event, { ...properties, projectId }),
    onSuccess: () => {
      // Optionally refetch analytics after tracking events
      // refetch();
    },
    onError: (error: Error) => {
      console.error("Failed to track project event:", error);
    },
  });

  // Computed metrics for GoatCounter analytics
  const computedMetrics = useMemo(() => {
    if (!analytics?.analytics?.stats) return null;

    const stats = analytics.analytics.stats;

    return {
      bounceRate: stats.visits > 0 ? (stats.bounces / stats.visits) * 100 : 0,
      avgSessionDuration: stats.visits > 0 ? stats.totaltime / stats.visits : 0,
      pagesPerSession: stats.visits > 0 ? stats.pageviews / stats.visits : 0,
    };
  }, [analytics]);

  return {
    // Data
    analytics,
    computedMetrics,
    dateRange: selectedDateRange,
    dateRangeOptions: getDateRangeOptions(),

    // Loading states
    isLoading,
    isTrackingEvent: trackEventMutation.isPending,

    // Error states
    error,
    trackEventError: trackEventMutation.error,

    // Actions
    setDateRange: setSelectedDateRange,
    trackEvent: (event: string, properties?: Record<string, any>) =>
      trackEventMutation.mutate({ event, properties }),
    refetch,

    // Computed values
    hasData: !!analytics,
    isAnalyticsEnabled: analytics?.analyticsEnabled ?? false,
    projectId,
  };
}

// Hook for tracking events without fetching analytics
export function useEventTracking() {
  const trackEventMutation = useMutation({
    mutationFn: ({
      event,
      properties,
    }: {
      event: string;
      properties?: Record<string, any>;
    }) => analyticsApi.trackEvent(event, properties),
    onError: (error: Error) => {
      console.error("Failed to track event:", error);
    },
  });

  return {
    trackEvent: (event: string, properties?: Record<string, any>) =>
      trackEventMutation.mutate({ event, properties }),
    isTracking: trackEventMutation.isPending,
    error: trackEventMutation.error,
  };
}
