import { formatNumber, formatPercentage } from "@/services/analyticsService";
import { TrendingDown, TrendingFlat, TrendingUp } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: number | string | undefined | null;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
  isLoading?: boolean;
  format?: "number" | "percentage" | "currency" | "none";
}

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "primary",
  onClick,
  isLoading = false,
  format = "number",
}: MetricCardProps) => {
  const theme = useTheme();

  const formatValue = (val: number | string | undefined | null): string => {
    if (typeof val === "string") return val;
    if (val === undefined || val === null) return "0";

    switch (format) {
      case "number":
        return formatNumber(val);
      case "percentage":
        return formatPercentage(val);
      case "currency":
        return `$${formatNumber(val)}`;
      default:
        return val.toString();
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    const trendValue = trend.value;
    if (trendValue > 0) {
      return trend.isPositive !== false ? <TrendingUp /> : <TrendingDown />;
    } else if (trendValue < 0) {
      return trend.isPositive !== false ? <TrendingDown /> : <TrendingUp />;
    }
    return <TrendingFlat />;
  };

  const getTrendColor = () => {
    if (!trend) return "default";

    const trendValue = trend.value;
    if (trendValue === 0) return "default";

    const isPositiveTrend =
      trend.isPositive !== false ? trendValue > 0 : trendValue < 0;
    return isPositiveTrend ? "success" : "error";
  };

  const CardWrapper = onClick ? CardActionArea : (Box as any);

  if (isLoading) {
    return (
      <Card
        sx={{
          height: "100%",
          minHeight: 140,
          display: "flex",
          flexDirection: "column",
          borderRadius: 1,
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
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
          </Box>
          <Skeleton
            variant="text"
            width="40%"
            height={32}
            sx={{ mb: 1, borderRadius: 1 }}
          />
          <Skeleton
            variant="text"
            width="80%"
            height={16}
            sx={{ mb: 1, borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width="30%"
            height={24}
            sx={{ borderRadius: 2 }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: "100%",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease-in-out",
        "&:hover": onClick
          ? {
              boxShadow: theme.shadows[4],
            }
          : {},
        borderLeft: `4px solid ${theme.palette[color].main}`,
      }}
    >
      <CardWrapper
        onClick={onClick}
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <CardContent
          sx={{
            flexGrow: 1,
            p: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Header with icon and title */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            {icon && (
              <Box
                sx={{
                  mr: 1,
                  color: theme.palette[color].main,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {icon}
              </Box>
            )}
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Main value */}
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 700,
              color: theme.palette[color].main,
              mb: 1,
              lineHeight: 1.2,
            }}
          >
            {formatValue(value)}
          </Typography>

          {/* Subtitle */}
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {subtitle}
            </Typography>
          )}

          {/* Trend indicator */}
          {trend && (
            <Box sx={{ display: "flex", alignItems: "center", mt: "auto" }}>
              <Chip
                icon={getTrendIcon() || undefined}
                label={`${trend.value > 0 ? "+" : ""}${formatPercentage(Math.abs(trend.value))} ${trend.label}`}
                size="small"
                color={getTrendColor()}
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  height: 24,
                  "& .MuiChip-icon": {
                    fontSize: "1rem",
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </CardWrapper>
    </Card>
  );
};

export default MetricCard;
