import type { BoardItemPriority, BoardItemType } from "@/types";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
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

interface ChartData {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

interface DistributionChartProps {
  title: string;
  data: ChartData[];
  total: number;
  chartType?: "doughnut" | "bar" | "simple";
}

interface TrendData {
  label: string;
  current: number;
  previous: number;
}

interface TrendChartProps {
  title: string;
  data: TrendData[];
  chartType?: "bar" | "simple";
}

// Enhanced distribution chart with Chart.js
const DistributionChart = ({
  title,
  data,
  total,
  chartType = "doughnut",
}: DistributionChartProps) => {
  const theme = useTheme();

  const getColorForItem = (label: string): string => {
    // Color mapping for different types
    const colorMap: Record<string, string> = {
      // Status colors
      open: theme.palette.info.main,
      "in-progress": theme.palette.warning.main,
      closed: theme.palette.success.main,

      // Priority colors
      low: theme.palette.success.light,
      medium: theme.palette.warning.main,
      high: theme.palette.error.light,
      critical: theme.palette.error.main,

      // Type colors
      bug: theme.palette.error.main,
      idea: theme.palette.primary.main,
    };

    return colorMap[label.toLowerCase()] || theme.palette.grey[500];
  };

  // Chart.js data configuration
  const chartData = {
    labels: data.map((item) =>
      item.label.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    ),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map(
          (item) => item.color || getColorForItem(item.label),
        ),
        borderColor: data.map(
          (item) => item.color || getColorForItem(item.label),
        ),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0";
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
      },
    },
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
        subheader={`Total: ${total} items`}
      />
      <CardContent>
        {chartType === "doughnut" && data.length > 0 ? (
          <Box sx={{ height: 250, position: "relative" }}>
            <Doughnut data={chartData} options={chartOptions} />
          </Box>
        ) : chartType === "bar" && data.length > 0 ? (
          <Box sx={{ height: 250, position: "relative" }}>
            <Bar data={chartData} options={barOptions} />
          </Box>
        ) : (
          // Fallback to simple progress bars
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.map((item) => (
              <Box key={item.label}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor:
                          item.color || getColorForItem(item.label),
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {item.label.replace("-", " ")}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.value} ({item.percentage.toFixed(1)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        item.color || getColorForItem(item.label),
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced trend comparison chart
const TrendChart = ({ title, data, chartType = "bar" }: TrendChartProps) => {
  const theme = useTheme();

  const getChangeColor = (current: number, previous: number): string => {
    if (current > previous) return theme.palette.success.main;
    if (current < previous) return theme.palette.error.main;
    return theme.palette.grey[500];
  };

  const getChangePercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Chart.js data for trends
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: "Previous",
        data: data.map((item) => item.previous),
        backgroundColor: theme.palette.grey[400],
        borderColor: theme.palette.grey[600],
        borderWidth: 1,
      },
      {
        label: "Current",
        data: data.map((item) => item.current),
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const dataIndex = context.dataIndex;
            const current = data[dataIndex].current;
            const previous = data[dataIndex].previous;
            const change = getChangePercentage(current, previous);
            return `Change: ${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
      />
      <CardContent>
        {chartType === "bar" && data.length > 0 ? (
          <Box sx={{ height: 250, position: "relative" }}>
            <Bar data={chartData} options={chartOptions} />
          </Box>
        ) : (
          // Fallback to simple comparison
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {data.map((item) => {
              const changePercentage = getChangePercentage(
                item.current,
                item.previous,
              );
              const changeColor = getChangeColor(item.current, item.previous);

              return (
                <Box key={item.label}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {item.label}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {item.current}
                    </Typography>
                    <Chip
                      label={`${changePercentage > 0 ? "+" : ""}${changePercentage.toFixed(1)}%`}
                      size="small"
                      sx={{
                        backgroundColor: changeColor,
                        color: "white",
                        fontWeight: 500,
                      }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Previous: {item.previous}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          (item.previous /
                            Math.max(item.current, item.previous)) *
                            100,
                          100,
                        )}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: theme.palette.grey[200],
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: theme.palette.grey[400],
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Current: {item.current}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          (item.current /
                            Math.max(item.current, item.previous)) *
                            100,
                          100,
                        )}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: theme.palette.grey[200],
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: changeColor,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Specific chart components for different data types
interface StatusDistributionProps {
  data: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  total: number;
}

export const StatusDistributionChart = ({
  data,
  total,
}: StatusDistributionProps) => (
  <DistributionChart
    title="Status Distribution"
    data={data.map((item) => ({
      label: item.status,
      value: item.count,
      percentage: item.percentage,
    }))}
    total={total}
    chartType="doughnut"
  />
);

interface PriorityDistributionProps {
  data: Array<{
    priority: BoardItemPriority;
    count: number;
    percentage: number;
  }>;
  total: number;
}

export const PriorityDistributionChart = ({
  data,
  total,
}: PriorityDistributionProps) => (
  <DistributionChart
    title="Priority Distribution"
    data={data.map((item) => ({
      label: item.priority,
      value: item.count,
      percentage: item.percentage,
    }))}
    total={total}
    chartType="bar"
  />
);

interface TypeDistributionProps {
  data: Array<{
    type: BoardItemType;
    count: number;
    percentage: number;
  }>;
  total: number;
}

export const TypeDistributionChart = ({
  data,
  total,
}: TypeDistributionProps) => (
  <DistributionChart
    title="Type Distribution"
    data={data.map((item) => ({
      label: item.type,
      value: item.count,
      percentage: item.percentage,
    }))}
    total={total}
    chartType="doughnut"
  />
);

interface ActivityTrendProps {
  trends: {
    itemsCreatedThisWeek: number;
    itemsClosedThisWeek: number;
    itemsCreatedThisMonth: number;
    itemsClosedThisMonth: number;
  };
}

export const ActivityTrendChart = ({ trends }: ActivityTrendProps) => (
  <TrendChart
    title="Activity Trends"
    data={[
      {
        label: "Created This Week",
        current: trends.itemsCreatedThisWeek,
        previous: 0, // We don't have previous week data yet
      },
      {
        label: "Closed This Week",
        current: trends.itemsClosedThisWeek,
        previous: 0,
      },
      {
        label: "Created This Month",
        current: trends.itemsCreatedThisMonth,
        previous: 0,
      },
      {
        label: "Closed This Month",
        current: trends.itemsClosedThisMonth,
        previous: 0,
      },
    ]}
    chartType="bar"
  />
);

export default {
  StatusDistributionChart,
  PriorityDistributionChart,
  TypeDistributionChart,
  ActivityTrendChart,
};
