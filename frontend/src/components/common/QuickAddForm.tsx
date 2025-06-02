import { useProjects } from "@/hooks";
import type {
  BoardItem,
  BoardItemType,
  CreateBoardItemRequest,
  UpdateBoardItemRequest,
} from "@/types";
import {
  BugReport as BugIcon,
  Lightbulb as IdeaIcon,
  Update as LaterIcon,
  Schedule as NowIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";

interface QuickAddFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (projectId: string, itemType?: BoardItemType) => void;
  defaultType: BoardItemType;
  projectId?: string | null; // If null, show project selector
  shouldNavigate?: boolean; // Whether to trigger navigation on success
  editItem?: BoardItem; // If provided, the form will be in edit mode
  // Board item mutation functions passed from parent
  createBoardItem?: (data: CreateBoardItemRequest) => void;
  updateBoardItem?: (itemId: string, data: UpdateBoardItemRequest) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
}

interface FormData {
  title: string;
  projectId: string;
  type: BoardItemType;
  priority: "now" | "later";
}

export const QuickAddForm: React.FC<QuickAddFormProps> = ({
  open,
  onClose,
  onSuccess,
  defaultType,
  projectId,
  shouldNavigate = false,
  editItem,
  createBoardItem,
  updateBoardItem,
  isCreating,
  isUpdating,
}) => {
  const theme = useTheme();
  const { projects } = useProjects();
  const isEditMode = !!editItem;

  // Compute default project ID only when projects change meaningfully
  const defaultProjectId = useMemo(() => {
    return projectId || (projects.length > 0 ? projects[0].id : "");
  }, [projectId, projects]);

  // Initialize form data state based on props
  const [formData, setFormData] = useState<FormData>({
    title: editItem ? editItem.title : "",
    projectId: editItem ? editItem.project_id : defaultProjectId,
    type: editItem ? editItem.type : defaultType,
    priority: editItem ? editItem.priority : "now",
  });

  const [titleError, setTitleError] = useState("");

  // Get the board items hook using the current projectId from formData
  const isLoading = isEditMode ? isUpdating : isCreating;

  // Update form when editItem changes (edit mode)
  useEffect(() => {
    if (editItem) {
      setFormData({
        title: editItem.title,
        projectId: editItem.project_id,
        type: editItem.type,
        priority: editItem.priority,
      });
    }
  }, [editItem]);

  // Update form when defaultType or defaultProjectId changes (create mode)
  useEffect(() => {
    if (!isEditMode) {
      setFormData((prev) => ({
        ...prev,
        type: defaultType,
        projectId: defaultProjectId,
      }));
    }
  }, [defaultType, defaultProjectId, isEditMode]);

  // Reset form when dialog opens/closes but only if not in edit mode
  useEffect(() => {
    if (open && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        title: "",
        priority: "now",
      }));
      setTitleError("");
    }
  }, [open, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate title
    if (!formData.title.trim()) {
      setTitleError("Title is required");
      return;
    }

    if (formData.title.length > 200) {
      setTitleError("Title must be less than 200 characters");
      return;
    }

    try {
      if (isEditMode && editItem) {
        // Handle update
        if (!updateBoardItem) {
          console.error("updateBoardItem function is not provided");
          setTitleError("Unable to update item. Please try again.");
          return;
        }

        const updateData: UpdateBoardItemRequest = {
          title: formData.title.trim(),
          priority: formData.priority,
        };

        updateBoardItem(editItem.id, updateData);
      } else {
        // Handle create
        if (!createBoardItem) {
          console.error("createBoardItem function is not provided");
          setTitleError("Unable to create item. Please try again.");
          return;
        }

        const createData: CreateBoardItemRequest = {
          title: formData.title.trim(),
          type: formData.type,
          priority: formData.priority,
        };

        createBoardItem(createData);
      }

      // Only call onSuccess with projectId if shouldNavigate is true
      if (shouldNavigate) {
        onSuccess(formData.projectId, isEditMode ? undefined : formData.type);
      } else {
        // Otherwise just call onSuccess without args to close the dialog
        onSuccess(formData.projectId, isEditMode ? undefined : formData.type);
      }
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} item:`,
        error,
      );
      setTitleError(
        `Failed to ${isEditMode ? "update" : "create"} item. Please try again.`,
      );
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, title: value }));

    // Clear error when user starts typing
    if (titleError && value.trim()) {
      setTitleError("");
    }
  };

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: BoardItemType,
  ) => {
    if (newType !== null) {
      setFormData((prev) => ({ ...prev, type: newType }));
    }
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          mx: { xs: 1, sm: 2 },
          width: { xs: "calc(100% - 16px)", sm: "100%" },
          maxWidth: { xs: "calc(100% - 16px)", sm: "600px" },
        },
      }}
      onClick={handleDialogClick}
    >
      <form onSubmit={handleSubmit} onClick={handleDialogClick}>
        <DialogContent
          sx={{
            pt: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Stack spacing={3}>
            {/* Project Selector (show if multiple projects exist and not in edit mode) */}
            {projects.length > 1 && !isEditMode && (
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={formData.projectId}
                  label="Project"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      projectId: e.target.value,
                    }))
                  }
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.emoji && (
                        <span style={{ marginRight: "8px", fontSize: "1.2em" }}>
                          {project.emoji}
                        </span>
                      )}
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Type Selection and Priority in same row - Disable type selection in edit mode */}
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Type Selection */}
              <Box sx={{ flex: 2 }}>
                <ToggleButtonGroup
                  value={formData.type}
                  exclusive
                  onChange={handleTypeChange}
                  aria-label="item type"
                  fullWidth
                  disabled={isEditMode} // Disable type editing in edit mode
                  sx={{
                    "& .MuiToggleButton-root": {
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    },
                  }}
                >
                  <ToggleButton
                    value="idea"
                    sx={{
                      borderColor: theme.palette.grey[200],
                      color: theme.palette.primary.main,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: "white",
                      },
                      "&.Mui-selected": {
                        backgroundColor: `${theme.palette.primary.main}15`,
                        borderColor: `${theme.palette.primary.main}15`,
                        color: theme.palette.primary.main,
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: `${theme.palette.primary.main}15`,
                        },
                      },
                    }}
                  >
                    <IdeaIcon sx={{ mr: 1 }} />
                    Idea
                  </ToggleButton>
                  <ToggleButton
                    value="bug"
                    sx={{
                      borderColor: theme.palette.grey[200],
                      color: theme.palette.error.main,
                      "&:hover": {
                        borderColor: theme.palette.error.main,
                        backgroundColor: "white",
                      },
                      "&.Mui-selected": {
                        backgroundColor: `${theme.palette.error.main}15`,
                        borderColor: `${theme.palette.error.main}15`,
                        color: theme.palette.error.main,
                        "&:hover": {
                          borderColor: theme.palette.error.main,
                          backgroundColor: `${theme.palette.error.main}15`,
                        },
                      },
                    }}
                  >
                    <BugIcon sx={{ mr: 1 }} />
                    Bug
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Stack>

            {/* Priority Selection */}
            <ToggleButtonGroup
              value={formData.priority}
              exclusive
              onChange={(_e, newPriority) => {
                if (newPriority !== null) {
                  setFormData((prev) => ({
                    ...prev,
                    priority: newPriority as FormData["priority"],
                  }));
                }
              }}
              aria-label="priority"
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: "capitalize",
                },
              }}
            >
              <ToggleButton
                value="now"
                sx={{
                  borderColor: theme.palette.grey[200],
                  color: theme.palette.grey[500],
                  "&:hover": {
                    borderColor: theme.palette.warning.main,
                    backgroundColor: "white",
                    color: theme.palette.warning.main,
                  },
                  "&.Mui-selected": {
                    backgroundColor: `${theme.palette.warning.main}15`,
                    borderColor: `${theme.palette.warning.main}15`,
                    color: theme.palette.warning.main,
                    "&:hover": {
                      borderColor: theme.palette.warning.main,
                      backgroundColor: `${theme.palette.warning.main}15`,
                    },
                  },
                }}
              >
                <NowIcon sx={{ mr: 1 }} />
                Now
              </ToggleButton>
              <ToggleButton
                value="later"
                sx={{
                  borderColor: theme.palette.grey[200],
                  color: theme.palette.grey[500],
                  "&:hover": {
                    borderColor: theme.palette.info.main,
                    backgroundColor: "white",
                    color: theme.palette.info.main,
                  },
                  "&.Mui-selected": {
                    backgroundColor: `${theme.palette.info.main}15`,
                    borderColor: `${theme.palette.info.main}15`,
                    color: theme.palette.info.main,
                    "&:hover": {
                      borderColor: theme.palette.info.main,
                      backgroundColor: `${theme.palette.info.main}15`,
                    },
                  },
                }}
              >
                <LaterIcon sx={{ mr: 1 }} />
                Later
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Title */}
            <TextField
              label="Description"
              value={formData.title}
              onChange={handleTitleChange}
              error={!!titleError}
              helperText={titleError}
              fullWidth
              required
              autoFocus
              multiline
              minRows={2}
              maxRows={6}
              placeholder={
                formData.type === "bug"
                  ? "e.g., Login button not working on mobile"
                  : "e.g., Add dark mode toggle to settings"
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 1 }}
        >
          <Button
            type="submit"
            variant="contained"
            loading={isLoading}
            sx={{
              minWidth: 120,
              border: 1,
              color: "black",
              borderColor: theme.palette.grey[200],
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                borderColor: theme.palette.primary.main,
                backgroundColor: `${theme.palette.primary.main}15`,
                borderWidth: 1,
                color: "black",
              },
            }}
          >
            {isEditMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
