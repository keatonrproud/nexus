import { useDashboardAnalytics } from "@/hooks";
import { getProjectColors } from "@/utils";
import { TrendingUp, Visibility } from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useMemo, useState } from "react";
import { Line, Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

const SharedAnalyticsDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    metrics,
    dateRange,
    dateRangeOptions,
    setDateRange,
    isLoading,
    error,
  } = useDashboardAnalytics();

  const [isChangingDate, setIsChangingDate] = useState(false);
  const sites = metrics?.sites || [];
  const aggregatedStats = metrics?.aggregatedStats;

  // Check if there are any views across all sites
  const hasAnyViews = useMemo(() => {
    if (!aggregatedStats) return false;
    return aggregatedStats.totalPageviews > 0;
  }, [aggregatedStats]);

  // Filter sites to only include those with GoatCounter configuration
  const sitesWithAnalytics = useMemo(() => {
    const filtered = sites
      .filter((site) => {
        // Only include sites with both siteCode and analytics data
        return site.siteCode && site.analytics;
      })
      .sort((a, b) =>
        a.projectName.toLowerCase().localeCompare(b.projectName.toLowerCase()),
      );
    return filtered;
  }, [sites]);

  // Generate colors for each project (using same logic as ProjectList.tsx)
  const projectColors = useMemo(() => {
    return getProjectColors({
      projects: sites.map((site) => ({
        id: site.projectId,
        name: site.projectName,
      })),
    });
  }, [sites]);

  // Create comparative line chart data
  const createComparativeLineData = useMemo(() => {
    return () => {
      if (!sitesWithAnalytics.length) return null;

      // Collect all unique dates from all sites
      const allDates = new Set<string>();
      sitesWithAnalytics.forEach((site) => {
        if (site.analytics?.pageViews) {
          site.analytics.pageViews.forEach((hit) => {
            if (hit.stats) {
              hit.stats.forEach((stat) => {
                allDates.add(new Date(stat.day).toLocaleDateString());
              });
            }
          });
        }
      });

      const sortedDates = Array.from(allDates).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );

      const datasets = sitesWithAnalytics
        .filter(
          (site) =>
            site.analytics?.pageViews && site.analytics.pageViews.length > 0,
        )
        .map((site, index) => {
          const data = sortedDates.map((date) => {
            let totalForDate = 0;
            site.analytics?.pageViews?.forEach((hit) => {
              if (hit.stats) {
                const stat = hit.stats.find(
                  (s) => new Date(s.day).toLocaleDateString() === date,
                );
                if (stat) {
                  totalForDate += stat.daily;
                }
              }
            });
            return totalForDate;
          });

          // Include emoji in the label if available
          const projectLabel = site.projectEmoji
            ? `${site.projectEmoji} ${site.projectName}`
            : site.projectName;

          // Vary line styles to handle overlapping lines more distinctly
          const baseLineWidth = 2;
          const lineWidthVariation = Math.floor(index / 2) + 1; // Groups of 2 get same width: 1,1,2,2,3,3...
          const lineWidth = baseLineWidth + lineWidthVariation;

          // More distinct dash patterns
          const dashPatterns = [
            [], // solid
            [8, 4], // long dash
            [4, 4], // medium dash
            [2, 2], // short dash
            [8, 4, 2, 4], // dash-dot
            [8, 4, 2, 4, 2, 4], // dash-dot-dot
          ];
          const borderDash = dashPatterns[index % dashPatterns.length];

          return {
            label: projectLabel,
            data,
            borderColor: projectColors[site.projectId],
            backgroundColor: projectColors[site.projectId] + "20",
            tension: 0.1,
            fill: false,
            borderWidth: lineWidth,
            borderDash: borderDash,
            pointBackgroundColor: projectColors[site.projectId],
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 5 + (index % 2), // Alternate between 5 and 6 pixel radius
            pointHoverRadius: 8,
            // Slightly offset overlapping lines by adjusting the z-index
            order: index,
          };
        });

      return {
        labels: sortedDates,
        datasets,
      };
    };
  }, [sitesWithAnalytics, projectColors]);

  const chartData = useMemo(() => {
    return createComparativeLineData();
  }, [createComparativeLineData]);

  // Create pie chart data for project distribution
  const createPieChartData = useMemo(() => {
    return () => {
      if (!sitesWithAnalytics.length) return null;

      const projectData = sitesWithAnalytics
        .filter((site) => {
          return (
            site.analytics?.stats?.total_pageviews &&
            site.analytics.stats.total_pageviews > 0
          );
        })
        .map((site) => {
          // Include emoji in the label if available
          const projectLabel = site.projectEmoji
            ? `${site.projectEmoji} ${site.projectName}`
            : site.projectName;

          return {
            label: projectLabel,
            value: site.analytics?.stats?.total_pageviews || 0,
            color: projectColors[site.projectId],
          };
        })
        .sort((a, b) => b.value - a.value); // Sort by value descending

      if (!projectData.length) return null;

      return {
        labels: projectData.map((item) => item.label),
        datasets: [
          {
            data: projectData.map((item) => item.value),
            backgroundColor: projectData.map((item) => item.color),
            borderColor: projectData.map((item) => item.color),
            borderWidth: 2,
          },
        ],
      };
    };
  }, [sitesWithAnalytics, projectColors]);

  const pieChartData = useMemo(() => {
    return createPieChartData();
  }, [createPieChartData]);

  // Calculate max value for y-axis formatting
  const maxYValue = useMemo(() => {
    if (!chartData?.datasets) return 100;

    let maxValue = 0;
    chartData.datasets.forEach((dataset) => {
      const dataMax = Math.max(...dataset.data);
      if (dataMax > maxValue) maxValue = dataMax;
    });

    // Round up to nearest 10, then add 10 more if it's divisible by 10
    let roundedMax = Math.ceil(maxValue / 10) * 10;
    if (roundedMax % 10 === 0 && roundedMax === maxValue) {
      roundedMax += 10;
    }

    return Math.max(roundedMax, 10); // Minimum of 10
  }, [chartData]);

  const chartOptions = useMemo(() => {
    const legendPosition: "top" | "bottom" = isMobile ? "top" : "bottom";

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: !isSmallMobile, // Hide legend on small mobile when showing chips
          position: legendPosition,
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            boxWidth: isMobile ? 8 : 12,
            boxHeight: isMobile ? 8 : 12,
            padding: isMobile ? 8 : 20,
            font: {
              size: isMobile ? 10 : 14,
              weight: "bold" as const,
            },
            // On mobile, truncate long labels
            generateLabels: function (chart: any) {
              const original =
                ChartJS.defaults.plugins.legend.labels.generateLabels;
              const labels = original.call(this, chart);

              if (isMobile) {
                return labels.map((label: any) => ({
                  ...label,
                  text:
                    label.text.length > 15
                      ? label.text.substring(0, 12) + "..."
                      : label.text,
                }));
              }
              return labels;
            },
          },
        },
        datalabels: {
          display: false, // Disable datalabels for line charts
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: maxYValue,
          ticks: {
            stepSize: 1,
            font: {
              size: isMobile ? 10 : 12,
            },
            callback: function (value: any) {
              // Only show integer values
              if (Number.isInteger(value)) {
                return value.toLocaleString();
              }
              return "";
            },
          },
        },
        x: {
          ticks: {
            font: {
              size: isMobile ? 9 : 11,
            },
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 45 : 0,
          },
        },
      },
      // Handle overlapping lines by adjusting rendering order and styles
      interaction: {
        intersect: false,
        mode: "index" as const,
      },
      elements: {
        line: {
          tension: 0.1,
        },
        point: {
          radius: isMobile ? 3 : 4,
          hoverRadius: isMobile ? 5 : 6,
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      },
    };
  }, [maxYValue, isMobile, isSmallMobile]);

  const pieChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Hide the legend since we want labels on the chart
        },
        datalabels: {
          display: !isSmallMobile, // Disable data labels on very small screens
          color: theme.palette.text.primary,
          font: {
            weight: "bold" as const,
            size: isSmallMobile ? 10 : isMobile ? 12 : 15, // Responsive font size
          },
          formatter: (value: number, context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = (value / total) * 100;
            // Increase threshold for showing labels on mobile
            const threshold = isSmallMobile ? 15 : isMobile ? 10 : 5;
            if (percentage < threshold) return "";

            const label = context.chart.data.labels[context.dataIndex];
            // On mobile, show shorter labels
            if (isMobile && label.length > 12) {
              // Try to find the emoji and keep first few characters
              const emojiMatch = label.match(/^(\p{Emoji})\s*/u);
              if (emojiMatch) {
                const remainingText = label.replace(emojiMatch[0], "").trim();
                return `${emojiMatch[1]} ${remainingText.substring(0, 8)}${remainingText.length > 8 ? "..." : ""}`;
              }
              return label.substring(0, 10) + "...";
            }
            return label;
          },
          textAlign: "center" as const,
          anchor: "end" as const,
          align: "end" as const,
          offset: isMobile ? 5 : 10, // Smaller offset on mobile
          borderColor: theme.palette.background.paper,
          borderRadius: 4,
          borderWidth: 1,
          backgroundColor: theme.palette.background.paper + "dd",
          padding: isMobile ? 3 : 6, // Smaller padding on mobile
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || "";
              const value = context.raw || 0;
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0,
              );
              const percentage = ((value / total) * 100).toFixed(1);
              // Show absolute value prominently, then percentage
              return `${label}: ${value.toLocaleString()} views (${percentage}%)`;
            },
            // Add a title callback to show the total
            title: (context: any) => {
              if (context.length > 0) {
                const total = context[0].dataset.data.reduce(
                  (a: number, b: number) => a + b,
                  0,
                );
                return `Total: ${total.toLocaleString()} views`;
              }
              return "";
            },
          },
        },
      },
      // Enhanced layout for better label visibility - responsive padding
      layout: {
        padding: isSmallMobile ? 15 : isMobile ? 25 : 40,
      },
    }),
    [
      theme.palette.text.primary,
      theme.palette.background.paper,
      isMobile,
      isSmallMobile,
    ],
  );

  if (error) {
    return (
      <Box>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Alert severity="error">
            Failed to load analytics data: {error.toString()}
          </Alert>
        </Paper>
      </Box>
    );
  }

  // Modified loading state approach
  const isLoadingData = isLoading || isChangingDate;

  // Check if there are warnings from partial failures
  const hasWarnings = metrics?.warnings && metrics.warnings.details?.length > 0;

  return (
    <Box>
      <Paper
        sx={{
          p: 0,
          borderRadius: 2,
          height: "auto",
          overflow: "visible",
          backgroundColor: "background.paper",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {/* Header with title and actions */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: { xs: "flex-start", sm: "space-between" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1,
            pb: 2,
            px: { xs: 2, md: 3 },
            pt: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Title Row */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TrendingUp
              sx={{
                fontSize: { xs: 28, sm: 35 },
                mr: 1,
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              Analytics Dashboard
            </Typography>
          </Box>

          {/* Actions Row - stack on mobile, side by side on desktop */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {/* Total views chip - only show if there are views and not in loading state */}
            {aggregatedStats && hasAnyViews && !isLoadingData && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                <Chip
                  icon={<Visibility />}
                  label={`${aggregatedStats.totalPageviews.toLocaleString()} total views`}
                  color="secondary"
                  size="medium"
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    height: 40,
                    "& .MuiChip-label": {
                      color: theme.palette.text.primary,
                    },
                    "& .MuiChip-icon": {
                      color: theme.palette.text.primary,
                    },
                  }}
                />
              </Box>
            )}

            {/* Date Filter */}
            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 150 } }}
            >
              <Select
                value={dateRange.value}
                onChange={(e) => {
                  const selectedRange = dateRangeOptions.find(
                    (option) => option.value === e.target.value,
                  );
                  if (selectedRange) {
                    setIsChangingDate(true);
                    setDateRange(selectedRange);
                    // Reset the loading state after data is fetched
                    setTimeout(() => setIsChangingDate(false), 1000);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  height: "36px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  },
                }}
              >
                {dateRangeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 }, width: "100%", overflow: "hidden" }}>
          {/* Warnings for partial failures */}
          {!isLoadingData && hasWarnings && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                borderRadius: 3,
                border: "none",
                boxShadow: "0 4px 20px rgba(255, 152, 0, 0.15)",
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {metrics.warnings?.message}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {metrics.warnings?.suggestion}
                </Typography>

                {/* Collapsible details */}
                <details style={{ marginTop: 8 }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    View Error Details
                  </summary>
                  <Box
                    sx={{
                      mt: 1,
                      pl: 2,
                      borderLeft: `2px solid ${theme.palette.warning.main}`,
                    }}
                  >
                    {metrics.warnings?.details?.map(
                      (detail: string, index: number) => (
                        <Typography
                          key={index}
                          variant="caption"
                          sx={{
                            display: "block",
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            color: theme.palette.text.secondary,
                            mt: 0.5,
                          }}
                        >
                          • {detail}
                        </Typography>
                      ),
                    ) || []}
                  </Box>
                </details>
              </Box>
            </Alert>
          )}

          {/* No views message - show when not loading */}
          {!isLoadingData && !hasAnyViews && sitesWithAnalytics.length > 0 && (
            <Alert
              severity="info"
              sx={{
                mb: 3,
                borderRadius: 3,
                border: "none",
                boxShadow: "0 4px 20px rgba(33, 150, 243, 0.15)",
              }}
            >
              No views found across all sites in the selected time period (
              {dateRange.label.toLowerCase()}). Try selecting a different date
              range or check if your analytics are properly configured.
            </Alert>
          )}

          {/* Loading skeleton for charts */}
          {isLoadingData ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                gap: { xs: 2, md: 3 },
                width: "100%",
              }}
            >
              <Skeleton
                variant="rectangular"
                height={350}
                sx={{ borderRadius: 2, width: "100%" }}
              />
              <Skeleton
                variant="rectangular"
                height={350}
                sx={{ borderRadius: 2, width: "100%" }}
              />
            </Box>
          ) : (
            /* Charts Grid - only show if there are views */
            sitesWithAnalytics.length > 0 &&
            hasAnyViews && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                  gap: { xs: 2, md: 3 },
                  alignItems: "start",
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                {/* Left: Project Distribution Pie Chart */}
                {pieChartData && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 1.5, md: 3 },
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      width: "100%",
                      maxWidth: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        fontSize: { xs: "1rem", md: "1.25rem" },
                      }}
                    >
                      Views by Project
                    </Typography>
                    <Box
                      sx={{
                        height: { xs: 220, sm: 250, md: 300 },
                        position: "relative",
                        width: "100%",
                        maxWidth: "100%",
                        overflow: "hidden",
                      }}
                    >
                      <Pie data={pieChartData} options={pieChartOptions} />
                    </Box>
                    {/* Show legend below chart on small mobile when data labels are hidden */}
                    {isSmallMobile && (
                      <Box sx={{ mt: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            justifyContent: "center",
                          }}
                        >
                          {pieChartData.labels.map((label, index) => (
                            <Chip
                              key={index}
                              label={`${label}: ${pieChartData.datasets[0].data[index]}`}
                              size="small"
                              sx={{
                                backgroundColor:
                                  pieChartData.datasets[0].backgroundColor[
                                    index
                                  ] + "20",
                                borderLeft: `3px solid ${pieChartData.datasets[0].backgroundColor[index]}`,
                                color: theme.palette.text.primary,
                                fontSize: "0.65rem",
                                height: 24,
                                maxWidth: "calc(50% - 2px)", // Ensure max 2 chips per row
                                "& .MuiChip-label": {
                                  px: 1,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Right: Page Views Over Time */}
                {chartData && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 1.5, md: 3 },
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      width: "100%",
                      maxWidth: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        fontSize: { xs: "1rem", md: "1.25rem" },
                      }}
                    >
                      Page Views Over Time
                    </Typography>
                    <Box
                      sx={{
                        height: { xs: 220, sm: 250, md: 300 },
                        position: "relative",
                        width: "100%",
                        maxWidth: "100%",
                        overflow: "hidden",
                      }}
                    >
                      <Line data={chartData} options={chartOptions} />
                    </Box>
                    {/* Show legend below chart on small mobile with truncated legend */}
                    {isSmallMobile && chartData && (
                      <Box sx={{ mt: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            justifyContent: "center",
                          }}
                        >
                          {chartData.datasets.map((dataset, index) => (
                            <Chip
                              key={index}
                              label={dataset.label}
                              size="small"
                              sx={{
                                backgroundColor: dataset.borderColor + "20",
                                borderLeft: `3px solid ${dataset.borderColor}`,
                                color: theme.palette.text.primary,
                                fontSize: "0.65rem",
                                height: 24,
                                maxWidth: "calc(50% - 2px)", // Ensure max 2 chips per row
                                "& .MuiChip-label": {
                                  px: 1,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                )}
              </Box>
            )
          )}

          {/* No data state - show when not loading */}
          {!isLoadingData && sitesWithAnalytics.length === 0 && (
            <Alert severity="info">
              No analytics data available. Make sure your projects have
              GoatCounter analytics configured.
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SharedAnalyticsDashboard;
