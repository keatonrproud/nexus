import { DetailedAnalytics, KPIDashboard } from "@/components/analytics";
import { Layout } from "@/components/common";
import {
  Assessment as AnalyticsIcon,
  BarChart,
  Dashboard,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Container,
  Fade,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useParams } from "react-router-dom";

const Analytics = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);

  if (!projectId) {
    return (
      <Layout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              border: "none",
              boxShadow: "0 4px 20px rgba(239, 68, 68, 0.15)",
            }}
          >
            Project ID is required to view analytics.
          </Alert>
        </Container>
      </Layout>
    );
  }

  const tabs = [
    {
      label: "Overview",
      icon: <Dashboard />,
      component: <KPIDashboard projectId={projectId} />,
    },
    {
      label: "Detailed Analytics",
      icon: <BarChart />,
      component: <DetailedAnalytics projectId={projectId} />,
    },
  ];

  return (
    <Layout>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
              <AnalyticsIcon
                sx={{
                  fontSize: 40,
                  color: theme.palette.primary.main,
                  mr: 2,
                }}
              />
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Analytics Dashboard
              </Typography>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs
                value={selectedTab}
                onChange={(_, newValue) => setSelectedTab(newValue)}
                sx={{
                  "& .MuiTab-root": {
                    minHeight: 64,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                  },
                }}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    label={tab.label}
                    icon={tab.icon}
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </Box>
          </Container>

          {/* Tab Content */}
          <Fade in timeout={400} key={selectedTab}>
            <Box>{tabs[selectedTab].component}</Box>
          </Fade>
        </Box>
      </Fade>
    </Layout>
  );
};

export default Analytics;
