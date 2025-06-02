import { useProjectAnalytics } from "@/hooks";
import type { GoatCounterMetric } from "@/types";
import {
  AccessTime,
  Assessment,
  Computer,
  DevicesOther,
  Language,
  People,
  Public,
  Timeline,
  TouchApp,
  Visibility,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import React, { useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
  ChartDataLabels,
);

interface KPIDashboardProps {
  projectId: string;
}

const KPIDashboard = ({ projectId }: KPIDashboardProps) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const {
    analytics,
    dateRange,
    dateRangeOptions,
    setDateRange,
    isLoading,
    error,
  } = useProjectAnalytics(projectId);

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(244, 67, 54, 0.15)",
            border: "none",
          }}
        >
          Failed to load analytics data: {error.toString()}
        </Alert>
      </Container>
    );
  }

  if (analytics?.error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert
          severity="warning"
          sx={{
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(255, 152, 0, 0.15)",
            border: "none",
          }}
        >
          {analytics.error}
        </Alert>
      </Container>
    );
  }

  const stats = analytics?.analytics?.stats;
  const pageViews = analytics?.analytics?.pageViews || [];
  // Keep these commented for future use
  // const topPages = analytics?.analytics?.topPages || [];
  // const referrers = analytics?.analytics?.referrers || [];
  const countries = analytics?.analytics?.countries || [];
  const devices = analytics?.analytics?.devices || [];
  const browsers = analytics?.analytics?.browsers || [];
  const operatingSystems = analytics?.analytics?.operatingSystems || [];

  // Calculate derived metrics
  const hasValidStats = stats && stats.visits > 0;
  // Keep these commented for future use
  // const bounceRate = hasValidStats ? (stats.bounces / stats.visits) * 100 : 0;
  const avgSessionDuration = hasValidStats ? stats.totaltime / stats.visits : 0;
  // const pagesPerSession = hasValidStats ? stats.pageviews / stats.visits : 0;

  // Modified loading state approach
  const isLoadingData = isLoading || isChangingDate;

  // Helper functions
  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0m 0s";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  // Enhanced chart configurations with vibrant colors
  const vibrantColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
  ];

  // Calculate max value for y-axis formatting
  const calculateMaxYValue = (data: any) => {
    if (!data || !data.datasets || !data.datasets[0] || !data.datasets[0].data)
      return 10;

    const dataValues = data.datasets[0].data;
    let maxValue = Math.max(...dataValues);

    // Round up to nearest 10, then add 10 more if it's divisible by 10
    let roundedMax = Math.ceil(maxValue / 10) * 10;
    if (roundedMax % 10 === 0 && roundedMax === maxValue) {
      roundedMax += 10;
    }

    return Math.max(roundedMax, 10); // Minimum of 10
  };

  const createEnhancedChartOptions = (data: any) => {
    const maxYValue = calculateMaxYValue(data);

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          boxPadding: 4,
          usePointStyle: true,
        },
        datalabels: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: maxYValue,
          grid: {
            color: theme.palette.divider,
            drawBorder: false,
            drawTicks: false,
          },
          ticks: {
            color: theme.palette.text.secondary,
            font: {
              size: 10,
            },
            stepSize: 1,
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
          grid: {
            display: false,
          },
          ticks: {
            color: theme.palette.text.secondary,
            font: {
              size: 10,
            },
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
      elements: {
        line: {
          tension: 0.1,
        },
        point: {
          radius: 4,
          hoverRadius: 6,
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      },
    };
  };

  const createEnhancedBarData = (data: GoatCounterMetric[] | null) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Ensure all items in the array are valid objects with name and count properties
    const validItems = data.filter(
      (item) =>
        item && typeof item === "object" && "name" in item && "count" in item,
    );
    if (validItems.length === 0) return null;

    return {
      labels: validItems
        .slice(0, 8)
        .map((item) =>
          item.name && typeof item.name === "string" && item.name.length > 15
            ? item.name.substring(0, 15) + "..."
            : item.name || "Unknown",
        ),
      datasets: [
        {
          label: "Views",
          data: validItems.slice(0, 8).map((item) => Number(item.count) || 0),
          backgroundColor: vibrantColors[0] + "CC",
          borderColor: vibrantColors[0],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const createEnhancedLineData = () => {
    if (!pageViews || !Array.isArray(pageViews) || pageViews.length === 0)
      return null;

    // Ensure all items in pageViews have the required properties
    const validPageViews = pageViews.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.stats || (item.path && "count" in item)),
    );

    if (validPageViews.length === 0) return null;

    const chartData = validPageViews
      .flatMap((hit) => {
        if (!hit.stats || !Array.isArray(hit.stats)) return [];
        return hit.stats
          .filter(
            (stat) =>
              stat &&
              typeof stat === "object" &&
              "day" in stat &&
              "daily" in stat,
          )
          .map((stat) => ({
            date: stat.day,
            value: Number(stat.daily) || 0,
          }));
      })
      .sort((a, b) => {
        try {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } catch (e) {
          return 0;
        }
      });

    if (chartData.length === 0) {
      return {
        labels: validPageViews.slice(0, 10).map((hit) => hit.path || "Unknown"),
        datasets: [
          {
            label: "Page Views",
            data: validPageViews
              .slice(0, 10)
              .map((hit) => Number(hit.count) || 0),
            borderColor: vibrantColors[0],
            backgroundColor: `${vibrantColors[0]}20`,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: vibrantColors[0],
            pointBorderColor: "#fff",
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      };
    }

    return {
      labels: chartData.map((item) => {
        try {
          return new Date(item.date).toLocaleDateString();
        } catch (e) {
          return "Invalid Date";
        }
      }),
      datasets: [
        {
          label: "Page Views",
          data: chartData.map((item) => item.value),
          borderColor: vibrantColors[0],
          backgroundColor: `${vibrantColors[0]}20`,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: vibrantColors[0],
          pointBorderColor: "#fff",
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  const createEnhancedDoughnutData = (data: GoatCounterMetric[] | null) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Ensure all items in the array are valid objects with name and count properties
    const validItems = data.filter(
      (item) =>
        item && typeof item === "object" && "name" in item && "count" in item,
    );
    if (validItems.length === 0) return null;

    return {
      labels: validItems.slice(0, 8).map((item) => item.name || "Unknown"),
      datasets: [
        {
          data: validItems.slice(0, 8).map((item) => Number(item.count) || 0),
          backgroundColor: vibrantColors
            .slice(0, 8)
            .map((color) => `${color}E6`),
          borderColor: vibrantColors.slice(0, 8),
          borderWidth: 3,
          hoverBorderWidth: 4,
          cutout: "60%",
        },
      ],
    };
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: { size: 11, weight: 500 },
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
      },
    },
    cutout: "60%",
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        paddingTop: 2,
        paddingBottom: 2,
        width: "100%",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      {error && (
        <Alert
          severity="error"
          sx={{
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(244, 67, 54, 0.15)",
            border: "none",
            mb: 2,
          }}
        >
          Failed to load analytics data: {error.toString()}
        </Alert>
      )}

      {analytics?.error ? (
        <Alert
          severity="warning"
          sx={{
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(255, 152, 0, 0.15)",
            border: "none",
            mb: 2,
          }}
        >
          {analytics.error}
        </Alert>
      ) : (
        <>
          {/* Title and date filter - always visible */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: { xs: 2, sm: 0 },
              mb: 2,
              pb: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Assessment
                sx={{
                  fontSize: { xs: 28, sm: 35 },
                  mr: 1,
                  color: vibrantColors[0],
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

          {/* Conditional content based on loading state */}
          {isLoadingData ? (
            /* Loading skeletons for metrics and charts only */
            <>
              {/* Hero Metrics Skeletons */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: {
                    xs: 1,
                    sm: 2,
                  },
                  mb: 2,
                }}
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card
                    key={index}
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      p: 0,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      pb: 0,
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Skeleton
                          variant="circular"
                          width={24}
                          height={24}
                          sx={{ mr: 1 }}
                        />
                        <Skeleton
                          variant="text"
                          width="60%"
                          height={20}
                          sx={{ borderRadius: 1 }}
                        />
                      </Stack>
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={30}
                        sx={{ mx: "auto", borderRadius: 1 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Charts Skeletons */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                  mb: 2,
                  alignItems: "stretch",
                }}
              >
                {/* Left column skeleton */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    p: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    pb: 0,
                  }}
                >
                  <Box sx={{ p: 2, pb: 0 }}>
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={32}
                      sx={{ mb: 2, borderRadius: 1 }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pb: 0,
                      }}
                    >
                      <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={300}
                        sx={{ borderRadius: 2 }}
                      />
                    </Box>
                  </Box>
                </Card>

                {/* Right column skeleton */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    p: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    pb: 0,
                  }}
                >
                  <Box sx={{ p: 2, pb: 0 }}>
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={32}
                      sx={{ mb: 2, borderRadius: 1 }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pb: 0,
                      }}
                    >
                      <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={300}
                        sx={{ borderRadius: 2 }}
                      />
                    </Box>
                  </Box>
                </Card>
              </Box>
            </>
          ) : hasValidStats ? (
            <>
              {/* Hero Metrics - Beautiful Cards */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: {
                    xs: 1,
                    sm: 2,
                  },
                  mb: 2,
                }}
              >
                {/* Apply the card styles to all metric cards */}
                {[
                  {
                    icon: <Visibility sx={{ fontSize: 16 }} />,
                    color: vibrantColors[0],
                    title: "Total Views",
                    value: (stats.pageviews || 0).toLocaleString(),
                  },
                  {
                    icon: <People sx={{ fontSize: 16 }} />,
                    color: vibrantColors[1],
                    title: "Unique Visitors",
                    value: (stats.visitors || 0).toLocaleString(),
                  },
                  {
                    icon: <TouchApp sx={{ fontSize: 16 }} />,
                    color: vibrantColors[2],
                    title: "Total Sessions",
                    value: (stats.visits || 0).toLocaleString(),
                  },
                  {
                    icon: <AccessTime sx={{ fontSize: 16 }} />,
                    color: vibrantColors[5],
                    title: "Avg Session",
                    value: formatDuration(avgSessionDuration),
                  },
                ].map((card, index) => (
                  <Card
                    key={index}
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${card.color}15, ${card.color}05)`,
                      border: `1px solid ${card.color}30`,
                      transition: "transform 0.2s, box-shadow 0.2s",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: { xs: "auto", sm: "100%" },
                      minHeight: { xs: 80, sm: 120 },
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 12px 40px ${card.color}25`,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        textAlign: "center",
                        py: { xs: 1, sm: 1 },
                        px: { xs: 1, sm: 1.5 },
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        "&:last-child": { pb: { xs: 1, sm: 2 } },
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        justifyContent="center"
                        sx={{ mb: { xs: 0.5, sm: 1 } }}
                      >
                        <Avatar
                          sx={{
                            width: { xs: 20, sm: 24 },
                            height: { xs: 20, sm: 24 },
                            bgcolor: card.color,
                          }}
                        >
                          {React.cloneElement(card.icon, {
                            sx: { fontSize: { xs: 12, sm: 16 } },
                          })}
                        </Avatar>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                            lineHeight: 1.2,
                          }}
                        >
                          {card.title}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          mb: 0,
                          fontSize: { xs: "1.1rem", sm: "1.8rem" },
                          color: theme.palette.text.primary,
                          lineHeight: 1,
                        }}
                      >
                        {card.value}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Two-column layout with Traffic Trends and Tabbed Detail Charts */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                  mb: 2,
                  alignItems: "stretch",
                }}
              >
                {/* Left column - Traffic Trends */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: "hidden",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    pb: 0,
                  }}
                >
                  <CardContent
                    sx={{
                      p: 0,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      pb: 0,
                      "&:last-child": { pb: 0 },
                    }}
                  >
                    <Box
                      sx={{
                        p: 3,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: vibrantColors[0] }}>
                          <Timeline />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Traffic Trends
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Page views over time
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                      }}
                    >
                      {(() => {
                        const lineData = createEnhancedLineData();
                        return (
                          lineData && (
                            <Line
                              data={lineData}
                              options={createEnhancedChartOptions(lineData)}
                            />
                          )
                        );
                      })()}
                    </Box>
                  </CardContent>
                </Card>

                {/* Right column - Tabbed Detail Charts */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    pb: 0,
                  }}
                >
                  <CardContent
                    sx={{
                      p: 0,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      pb: 0,
                      "&:last-child": { pb: 0 },
                    }}
                  >
                    <Tabs
                      value={activeTab}
                      onChange={(_, newValue) => setActiveTab(newValue)}
                      variant="scrollable"
                      scrollButtons="auto"
                      TabIndicatorProps={{
                        style: { backgroundColor: theme.palette.primary.main },
                      }}
                      sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "& .MuiTab-root": {
                          minHeight: { xs: 48, sm: 56 },
                          py: { xs: 1, sm: 1.5 },
                          px: { xs: 1, sm: 3 },
                          minWidth: { xs: "auto", sm: 120 },
                          border: "none",
                          outline: "none",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          "&:hover": {
                            border: "none",
                            outline: "none",
                            borderColor: "transparent",
                          },
                          "&:focus": {
                            border: "none",
                            outline: "none",
                            borderColor: "transparent",
                          },
                          "&:active": {
                            border: "none",
                            outline: "none",
                            borderColor: "transparent",
                          },
                        },
                        "& .MuiTabs-flexContainer": {
                          justifyContent: "center",
                        },
                        "& .MuiTabs-indicator": {
                          backgroundColor: theme.palette.primary.main,
                        },
                        "& .Mui-selected": {
                          color: theme.palette.primary.main,
                          border: "none",
                          outline: "none",
                          "&:hover": {
                            border: "none",
                            outline: "none",
                            borderColor: "transparent",
                          },
                        },
                      }}
                    >
                      {devices && devices.length > 0 && (
                        <Tab
                          label={
                            <Box sx={{ display: { xs: "none", sm: "block" } }}>
                              Devices
                            </Box>
                          }
                          icon={<DevicesOther />}
                          iconPosition="start"
                          sx={{
                            textTransform: "none",
                            "& .MuiTab-iconWrapper": {
                              mb: { xs: 0, sm: 0 },
                              mr: { xs: 0, sm: 1 },
                            },
                          }}
                        />
                      )}
                      {browsers && browsers.length > 0 && (
                        <Tab
                          label={
                            <Box sx={{ display: { xs: "none", sm: "block" } }}>
                              Browsers
                            </Box>
                          }
                          icon={<Language />}
                          iconPosition="start"
                          sx={{
                            textTransform: "none",
                            "& .MuiTab-iconWrapper": {
                              mb: { xs: 0, sm: 0 },
                              mr: { xs: 0, sm: 1 },
                            },
                          }}
                        />
                      )}
                      {countries && countries.length > 0 && (
                        <Tab
                          label={
                            <Box sx={{ display: { xs: "none", sm: "block" } }}>
                              Countries
                            </Box>
                          }
                          icon={<Public />}
                          iconPosition="start"
                          sx={{
                            textTransform: "none",
                            "& .MuiTab-iconWrapper": {
                              mb: { xs: 0, sm: 0 },
                              mr: { xs: 0, sm: 1 },
                            },
                          }}
                        />
                      )}
                      {operatingSystems && operatingSystems.length > 0 && (
                        <Tab
                          label={
                            <Box sx={{ display: { xs: "none", sm: "block" } }}>
                              OS
                            </Box>
                          }
                          icon={<Computer />}
                          iconPosition="start"
                          sx={{
                            textTransform: "none",
                            "& .MuiTab-iconWrapper": {
                              mb: { xs: 0, sm: 0 },
                              mr: { xs: 0, sm: 1 },
                            },
                          }}
                        />
                      )}
                    </Tabs>

                    <Box
                      sx={{
                        flex: 1,
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* Tab Content */}
                      {(() => {
                        let tabIndex = 0;

                        // Browsers
                        if (browsers && browsers.length > 0) {
                          if (activeTab === tabIndex) {
                            const browsersData =
                              createEnhancedDoughnutData(browsers);
                            return (
                              browsersData && (
                                <Doughnut
                                  data={browsersData}
                                  options={doughnutOptions}
                                />
                              )
                            );
                          }
                          tabIndex++;
                        }

                        // Countries
                        if (countries && countries.length > 0) {
                          if (activeTab === tabIndex) {
                            const countriesData =
                              createEnhancedBarData(countries);
                            return (
                              countriesData && (
                                <Bar
                                  data={countriesData}
                                  options={createEnhancedChartOptions(
                                    countriesData,
                                  )}
                                />
                              )
                            );
                          }
                          tabIndex++;
                        }

                        // Operating Systems
                        if (operatingSystems && operatingSystems.length > 0) {
                          if (activeTab === tabIndex) {
                            const osData =
                              createEnhancedDoughnutData(operatingSystems);
                            return (
                              osData && (
                                <Doughnut
                                  data={osData}
                                  options={doughnutOptions}
                                />
                              )
                            );
                          }
                        }

                        return null;
                      })()}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </>
          ) : (
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${theme.palette.grey[100]}, ${theme.palette.grey[50]})`,
                border: `1px solid ${theme.palette.divider}`,
                textAlign: "center",
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: theme.palette.grey[300],
                  mx: "auto",
                  mb: 2,
                }}
              >
                <Assessment sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {analytics?.siteCode
                  ? "No Views Yet"
                  : "Analytics Not Configured"}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: "auto" }}
              >
                {analytics?.siteCode
                  ? "Your analytics is set up correctly, but there are no views to display yet. Check back later when your site has some traffic."
                  : "Configure GoatCounter analytics for this project to see detailed insights about your visitors, page views, and more."}
              </Typography>
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default KPIDashboard;
