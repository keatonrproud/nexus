import { SharedAnalyticsDashboard } from "@/components/analytics";
import { RouteLoadingWrapper } from "@/components/common/RouteLoadingWrapper";
import { ProjectList } from "@/components/projects";
import { useAuthContext } from "@/contexts";
import { useDashboardAnalytics, useProjects } from "@/hooks";
import { Box, Container, Fade } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

// Import the CrossAppBoard component
const CrossAppBoard = React.lazy(
  () => import("@/components/board/CrossAppBoard"),
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  // Get projects data to determine if we should show the CrossAppBoard
  const { projects, isLoading: projectsLoading } = useProjects();

  // Get analytics data to determine if we should show the analytics section
  const {
    metrics,
    isAnalyticsEnabled,
    isLoading: analyticsLoading,
  } = useDashboardAnalytics();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Determine if we should show CrossAppBoard
  // Show CrossAppBoard if:
  // 1. We have projects OR we're still loading projects
  const shouldShowCrossAppBoard =
    projectsLoading || (projects && projects.length > 0);

  // Determine if we should show analytics overview
  // Show analytics if:
  // 1. Analytics are enabled AND
  // 2. We have sites with analytics data OR we're still loading
  const shouldShowAnalytics =
    isAnalyticsEnabled &&
    (analyticsLoading ||
      (metrics?.sites && metrics.sites.length > 0) ||
      (metrics?.aggregatedStats && metrics.aggregatedStats.totalSites > 0));

  return (
    <RouteLoadingWrapper skeletonVariant="dashboard">
      <Container maxWidth="xl" sx={{ px: 0 }}>
        <Fade in timeout={600}>
          <Box>
            {/* Projects Section */}
            <Fade in timeout={800}>
              <Box marginBottom={{ xs: 2, sm: 4 }}>
                <ProjectList />
              </Box>
            </Fade>

            {/* Two-column layout for CrossAppBoard and Analytics */}
            {(shouldShowCrossAppBoard || shouldShowAnalytics) && (
              <Fade in timeout={1000}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      shouldShowCrossAppBoard && shouldShowAnalytics
                        ? { xs: "1fr", xl: "1fr 1fr" }
                        : "1fr",
                    gap: { xs: 2, sm: 4 },
                    alignItems: "start",
                  }}
                >
                  {/* Left Column: Cross-App Board - Only show if user has projects */}
                  {shouldShowCrossAppBoard && (
                    <Box>
                      <React.Suspense
                        fallback={
                          <Box sx={{ p: 3 }}>
                            <Box
                              sx={{
                                height: 400,
                                bgcolor: "grey.50",
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              Loading tasks...
                            </Box>
                          </Box>
                        }
                      >
                        <CrossAppBoard />
                      </React.Suspense>
                    </Box>
                  )}

                  {/* Right Column: Analytics - Only show if analytics are available */}
                  {shouldShowAnalytics && (
                    <Box>
                      <SharedAnalyticsDashboard />
                    </Box>
                  )}
                </Box>
              </Fade>
            )}
          </Box>
        </Fade>
      </Container>
    </RouteLoadingWrapper>
  );
};

export default Dashboard;
