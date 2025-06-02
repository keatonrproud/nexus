import type {
  BoardItem,
  BoardItemType,
  CreateBoardItemRequest,
  Project,
  UpdateBoardItemRequest,
} from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import { QuickAddForm } from "../common/QuickAddForm";

interface BoardItemProps {
  item: BoardItem;
  project?: Project;
  onEdit?: (item: BoardItem) => void;
  onDelete?: (itemId: string) => void;
  onClick?: (item: BoardItem) => void;
  isLoading?: boolean;
  isDragging?: boolean;
  // Add mutation functions and loading states
  createBoardItem?: (data: CreateBoardItemRequest) => void;
  updateBoardItem?: (itemId: string, data: UpdateBoardItemRequest) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
}

const BoardItem: React.FC<BoardItemProps> = React.memo(
  ({
    item,
    project,
    onEdit,
    onDelete,
    onClick,
    isLoading = false,
    isDragging = false,
    createBoardItem,
    updateBoardItem,
    isCreating,
    isUpdating,
  }) => {
    const theme = useTheme();
    const [isChecked, setIsChecked] = React.useState(false);
    const [editFormOpen, setEditFormOpen] = React.useState(false);
    const [copySuccess, setCopySuccess] = React.useState(false);

    // Drag and drop
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: sortableIsDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: sortableIsDragging ? 0.5 : 1,
    };

    // Memoize event handlers to prevent unnecessary re-renders
    const handleEdit = React.useCallback((event: React.MouseEvent) => {
      event.stopPropagation();
      setEditFormOpen(true);
    }, []);

    const handleEditSuccess = React.useCallback(
      (projectId?: string, itemType?: BoardItemType) => {
        setEditFormOpen(false);
        if (onEdit) {
          onEdit(item);
        }
      },
      [item, onEdit],
    );

    const handleEditClose = React.useCallback(() => {
      setEditFormOpen(false);
    }, []);

    const handleCardClick = React.useCallback(() => {
      onClick?.(item);
    }, [onClick, item]);

    const handleCheckboxChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        event.stopPropagation();
        setIsChecked(event.target.checked);
        if (event.target.checked) {
          setTimeout(() => {
            onDelete?.(item.id);
          }, 300);
        }
      },
      [onDelete, item.id],
    );

    const handleCopy = React.useCallback(
      async (event: React.MouseEvent) => {
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(item.title);
          setCopySuccess(true);
          // Auto-revert after 0.5 seconds
          setTimeout(() => {
            setCopySuccess(false);
          }, 500);
        } catch (error) {
          console.error("Failed to copy text:", error);
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = item.title;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand("copy");
            setCopySuccess(true);
            // Auto-revert after 0.5 seconds
            setTimeout(() => {
              setCopySuccess(false);
            }, 500);
          } catch (fallbackError) {
            console.error("Fallback copy failed:", fallbackError);
          }
          document.body.removeChild(textArea);
        }
      },
      [item.title],
    );

    const handleCopySnackbarClose = React.useCallback(() => {
      setCopySuccess(false);
    }, []);

    return (
      <>
        <Card
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          sx={{
            cursor: isDragging || sortableIsDragging ? "grabbing" : "grab",
            transition: "all 0.15s ease",
            opacity:
              isLoading || isChecked ? 0.7 : sortableIsDragging ? 0.5 : 1,
            transform: isChecked ? "scale(0.98)" : "scale(1)",
            backgroundColor: "white",
            borderRadius: 1.5,
            border: `1px solid ${theme.palette.grey[200]}`,
            minHeight: "auto",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              borderColor: theme.palette.grey[300],
              transform: "translateY(-1px)",
              "& .item-actions": {
                opacity: 1,
              },
            },
            "&:active": {
              cursor: "grabbing",
              transform: "translateY(0px)",
            },
            // Mobile optimizations
            "@media (max-width: 600px)": {
              "& .item-actions": {
                opacity: 1, // Always show on mobile
              },
            },
          }}
          onClick={handleCardClick}
        >
          <CardContent
            sx={{
              p: 1.5,
              "&:last-child": { pb: 1.5 },
              // Ensure content doesn't overflow
              overflow: "hidden",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack spacing={0.5}>
              {/* Header with type and actions */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                {/* Project indicator for cross-app board */}
                {project && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      ml: 0.5,
                      opacity: 0.7,
                    }}
                  >
                    {project.emoji ? (
                      <Box sx={{ fontSize: "1.125rem", lineHeight: 1 }}>
                        {project.emoji}
                      </Box>
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.6875rem",
                          color: theme.palette.text.secondary,
                          lineHeight: 1,
                          maxWidth: 80,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {project.name}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Type indicator - modern minimal style */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor:
                        item.type === "bug"
                          ? theme.palette.error.main
                          : theme.palette.primary.main,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color:
                        item.type === "bug"
                          ? theme.palette.error.main
                          : theme.palette.primary.main,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      lineHeight: 1,
                      opacity: 0.9,
                    }}
                  >
                    {item.type}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Stack
                  direction="row"
                  spacing={0.25}
                  className="item-actions"
                  sx={{
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                    "@media (max-width: 600px)": {
                      opacity: 0.6,
                    },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    sx={{
                      width: 28,
                      height: 28,
                      color: copySuccess
                        ? theme.palette.success.main
                        : theme.palette.text.secondary,
                      transition: "color 0.2s ease",
                      "@media (max-width: 600px)": {
                        color: copySuccess
                          ? theme.palette.success.main
                          : theme.palette.grey[400],
                      },
                      "&:hover": {
                        bgcolor: `${theme.palette.action.hover}`,
                        color: copySuccess
                          ? theme.palette.success.main
                          : theme.palette.info.main,
                      },
                    }}
                    title={copySuccess ? "Copied!" : "Copy title"}
                  >
                    {copySuccess ? (
                      <CheckIcon sx={{ fontSize: "1rem" }} />
                    ) : (
                      <CopyIcon sx={{ fontSize: "1rem" }} />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleEdit}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    sx={{
                      width: 28,
                      height: 28,
                      color: theme.palette.text.secondary,
                      "@media (max-width: 600px)": {
                        color: theme.palette.grey[400],
                      },
                      "&:hover": {
                        bgcolor: `${theme.palette.action.hover}`,
                        color:
                          item.type === "bug"
                            ? theme.palette.error.main
                            : theme.palette.primary.main,
                      },
                    }}
                    title="Edit item"
                  >
                    <EditIcon sx={{ fontSize: "1rem" }} />
                  </IconButton>
                  <Checkbox
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    size="small"
                    sx={{
                      width: 28,
                      height: 28,
                      color: theme.palette.text.secondary,
                      "@media (max-width: 600px)": {
                        color: theme.palette.grey[400],
                      },
                      "&:hover": {
                        bgcolor: `${theme.palette.success.main}15`,
                      },
                      "&.Mui-checked": {
                        color: theme.palette.success.main,
                      },
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    title="Mark as complete"
                  />
                </Stack>
              </Box>

              {/* Title */}
              <Box sx={{ width: "100%" }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.9375rem",
                    lineHeight: 1.4,
                    color: theme.palette.text.primary,
                    textDecoration: isChecked ? "line-through" : "none",
                    // Allow wrapping and set max lines
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                    display: "-webkit-box",
                    WebkitLineClamp: 3, // Max 3 lines
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    width: "100%",
                    // Mobile text size
                    "@media (max-width: 600px)": {
                      fontSize: "0.875rem",
                    },
                  }}
                  title={item.title} // Show full text on hover
                >
                  {item.title}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Edit Form Dialog */}
        <QuickAddForm
          open={editFormOpen}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
          defaultType={item.type}
          projectId={item.project_id}
          editItem={item}
          createBoardItem={createBoardItem}
          updateBoardItem={updateBoardItem}
          isCreating={isCreating}
          isUpdating={isUpdating}
        />
      </>
    );
  },
);

BoardItem.displayName = "BoardItem";

export default BoardItem;
