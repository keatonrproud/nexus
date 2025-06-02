import {
  analyticsApi,
  formatDateForApi,
  getDateRangeOptions,
} from "@/services/analyticsService";
import type {
  DateRangeOption,
  DetailedAnalyticsData,
  GoatCounterMetric,
} from "@/types";
import {
  Assessment,
  Language,
  LocationOn,
  Monitor,
  Public,
  TrendingUp,
  Web,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
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
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

interface DetailedAnalyticsProps {
  projectId: string;
}

type AnalyticsType =
  | "browsers"
  | "systems"
  | "locations"
  | "languages"
  | "sizes"
  | "campaigns"
  | "toprefs";

interface TabData {
  type: AnalyticsType;
  label: string;
  icon: React.ReactElement;
}

const tabs: TabData[] = [
  { type: "browsers", label: "Browsers", icon: <Web /> },
  { type: "systems", label: "Operating Systems", icon: <Monitor /> },
  { type: "locations", label: "Locations", icon: <LocationOn /> },
  { type: "languages", label: "Languages", icon: <Language /> },
  { type: "sizes", label: "Screen Sizes", icon: <Assessment /> },
  { type: "toprefs", label: "Top Referrers", icon: <TrendingUp /> },
  { type: "campaigns", label: "Campaigns", icon: <Public /> },
];

const DetailedAnalytics = ({ projectId }: DetailedAnalyticsProps) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<AnalyticsType>("browsers");
  const [dateRange, setDateRange] = useState<DateRangeOption>(
    getDateRangeOptions()[0],
  ); // Last 7 days
  const [data, setData] = useState<DetailedAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyticsApi.getDetailedAnalytics(
        projectId,
        selectedTab,
        formatDateForApi(dateRange.startDate),
        formatDateForApi(dateRange.endDate, true),
        { limit: 20 },
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch detailed analytics",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, selectedTab, dateRange]);

  const createChartData = (metrics: GoatCounterMetric[]) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
    ];

    return {
      labels: metrics.map((item) => item.name),
      datasets: [
        {
          label: "Count",
          data: metrics.map((item) => item.count),
          backgroundColor: colors.slice(0, metrics.length),
          borderColor: colors.slice(0, metrics.length),
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.y} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Detailed Analytics
        </Typography>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateRange.value}
            label="Date Range"
            onChange={(e) => {
              const selectedRange = getDateRangeOptions().find(
                (option) => option.value === e.target.value,
              );
              if (selectedRange) {
                setDateRange(selectedRange);
              }
            }}
          >
            {getDateRangeOptions().map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Project info */}
      {data?.project && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[50] }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {data.project.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.project.url}
          </Typography>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.type}
              value={tab.type}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Content */}
      {isLoading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "2fr 1fr",
            },
            gap: 3,
          }}
        >
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Skeleton
                  variant="text"
                  width="40%"
                  height={24}
                  sx={{ mb: 2, borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={400}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Skeleton
                  variant="text"
                  width="40%"
                  height={24}
                  sx={{ mb: 2, borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={400}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : data?.data && data.data.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Charts Row */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "2fr 1fr",
              },
              gap: 3,
            }}
          >
            {/* Bar Chart */}
            <Card>
              <CardHeader
                title={`${tabs.find((t) => t.type === selectedTab)?.label} Distribution`}
                titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
                subheader={`Total entries: ${data.data.length}`}
              />
              <CardContent>
                <Box sx={{ height: 400, position: "relative" }}>
                  <Bar data={createChartData(data.data)} options={barOptions} />
                </Box>
              </CardContent>
            </Card>

            {/* Doughnut Chart */}
            <Card>
              <CardHeader
                title="Top 10 Distribution"
                titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
              />
              <CardContent>
                <Box sx={{ height: 400, position: "relative" }}>
                  <Doughnut
                    data={createChartData(data.data.slice(0, 10))}
                    options={chartOptions}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Data Table */}
          <Card>
            <CardHeader
              title="Detailed Breakdown"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
            />
            <CardContent>
              <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                {data.data.map((item, index) => {
                  const total = data.data.reduce((sum, d) => sum + d.count, 0);
                  const percentage = ((item.count / total) * 100).toFixed(1);

                  return (
                    <Box
                      key={item.id || index}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 1,
                        px: 2,
                        borderBottom: index < data.data.length - 1 ? 1 : 0,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ minWidth: 60, textAlign: "right", mr: 2 }}
                      >
                        {item.count.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: 50, textAlign: "right" }}
                      >
                        {percentage}%
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Alert severity="info">
          No data available for the selected time period and category.
        </Alert>
      )}
    </Container>
  );
};

export default DetailedAnalytics;
