import { useProjects } from "@/hooks";
import apiClient from "@/services/apiClient";
import type {
  CreateProjectRequest,
  Project,
  UpdateProjectRequest,
} from "@/types";
import { getProjectColors } from "@/utils";
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Folder as ProjectIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Fade,
  Paper,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import { useQueries } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { ProjectForm } from "./ProjectForm";

interface ProjectListProps {
  // Future: onProjectSelect?: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = () => {
  const theme = useTheme();

  const [searchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Use projects hook with search filter
  const {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
  } = useProjects(searchQuery ? { search: searchQuery } : undefined);

  // Use React Query to fetch project stats in parallel with improved configuration
  const projectQueries = useQueries({
    queries: useMemo(
      () =>
        projects.map((project) => ({
          queryKey: ["project-stats", project.id],
          queryFn: async () => {
            const response = await apiClient.get<{
              success: boolean;
              stats: {
                bugs: number;
                ideas: number;
              };
            }>(`/board/${project.id}/stats`);
            return {
              projectId: project.id,
              stats: response.data.success
                ? response.data.stats
                : { bugs: 0, ideas: 0 },
            };
          },
          staleTime: 5 * 60 * 1000, // 5 minutes (increased from 2)
          cacheTime: 10 * 60 * 1000, // 10 minutes
          // Start fetching immediately when projects are available
          enabled: !!project.id,
          // Don't refetch on window focus to reduce unnecessary calls
          refetchOnWindowFocus: false,
          // Use retry with exponential backoff
          retry: 2,
          retryDelay: (attemptIndex: number) =>
            Math.min(1000 * 2 ** attemptIndex, 10000),
        })),
      [projects],
    ),
  });

  // Convert the array of queries into a record for easy lookup
  const projectStats = useMemo(() => {
    const statsObj: Record<string, { bugs: number; ideas: number }> = {};

    projectQueries.forEach((query) => {
      if (query.data) {
        statsObj[query.data.projectId] = query.data.stats;
      }
    });

    return statsObj;
  }, [projectQueries]);

  // Filter projects based on search query (client-side for immediate feedback)
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.url.toLowerCase().includes(query),
      );
    }

    // Always sort alphabetically by project name (case-insensitive)
    return result.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  }, [projects, searchQuery]);

  // Generate consistent colors for all projects (not just filtered ones)
  const projectColors = useMemo(() => {
    return getProjectColors({
      projects: projects, // Use all projects, not just filtered ones
    });
  }, [projects]);

  // Add a new state to track if we should show the projects or loading skeletons
  const [showLoadingSkeletons, setShowLoadingSkeletons] = useState(true);

  // Calculate if all essential data is loaded
  const areStatsLoading = useMemo(() => {
    // If project data is still loading, we're definitely loading
    if (isLoading) return true;

    // If there are no projects, we're not loading stats
    if (projects.length === 0) return false;

    // Check if we have stats for all projects
    const loadingQueries = projectQueries.filter(
      (query) => query.isLoading || query.isFetching,
    );

    // If more than 50% of queries are still loading, consider the whole set as loading
    return loadingQueries.length > projects.length * 0.5;
  }, [isLoading, projects, projectQueries]);

  // Update the loading state
  useEffect(() => {
    // If not loading, set to false immediately
    if (!areStatsLoading) {
      setShowLoadingSkeletons(false);
      return;
    }

    // If loading, set a short delay to prevent flickering
    const timer = setTimeout(() => {
      setShowLoadingSkeletons(areStatsLoading);
    }, 100);

    return () => clearTimeout(timer);
  }, [areStatsLoading]);

  const handleCreateProject = (data: CreateProjectRequest) => {
    createProject(data);
    setFormOpen(false);
  };

  const handleUpdateProject = (data: UpdateProjectRequest) => {
    if (!editingProject) return;

    updateProject(editingProject.id, data);
    setEditingProject(null);
    setFormOpen(false);
  };

  const handleFormSubmit = (
    data: CreateProjectRequest | UpdateProjectRequest,
  ) => {
    if (editingProject) {
      handleUpdateProject(data as UpdateProjectRequest);
    } else {
      handleCreateProject(data as CreateProjectRequest);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProject(null);
  };

  const getGridColumns = () => {
    return {
      xs: "repeat(2, 1fr)", // 2 columns on mobile for narrow cards
      sm: "repeat(2, 1fr)",
      md: "repeat(3, 1fr)",
      lg: "repeat(4, 1fr)",
      xl: "repeat(5, 1fr)",
    };
  };

  // Render loading skeletons
  const renderLoadingSkeletons = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <Fade in timeout={300 + index * 100} key={index}>
        <div>
          <Card
            sx={{
              height: "100%",
              borderRadius: 2,
              position: "relative",
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${theme.palette.divider}`,
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}80, ${theme.palette.secondary.main}80)`,
              },
            }}
          >
            <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
              {/* Centered emoji area */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: { xs: 0.25, sm: 1 },
                  mb: { xs: 0.25, sm: 1 },
                }}
              >
                <Skeleton
                  variant="circular"
                  sx={{
                    borderRadius: 2,
                    width: { xs: 24, sm: 32 },
                    height: { xs: 24, sm: 32 },
                  }}
                />
                <Skeleton
                  variant="text"
                  sx={{
                    borderRadius: 1,
                    width: "80%",
                    height: { xs: 16, sm: 24 },
                  }}
                />
              </Box>

              {/* Add button */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: { xs: 0.25, sm: 2 },
                }}
              >
                <Skeleton
                  variant="rounded"
                  sx={{
                    borderRadius: 3,
                    width: { xs: "70%", sm: "100%" },
                    height: { xs: 24, sm: 40 },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </div>
      </Fade>
    ));
  };

  // Empty state renderer
  const renderEmptyState = () => (
    <Box
      sx={{
        gridColumn: "1 / -1",
        textAlign: "center",
        py: 6,
        px: 2,
      }}
    >
      <ProjectIcon
        sx={{
          fontSize: 60,
          color: theme.palette.text.disabled,
          mb: 2,
        }}
      />
      <Typography variant="h6" gutterBottom color="textSecondary">
        No projects yet
      </Typography>
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
      >
        Create your first project to start tracking bugs and ideas.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => setFormOpen(true)}
      >
        Create Project
      </Button>
    </Box>
  );

  // Check if a project's stats are still loading
  const isProjectStatsLoading = (projectId: string) => {
    const query = projectQueries.find((q) => q.data?.projectId === projectId);
    return !query || query.isLoading || query.isFetching;
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 0,
          borderRadius: 2,
          height: "auto",
          overflow: "visible",
          backgroundColor: "background.paper",
        }}
      >
        {/* Header with title and actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            px: 3,
            pt: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}
          >
            <DashboardIcon
              sx={{
                fontSize: { xs: 28, sm: 35 },
                mr: 1,
                color: theme.palette.primary.main,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{
                fontSize: { xs: "1rem", sm: "1.25rem" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Projects
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            sx={{
              border: "1px solid transparent",
              py: 1,
              px: { xs: 2, sm: 3 },
              fontWeight: 500,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              flexShrink: 0,
              whiteSpace: "nowrap",
              "&:hover": {
                border: `1px solid ${theme.palette.grey[500]}`,
                boxShadow: "none",
                backgroundColor: "transparent",
              },
            }}
          >
            New Project
          </Button>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Error display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              Failed to load projects:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </Alert>
          )}

          {/* Create/update error display */}
          {(createError || updateError) && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {createError
                ? `Failed to create project: ${createError}`
                : `Failed to update project: ${updateError}`}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: getGridColumns(),
              gap: { xs: 1, sm: 2 },
              alignItems: "start",
            }}
          >
            {showLoadingSkeletons
              ? renderLoadingSkeletons()
              : filteredProjects.length === 0
                ? renderEmptyState()
                : filteredProjects.map((project, index) => (
                    <Fade in timeout={600 + index * 100} key={project.id}>
                      <div>
                        <ProjectCard
                          project={project}
                          isDeleting={isDeleting}
                          projectColor={projectColors[project.id]}
                          bugCount={projectStats[project.id]?.bugs || 0}
                          ideaCount={projectStats[project.id]?.ideas || 0}
                          isStatsLoading={isProjectStatsLoading(project.id)}
                        />
                      </div>
                    </Fade>
                  ))}
          </Box>
        </Box>
      </Paper>

      {/* Project Form Dialog */}
      <ProjectForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        project={editingProject || undefined}
        isLoading={isCreating || isUpdating}
      />
    </Box>
  );
};
