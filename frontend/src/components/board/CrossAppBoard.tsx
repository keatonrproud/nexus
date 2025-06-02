import { useAllBoardItems, useProjects } from "@/hooks";
import React from "react";
import { QuickAddForm } from "../common/QuickAddForm";

// Import components directly to avoid TypeScript module issues
const BoardItem = React.lazy(() => import("./BoardItem"));

import type {
  BoardItem as BoardItemType,
  BoardItemType as BoardItemTypeEnum,
} from "@/types";
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
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CardContent,
  CardHeader,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

const CrossAppBoard: React.FC = () => {
  const theme = useTheme();

  // Data hooks
  const { projects } = useProjects();
  const {
    boardItems,
    isLoading: itemsLoading,
    error: itemsError,
    updateBoardItem,
    deleteBoardItem,
    isUpdating,
  } = useAllBoardItems({});

  // UI state
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [editItemOpen, setEditItemOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<
    BoardItemType | undefined
  >();
  const [defaultType, setDefaultType] =
    React.useState<BoardItemTypeEnum>("idea");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [itemPositions, setItemPositions] = React.useState<
    Record<string, number>
  >({});
  const [dragTargetColumn, setDragTargetColumn] = React.useState<
    "now" | "later" | null
  >(null);

  // Create a projects lookup for efficient access
  const projectsMap = React.useMemo(() => {
    const map = new Map();
    projects.forEach((project) => map.set(project.id, project));
    return map;
  }, [projects]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Initialize item positions
  React.useEffect(() => {
    if (boardItems.length > 0 && Object.keys(itemPositions).length === 0) {
      const positions: Record<string, number> = {};
      boardItems.forEach((item, index) => {
        positions[item.id] = index;
      });
      setItemPositions(positions);
    }
  }, [boardItems, itemPositions]);

  // Event handlers
  const handleCreateItem = (type: BoardItemTypeEnum) => {
    setDefaultType(type);
    setQuickAddOpen(true);
  };

  const handleEditItem = (item: BoardItemType) => {
    setSelectedItem(item);
    setEditItemOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    const item = boardItems.find((i) => i.id === itemId);
    if (item) {
      deleteBoardItem(item.project_id, itemId);
    }
  };

  const handleQuickAddClose = () => {
    setQuickAddOpen(false);
  };

  const handleQuickAddSuccess = () => {
    setQuickAddOpen(false);
  };

  const handleEditItemClose = () => {
    setEditItemOpen(false);
    setSelectedItem(undefined);
  };

  const handleEditItemSuccess = () => {
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
    const activeItem = boardItems.find((item) => item.id === active.id);
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
      const overItem = boardItems.find((item) => item.id === over.id);
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
      const columnItems = boardItems.filter(
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
        console.log(
          `Reordered ${activeItem.title} within ${activeItem.priority} column`,
        );
      }
    }
    // Handle moving between columns
    else if (targetPriority && targetPriority !== activeItem.priority) {
      updateBoardItem(activeItem.project_id, activeItem.id, {
        priority: targetPriority,
      });
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
      const overItem = boardItems.find((item) => item.id === over.id);
      if (overItem) {
        setDragTargetColumn(overItem.priority);
      }
    }
  };

  // Helper functions for Now/Later sections
  const getSortedItemsBySection = (section: "now" | "later") => {
    return boardItems
      .filter((item) => item.priority === section)
      .sort((a, b) => (itemPositions[a.id] ?? 0) - (itemPositions[b.id] ?? 0));
  };

  const nowItems = getSortedItemsBySection("now");
  const laterItems = getSortedItemsBySection("later");

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
              All Tasks
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

        {/* Error State */}
        {itemsError && (
          <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
            Failed to load tasks.
          </Alert>
        )}

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
                      backgroundColor: "rgba(255, 152, 0, 0.05)",
                      borderColor: theme.palette.warning.main,
                      transition: "all 0.2s ease-in-out",
                    }),
                }}
              >
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                        {itemsLoading ? "–" : nowItems.length}
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
                  {itemsLoading ? (
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
                          nowItems.map((item, index) => (
                            <Box
                              key={item.id}
                              sx={{
                                ...(index === nowItems.length - 1 && {
                                  marginBottom: 3,
                                }),
                              }}
                            >
                              <React.Suspense fallback={<ItemSkeleton />}>
                                <BoardItem
                                  item={item}
                                  project={projectsMap.get(item.project_id)}
                                  onEdit={handleEditItem}
                                  onDelete={handleDeleteItem}
                                  onClick={handleEditItem}
                                  isLoading={itemsLoading}
                                  isUpdating={isUpdating}
                                />
                              </React.Suspense>
                            </Box>
                          ))
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
                      backgroundColor: "rgba(33, 150, 243, 0.05)",
                      borderColor: theme.palette.info.main,
                      transition: "all 0.2s ease-in-out",
                    }),
                }}
              >
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                        {itemsLoading ? "–" : laterItems.length}
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
                  {itemsLoading ? (
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
                          laterItems.map((item, index) => (
                            <Box
                              key={item.id}
                              sx={{
                                ...(index === laterItems.length - 1 && {
                                  marginBottom: 3,
                                }),
                              }}
                            >
                              <React.Suspense fallback={<ItemSkeleton />}>
                                <BoardItem
                                  item={item}
                                  project={projectsMap.get(item.project_id)}
                                  onEdit={handleEditItem}
                                  onDelete={handleDeleteItem}
                                  onClick={handleEditItem}
                                  isLoading={itemsLoading}
                                  isUpdating={isUpdating}
                                />
                              </React.Suspense>
                            </Box>
                          ))
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

      {/* Forms */}
      <React.Suspense fallback={null}>
        <QuickAddForm
          open={quickAddOpen}
          onClose={handleQuickAddClose}
          onSuccess={handleQuickAddSuccess}
          defaultType={defaultType}
          shouldNavigate={false}
        />

        {selectedItem && (
          <QuickAddForm
            open={editItemOpen}
            onClose={handleEditItemClose}
            onSuccess={handleEditItemSuccess}
            defaultType={selectedItem.type}
            projectId={selectedItem.project_id}
            shouldNavigate={false}
            editItem={selectedItem}
            updateBoardItem={(itemId, data) =>
              updateBoardItem(selectedItem.project_id, itemId, data)
            }
            isUpdating={isUpdating}
          />
        )}
      </React.Suspense>
    </Box>
  );
};

export default CrossAppBoard;
