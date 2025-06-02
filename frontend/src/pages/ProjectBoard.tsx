import { Layout } from "@/components/common";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useAuth, useBoardItems, useProject, useProjects } from "@/hooks";
import type { BoardItem, BoardItemType, UpdateProjectRequest } from "@/types";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CardContent,
  CardHeader,
  Container,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

// Import components directly to avoid TypeScript module issues
const BoardItem = React.lazy(() => import("@/components/board/BoardItem"));
const KPIDashboard = React.lazy(
  () => import("@/components/analytics/KPIDashboard"),
);
// const DetailedAnalytics = React.lazy(() => import('@/components/analytics/DetailedAnalytics'));
const QuickAddForm = React.lazy(() =>
  import("@/components/common/QuickAddForm").then((module) => ({
    default: module.QuickAddForm,
  })),
);

const ProjectBoard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { projectId } = useParams<{ projectId: string }>();
  const { isAuthenticated } = useAuth();

  // Data hooks
  const {
    project,
    isLoading: projectLoading,
    error: projectError,
  } = useProject(projectId || "");
  const {
    deleteProject,
    updateProject,
    isDeleting: isDeletingProject,
    isUpdating: isUpdatingProject,
  } = useProjects();
  const {
    boardItems,
    isLoading: itemsLoading,
    error: itemsError,
    updateBoardItem,
    deleteBoardItem,
    createBoardItem,
    isCreating,
    isUpdating,
  } = useBoardItems(projectId || "", {});

  // UI state
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [editItemOpen, setEditItemOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<
    BoardItem | undefined
  >();
  const [defaultType, setDefaultType] = React.useState<BoardItemType>("bug");
  const [projectEditOpen, setProjectEditOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [itemPositions, setItemPositions] = React.useState<
    Record<string, number>
  >({});
  const [dragTargetColumn, setDragTargetColumn] = React.useState<
    "now" | "later" | null
  >(null);
  const [isProjectDeleted, setIsProjectDeleted] = React.useState(false);

  // Use optimistic items when available, otherwise use real items
  const displayItems = boardItems;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated && !projectLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, projectLoading, navigate]);

  // Navigate back to dashboard after successful deletion
  React.useEffect(() => {
    if (isProjectDeleted && !isDeletingProject) {
      navigate("/");
    }
  }, [isProjectDeleted, isDeletingProject, navigate]);

  // Handle case where project is not found or was deleted externally
  React.useEffect(() => {
    if (
      !projectLoading &&
      !project &&
      projectId &&
      !isDeletingProject &&
      !isProjectDeleted
    ) {
      // Project doesn't exist, navigate back to dashboard
      navigate("/");
    }
  }, [
    projectLoading,
    project,
    projectId,
    isDeletingProject,
    isProjectDeleted,
    navigate,
  ]);

  // Initialize item positions
  React.useEffect(() => {
    if (displayItems.length > 0 && Object.keys(itemPositions).length === 0) {
      const positions: Record<string, number> = {};
      displayItems.forEach((item, index) => {
        positions[item.id] = index;
      });
      setItemPositions(positions);
    }
  }, [displayItems, itemPositions]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (!projectId) {
    return (
      <Layout>
        <Alert severity="error" sx={{ borderRadius: 2, m: 2 }}>
          Invalid project ID
        </Alert>
      </Layout>
    );
  }

  // Event handlers
  const handleBackToProjects = () => navigate("/");
  const handleEditProject = () => {
    setProjectEditOpen(true);
  };
  const handleUpdateProject = (data: UpdateProjectRequest) => {
    if (project) {
      updateProject(project.id, data);
      setProjectEditOpen(false);
    }
  };
  const handleProjectEditClose = () => setProjectEditOpen(false);
  const handleDeleteProject = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${project?.name}"? This action cannot be undone and will delete all associated bugs and ideas.`,
      )
    ) {
      try {
        await deleteProject(projectId!);
        setIsProjectDeleted(true);
        // Navigation will be handled by useEffect
      } catch (error) {
        console.error("Failed to delete project:", error);
        // Error handling is done by the deleteProject function
      }
    }
  };
  const handleCreateItem = (type: BoardItemType) => {
    setDefaultType(type);
    setQuickAddOpen(true);
  };
  const handleEditItem = (item: BoardItem) => {
    setSelectedItem(item);
    setEditItemOpen(true);
  };
  const handleDeleteItem = (itemId: string) => {
    // Perform actual deletion
    deleteBoardItem(itemId);
  };
  const handleQuickAddClose = () => {
    setQuickAddOpen(false);
  };
  const handleQuickAddSuccess = (
    _projectId?: string,
    _itemType?: BoardItemType,
  ) => {
    setQuickAddOpen(false);
  };
  const handleEditItemClose = () => {
    setEditItemOpen(false);
    setSelectedItem(undefined);
  };
  const handleEditItemSuccess = (
    _projectId?: string,
    _itemType?: BoardItemType,
  ) => {
    setEditItemOpen(false);
    setSelectedItem(undefined);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset drag state
    setActiveId(null);
    setDragTargetColumn(null);

    if (!over) return;

    // Get the active item
    const activeItem = displayItems.find((item) => item.id === active.id);
    if (!activeItem) return;

    let targetPriority: "now" | "later" | null = null;
    let shouldReorder = false;

    // Determine target priority and if we should reorder
    if (over.id === "now-column") {
      targetPriority = "now";
    } else if (over.id === "later-column") {
      targetPriority = "later";
    } else {
      // Dropped on another item
      const overItem = displayItems.find((item) => item.id === over.id);
      if (overItem) {
        targetPriority = overItem.priority;

        // Check if we're reordering within the same column
        if (activeItem.priority === overItem.priority) {
          shouldReorder = true;
        }
      }
    }

    // Handle reordering within the same column
    if (shouldReorder && active.id !== over.id) {
      const columnItems = displayItems.filter(
        (item) => item.priority === activeItem.priority,
      );
      const oldIndex = columnItems.findIndex((item) => item.id === active.id);
      const newIndex = columnItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Create new positions mapping for the reordered items
        const reorderedItems = arrayMove(columnItems, oldIndex, newIndex);
        const newPositions = { ...itemPositions };

        // Update positions for all items in this column
        reorderedItems.forEach((item, index) => {
          newPositions[item.id] = index;
        });

        setItemPositions(newPositions);

        // TODO: In a real app, you might want to send the new order to the backend
        // For now, we'll just update the local state
        console.log(
          `Reordered ${activeItem.title} within ${activeItem.priority} column`,
        );
      }
    }
    // Handle moving between columns
    else if (targetPriority && targetPriority !== activeItem.priority) {
      updateBoardItem(activeItem.id, { priority: targetPriority });
    }
  };

  // Handle drag over for visual feedback
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (!over) {
      setDragTargetColumn(null);
      return;
    }

    // Check if we're over a column directly
    if (over.id === "now-column") {
      setDragTargetColumn("now");
    } else if (over.id === "later-column") {
      setDragTargetColumn("later");
    } else {
      // We're over an item - determine which column it's in
      const overItem = displayItems.find((item) => item.id === over.id);
      if (overItem) {
        setDragTargetColumn(overItem.priority);
      }
    }
  };

  // Helper functions for Now/Later sections
  const getSortedItemsBySection = (section: "now" | "later") => {
    return displayItems
      .filter((item) => item.priority === section)
      .sort((a, b) => (itemPositions[a.id] ?? 0) - (itemPositions[b.id] ?? 0));
  };

  const nowItems = getSortedItemsBySection("now");
  const laterItems = getSortedItemsBySection("later");

  const isLoading = projectLoading || itemsLoading;
  const error = projectError || itemsError;

  // Droppable column components
  const DroppableColumn = ({
    children,
    id,
    ...props
  }: {
    children: React.ReactNode;
    id: string;
    style?: React.CSSProperties;
    className?: string;
  }) => {
    const { setNodeRef } = useDroppable({ id });
    return (
      <div ref={setNodeRef} {...props}>
        {children}
      </div>
    );
  };

  // Skeleton for board items
  const ItemSkeleton = () => (
    <Skeleton
      variant="rounded"
      height={60}
      sx={{
        borderRadius: 2,
        bgcolor: "grey.100",
      }}
    />
  );

  // Render skeleton columns for loading state
  const renderSkeletonColumn = () => (
    <Stack spacing={2}>
      <ItemSkeleton />
      <ItemSkeleton />
      <ItemSkeleton />
      <ItemSkeleton />
    </Stack>
  );

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Header with Project Info */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <IconButton
              onClick={handleBackToProjects}
              sx={{
                borderRadius: 2,
                bgcolor: "white",
                "&:hover": {
                  bgcolor: "grey.100",
                  border: 0,
                },
                boxShadow: 1,
                flexShrink: 0,
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            {project && !projectLoading ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ minWidth: 0, flex: 1 }}
              >
                {project.emoji && (
                  <Box
                    sx={{
                      fontSize: { xs: "1.75rem", sm: "2.25rem" },
                      flexShrink: 0,
                    }}
                  >
                    {project.emoji}
                  </Box>
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      mb: 0,
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.name}
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  sx={{ mr: 2, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton
                    variant="text"
                    width="100%"
                    height={32}
                    sx={{ borderRadius: 1, maxWidth: 150 }}
                  />
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={20}
                    sx={{ borderRadius: 1, maxWidth: 100 }}
                  />
                </Box>
              </Box>
            )}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 1, sm: 2 }}
            sx={{ flexShrink: 0 }}
          >
            <IconButton
              onClick={handleEditProject}
              sx={{
                borderRadius: 2,
                bgcolor: "white",
                "&:hover": { bgcolor: "grey.100" },
                boxShadow: 1,
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
              }}
            >
              <EditIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
            <IconButton
              onClick={handleDeleteProject}
              disabled={isDeletingProject}
              sx={{
                borderRadius: 2,
                bgcolor: "white",
                color: "error.light",
                "&:hover": { bgcolor: "error.main", color: "white" },
                boxShadow: 1,
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
              }}
            >
              <DeleteIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          </Stack>
        </Stack>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Failed to load project data.
          </Alert>
        )}

        {/* Bug/Idea Board */}
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
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0,
                }}
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
                  Task Board
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleCreateItem("idea")}
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
                Add Item
              </Button>
            </Box>
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 2, sm: 3 },
                  justifyContent: "center",
                  maxWidth: { xs: "100%", sm: 900 },
                  mx: "auto",
                  p: 3,
                  alignItems: "stretch",
                }}
              >
                {/* Now Column */}
                <DroppableColumn id="now-column">
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      minWidth: { xs: 0, sm: 300 },
                      maxWidth: "100%",
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      // Add highlighting for drag target
                      ...(dragTargetColumn === "now" &&
                        activeId && {
                          backgroundColor: "rgba(255, 152, 0, 0.05)", // Light orange background to match warning
                          borderColor: theme.palette.warning.main,
                          transition: "all 0.2s ease-in-out",
                        }),
                    }}
                  >
                    <CardHeader
                      title={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: theme.palette.warning.main,
                            }}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Now
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              bgcolor: "grey.100",
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              fontSize: "0.75rem",
                              fontWeight: 500,
                            }}
                          >
                            {isLoading ? "–" : nowItems.length}
                          </Typography>
                        </Box>
                      }
                      sx={{ pb: 1 }}
                    />
                    <Divider />
                    <CardContent
                      sx={{
                        flex: 1,
                        overflow: "auto",
                        p: { xs: 1, sm: 1.5 },
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {isLoading ? (
                        renderSkeletonColumn()
                      ) : (
                        <SortableContext
                          items={nowItems.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Stack spacing={1} sx={{ flex: 1 }}>
                            {nowItems.length === 0 ? (
                              <Box
                                sx={{
                                  textAlign: "center",
                                  py: 4,
                                  color: "text.secondary",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ mb: { xs: 1, sm: 2 } }}
                                >
                                  No urgent items
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => handleCreateItem("bug")}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Add Item
                                </Button>
                              </Box>
                            ) : (
                              <React.Suspense fallback={renderSkeletonColumn()}>
                                {nowItems.map((item, index) => (
                                  <Box
                                    key={item.id}
                                    sx={{
                                      ...(index === nowItems.length - 1 && {
                                        marginBottom: 3,
                                      }),
                                    }}
                                  >
                                    <BoardItem
                                      item={item}
                                      onEdit={handleEditItem}
                                      onDelete={handleDeleteItem}
                                      onClick={handleEditItem}
                                      isLoading={isLoading}
                                      createBoardItem={createBoardItem}
                                      updateBoardItem={updateBoardItem}
                                      isCreating={isCreating}
                                      isUpdating={isUpdating}
                                    />
                                  </Box>
                                ))}
                              </React.Suspense>
                            )}
                          </Stack>
                        </SortableContext>
                      )}
                    </CardContent>
                  </Paper>
                </DroppableColumn>

                {/* Later Column */}
                <DroppableColumn id="later-column">
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      minWidth: { xs: 0, sm: 300 },
                      maxWidth: "100%",
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      // Add highlighting for drag target
                      ...(dragTargetColumn === "later" &&
                        activeId && {
                          backgroundColor: "rgba(33, 150, 243, 0.05)", // Light blue background
                          borderColor: theme.palette.info.main,
                          transition: "all 0.2s ease-in-out",
                        }),
                    }}
                  >
                    <CardHeader
                      title={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: theme.palette.info.main,
                            }}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Later
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              bgcolor: "grey.100",
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              fontSize: "0.75rem",
                              fontWeight: 500,
                            }}
                          >
                            {isLoading ? "–" : laterItems.length}
                          </Typography>
                        </Box>
                      }
                      sx={{ pb: 1 }}
                    />
                    <Divider />
                    <CardContent
                      sx={{
                        flex: 1,
                        overflow: "auto",
                        p: { xs: 1, sm: 1.5 },
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {isLoading ? (
                        renderSkeletonColumn()
                      ) : (
                        <SortableContext
                          items={laterItems.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Stack spacing={1} sx={{ flex: 1 }}>
                            {laterItems.length === 0 ? (
                              <Box
                                sx={{
                                  textAlign: "center",
                                  py: 4,
                                  color: "text.secondary",
                                  mb: 2,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ mb: { xs: 1, sm: 2 } }}
                                >
                                  No future items
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => handleCreateItem("idea")}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Add Item
                                </Button>
                              </Box>
                            ) : (
                              <React.Suspense fallback={renderSkeletonColumn()}>
                                {laterItems.map((item, index) => (
                                  <Box
                                    key={item.id}
                                    sx={{
                                      ...(index === laterItems.length - 1 && {
                                        marginBottom: 3,
                                      }),
                                    }}
                                  >
                                    <BoardItem
                                      item={item}
                                      onEdit={handleEditItem}
                                      onDelete={handleDeleteItem}
                                      onClick={handleEditItem}
                                      isLoading={isLoading}
                                      createBoardItem={createBoardItem}
                                      updateBoardItem={updateBoardItem}
                                      isCreating={isCreating}
                                      isUpdating={isUpdating}
                                    />
                                  </Box>
                                ))}
                              </React.Suspense>
                            )}
                          </Stack>
                        </SortableContext>
                      )}
                    </CardContent>
                  </Paper>
                </DroppableColumn>
              </Box>
            </DndContext>
          </Paper>
        </Box>

        {/* Analytics Section */}
        <Box sx={{ mt: 2 }}>
          <Paper
            sx={{
              p: 0,
              borderRadius: 2,
              height: "auto",
              overflow: "visible",
              backgroundColor: "background.paper",
            }}
          >
            <Box sx={{ height: "auto" }}>
              <React.Suspense
                fallback={
                  <Box sx={{ p: 3 }}>
                    <Skeleton
                      variant="rectangular"
                      height={80}
                      sx={{ mb: 2, borderRadius: 2 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={300}
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>
                }
              >
                <KPIDashboard projectId={projectId} />
              </React.Suspense>
            </Box>
          </Paper>
        </Box>

        {/* Forms */}
        <React.Suspense fallback={null}>
          <QuickAddForm
            open={quickAddOpen}
            onClose={handleQuickAddClose}
            onSuccess={handleQuickAddSuccess}
            defaultType={defaultType}
            projectId={projectId}
            shouldNavigate={false}
            createBoardItem={createBoardItem}
            updateBoardItem={updateBoardItem}
            isCreating={isCreating}
            isUpdating={isUpdating}
          />

          {selectedItem && (
            <QuickAddForm
              open={editItemOpen}
              onClose={handleEditItemClose}
              onSuccess={handleEditItemSuccess}
              defaultType={selectedItem.type}
              projectId={projectId}
              shouldNavigate={false}
              editItem={selectedItem}
              createBoardItem={createBoardItem}
              updateBoardItem={updateBoardItem}
              isCreating={isCreating}
              isUpdating={isUpdating}
            />
          )}

          <ProjectForm
            open={projectEditOpen}
            onClose={handleProjectEditClose}
            onSubmit={handleUpdateProject}
            project={project}
            isLoading={isUpdatingProject}
          />
        </React.Suspense>
      </Container>
    </Layout>
  );
};

export default ProjectBoard;
