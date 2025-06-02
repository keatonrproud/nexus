import { useBoardItems } from "@/hooks";
import apiClient from "@/services/apiClient";
import type { BoardItemType, Project } from "@/types";
import {
  Add as AddIcon,
  BugReport as BugIcon,
  Lightbulb as IdeaIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuickAddForm } from "../common/QuickAddForm";

interface ProjectCardProps {
  project: Project;
  isDeleting?: boolean;
  bugCount?: number;
  ideaCount?: number;
  projectColor?: string;
  isStatsLoading?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isDeleting = false,
  bugCount = 0,
  ideaCount = 0,
  projectColor,
  isStatsLoading = false,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<"bug" | "idea">("idea");

  // Local state for optimistic count updates
  const [localBugCount, setLocalBugCount] = useState(bugCount);
  const [localIdeaCount, setLocalIdeaCount] = useState(ideaCount);

  // Update local counts when props change (from server data)
  useEffect(() => {
    setLocalBugCount(bugCount);
  }, [bugCount]);

  useEffect(() => {
    setLocalIdeaCount(ideaCount);
  }, [ideaCount]);

  // Get board items mutation functions
  const { createBoardItem, updateBoardItem, isCreating, isUpdating } =
    useBoardItems(project.id, {});

  // Function to prefetch board data
  const prefetchProjectBoard = () => {
    // Only prefetch if not already loading
    if (!isStatsLoading) {
      // Prefetch board items
      queryClient.prefetchQuery({
        queryKey: ["board-items", project.id],
        queryFn: async () => {
          const response = await apiClient.get(`/board/${project.id}/items`);
          return response.data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    }
  };

  const handleViewProject = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleQuickAdd = (event: React.MouseEvent) => {
    event.stopPropagation();
    setQuickAddType(quickAddType); // Default to bug, user can change in form
    setQuickAddOpen(true);
  };

  const handleQuickAddSuccess = (
    _projectId: string,
    itemType?: BoardItemType,
  ) => {
    setQuickAddOpen(false);

    // Optimistically increment the appropriate count
    if (itemType === "bug") {
      setLocalBugCount((prev) => prev + 1);
    } else if (itemType === "idea") {
      setLocalIdeaCount((prev) => prev + 1);
    }
  };

  // Helper for rendering count chips with loading state
  const renderCountChip = (
    icon: React.ReactElement,
    count: number,
    color: string,
    isLoading: boolean,
  ) => {
    return isLoading ? (
      <Skeleton
        variant="rounded"
        width={60}
        height={28}
        sx={{
          borderRadius: 2,
          width: { xs: 50, sm: 60 },
          height: { xs: 24, sm: 28 },
        }}
      />
    ) : (
      <Chip
        icon={icon}
        label={count}
        size="small"
        sx={{
          backgroundColor: `${color}08`,
          color: color,
          border: `1px solid ${color}20`,
          fontWeight: 600,
          fontSize: { xs: "0.6875rem", sm: "0.75rem" },
          height: { xs: 24, sm: 28 },
          transition: "all 0.2s ease-in-out",
          "& .MuiChip-icon": {
            color: color,
          },
          "&:hover": {
            backgroundColor: `${color}15`,
            borderColor: `${color}40`,
            boxShadow: `0 2px 8px ${color}20`,
          },
        }}
      />
    );
  };

  return (
    <Card
      sx={{
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isDeleting ? 0.6 : 1,
        position: "relative",
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        height: "100%",
        "&:hover": {
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          "& .project-card-header": {
            background: projectColor
              ? `${projectColor}08`
              : `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
          },
          "& .project-card-launch": {
            opacity: 1,
            transform: "translateX(0)",
          },
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: projectColor
            ? projectColor
            : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        },
      }}
      onClick={handleViewProject}
      onMouseEnter={prefetchProjectBoard}
    >
      <CardContent
        sx={{
          p: 0,
          "&:last-child": { pb: 0 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {/* Header Section */}
        <Box
          className="project-card-header"
          sx={{
            p: { xs: 1, sm: 3 },
            pb: { xs: 1, sm: 3 },
            transition: "all 0.3s ease-in-out",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Project Name and Emoji */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.25, sm: 1 },
              mb: { xs: 0.5, sm: 1 },
              flexDirection: { xs: "column", sm: "row" },
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            {project.emoji && (
              <Box
                sx={{
                  fontSize: { xs: "1.5em", sm: "2em" },
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "1em",
                  height: "1em",
                  flexShrink: 0,
                  mb: { xs: 0.25, sm: 0 },
                }}
              >
                {project.emoji}
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.8rem", sm: "1.125rem", md: "1.25rem" },
                  color: theme.palette.text.primary,
                  lineHeight: 1.2,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textAlign: { xs: "center", sm: "left" },
                }}
              >
                {project.name}
              </Typography>

              {/* Project URL Link - hidden on mobile */}
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  mt: 0.5,
                  display: { xs: "none", sm: "block" },
                }}
              >
                <Link
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    color: projectColor || theme.palette.primary.main,
                    textDecoration: "none",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      textDecoration: "underline",
                      color: projectColor || theme.palette.primary.main,
                    },
                  }}
                >
                  {project.url.replace(/^https?:\/\//, "")}
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Mobile-only Compact Add Button */}
          <Box
            sx={{
              display: { xs: "flex", sm: "none" },
              mt: { xs: 0.25, sm: 0 },
              justifyContent: "center", // Center the button
            }}
          >
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: "12px" }} />}
              onClick={handleQuickAdd}
              sx={{
                backgroundColor: projectColor
                  ? `${projectColor}D9`
                  : `${theme.palette.primary.main}D9`, // 85% opacity for lighter color
                color: "white",
                fontSize: "0.65rem",
                fontWeight: 600,
                height: 24, // Even more compact height
                width: "70%", // 70% width instead of full width
                "&:hover": {
                  backgroundColor: projectColor
                    ? `${projectColor}E6`
                    : `${theme.palette.primary.main}E6`, // 90% opacity on hover
                },
              }}
            >
              Add
            </Button>
          </Box>

          {/* Stats Section with Add Button - Hidden on mobile */}
          <Stack
            direction="row"
            spacing={{ xs: 1, sm: 1.5 }}
            alignItems="center"
            marginTop={{ xs: 1, sm: 2 }}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            {renderCountChip(
              <BugIcon sx={{ fontSize: { xs: "14px", sm: "16px" } }} />,
              localBugCount,
              theme.palette.error.main,
              isStatsLoading,
            )}

            {renderCountChip(
              <IdeaIcon sx={{ fontSize: { xs: "14px", sm: "16px" } }} />,
              localIdeaCount,
              theme.palette.primary.main,
              isStatsLoading,
            )}

            <Button
              size="small"
              variant="contained"
              startIcon={
                <AddIcon sx={{ fontSize: { xs: "14px", sm: "16px" } }} />
              }
              onClick={handleQuickAdd}
              sx={{
                backgroundColor: projectColor || theme.palette.primary.main,
                color: "white",
                fontSize: { xs: "0.6875rem", sm: "0.75rem" },
                fontWeight: 600,
                height: { xs: 24, sm: 28 },
                minWidth: "auto",
                px: { xs: 1, sm: 1.5 },
                "&:hover": {
                  backgroundColor: projectColor
                    ? `${projectColor}CC`
                    : theme.palette.primary.dark,
                },
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </CardContent>

      {/* Quick Add Form */}
      {quickAddOpen && (
        <QuickAddForm
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onSuccess={handleQuickAddSuccess}
          defaultType={quickAddType}
          projectId={project.id}
          shouldNavigate={false}
          createBoardItem={createBoardItem}
          updateBoardItem={updateBoardItem}
          isCreating={isCreating}
          isUpdating={isUpdating}
        />
      )}
    </Card>
  );
};
